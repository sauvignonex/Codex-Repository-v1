"""One local transcription job; no network or shell command construction."""
from pathlib import Path
import json, os, re, shutil, subprocess, sys, time, wave

class Cancelled(Exception):
    pass

def atomic_json(path, data):
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(data, ensure_ascii=False), encoding='utf-8')
    temporary.replace(path)

def words_from_segments(segments):
    result = []
    for segment in segments:
        start, end = int(segment['offsets']['from']), int(segment['offsets']['to'])
        text = segment['text'].strip()
        if end <= start or not text or re.fullmatch(r'[\[\(].*[\]\)]', text):
            continue
        tokens = [t for t in segment.get('tokens', []) if not t.get('text', '').startswith('[_') and not t.get('text', '').startswith('<|')]
        grouped = []
        for token in tokens:
            body = token.get('text', '')
            if not body.strip():
                continue
            offsets = token.get('offsets', {})
            a, b = offsets.get('from', -1), offsets.get('to', -1)
            if not grouped or body[:1].isspace():
                grouped.append({'text': body.strip(), 'start': a, 'end': b, 'confidence': token.get('p', 1)})
            else:
                grouped[-1]['text'] += body
                grouped[-1]['end'] = b
                grouped[-1]['confidence'] = min(grouped[-1]['confidence'], token.get('p', 1))
        # A decoder token can span several words. Keep lexical words, never JSON tokens.
        if not grouped or [w['text'] for w in grouped] != text.split():
            grouped = [{'text': w, 'start': -1, 'end': -1, 'confidence': None} for w in text.split()]
        weights = [max(1, len(w['text'])) for w in grouped]
        total, consumed = sum(weights), 0
        previous = start
        for word, weight in zip(grouped, weights):
            a, b = word['start'], word['end']
            exact = isinstance(a, (int, float)) and isinstance(b, (int, float)) and start <= a < b <= end and a >= previous
            if not exact:
                a = max(previous, start + round((end-start)*consumed/total))
                b = max(a+1, start + round((end-start)*(consumed+weight)/total))
            word.update(start=int(a), end=int(b), estimated=not exact)
            consumed += weight
            previous = word['end']
            result.append(word)
    return result

def run_job(job_file):
    job_file = Path(job_file).resolve()
    job = json.loads(job_file.read_text(encoding='utf-8-sig'))
    folder = job_file.parent
    status = folder/'status.json'
    def report(phase, message, **extra):
        atomic_json(status, {'id': job['id'], 'phase': phase, 'message': message, **extra})
    def run(args, phase, message, cwd=None):
        report(phase, message)
        log = folder/(phase+'.log')
        with log.open('wb') as output:
            process = subprocess.Popen(args, cwd=cwd, stdout=output, stderr=subprocess.STDOUT, creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
            try:
                deadline = time.monotonic()+3600
                while process.poll() is None:
                    if (folder/'cancel').exists():
                        raise Cancelled()
                    if time.monotonic() > deadline:
                        raise RuntimeError('Распознавание превысило час. Раздели файл на части.')
                    if phase == 'recognizing':
                        matches = re.findall(r'progress\s*=\s*(\d+)%', log.read_text(encoding='utf-8', errors='replace'))
                        if matches:
                            report(phase, message, progress=min(99, int(matches[-1])))
                    time.sleep(.4)
            finally:
                if process.poll() is None:
                    process.terminate()
                    try:
                        process.wait(5)
                    except subprocess.TimeoutExpired:
                        process.kill()
                        process.wait()
        if process.returncode:
            raise RuntimeError('Движок завершился с ошибкой. '+log.read_text(encoding='utf-8', errors='replace')[-1200:])
    try:
        input_file = Path(job['input']).resolve()
        if not input_file.is_file() or input_file.suffix.lower() not in {'.wav','.mp3','.m4a','.aac','.flac','.ogg','.mp4','.mov','.mkv','.webm'}:
            raise ValueError('Выбери поддерживаемый аудио- или видеофайл.')
        if input_file.stat().st_size > 10*1024**3:
            raise ValueError('Файл больше 10 ГБ. Выбери короткий фрагмент.')
        config = json.loads((Path(__file__).parent/'transcription-config.json').read_text(encoding='utf-8-sig'))
        for key in ['ffmpeg', 'whisper', 'model']:
            if not Path(config[key]).is_file():
                raise RuntimeError('Не найден локальный движок: '+key+'. Выполни установку транскрипции.')
        language = job.get('language', 'ru')
        if language not in {'ru','en','auto'}:
            raise ValueError('Неподдерживаемый язык.')
        if (folder/'cancel').exists():
            raise Cancelled()
        selection=job.get('selection')
        trim=[]
        if selection is not None:
            for key in ['sourceInMs','durationMs','timelineStartMs']:
                value=selection.get(key)
                if not isinstance(value,(int,float)) or not 0<=value<=24*3600000:
                    raise ValueError('Некорректные границы выделенного аудиоклипа.')
            if selection['durationMs']<=0 or selection['durationMs']>7200000:
                raise ValueError('Выдели аудиоклип длительностью до двух часов.')
            trim=['-ss',str(selection['sourceInMs']/1000),'-t',str(selection['durationMs']/1000)]
        wav = folder/'audio.wav'
        run([config['ffmpeg'],'-hide_banner','-loglevel','error','-nostdin','-y','-i',str(input_file),*trim,'-vn','-ar','16000','-ac','1','-c:a','pcm_s16le',str(wav)], 'converting', 'Подготавливаем звук…')
        with wave.open(str(wav)) as audio:
            duration = audio.getnframes()/audio.getframerate()
            audible=False
            while True:
                samples=audio.readframes(16000)
                if not samples:break
                if any(samples):audible=True;break
            if not audible:raise ValueError('В записи тишина. Выбери файл с речью.')
        if duration <= 0 or duration > 7200:
            raise ValueError('Поддерживаются записи длительностью до двух часов.')
        out = folder/'transcript'
        run([config['whisper'],'-m',Path(config['model']).name,'-f',str(wav),'-l',language,'-ojf','-osrt','-of',str(out),'-pp','-t','4','-ml','1','-sow'], 'recognizing', 'Распознаём речь на этом компьютере…', cwd=str(Path(config['model']).parent))
        raw = json.loads(out.with_suffix('.json').read_text(encoding='utf-8-sig'))
        words = words_from_segments(raw.get('transcription', []))
        if not words:
            raise ValueError('Речь не найдена. Проверь звук выбранного файла.')
        extra={}
        if selection:
            for word in words:
                word['start']+=round(selection['timelineStartMs'])
                word['end']+=round(selection['timelineStartMs'])
            preview=folder/'preview.wav'
            shutil.copyfile(wav,preview)
            extra['previewMedia']={'path':str(preview),'startMs':round(selection['timelineStartMs'])}
        report('complete', 'Речь распознана. Проверь имена и тайминги.', durationMs=round(duration*1000), name=selection.get('name',input_file.name) if selection else input_file.name, words=words, language=raw.get('result', {}).get('language', language), **extra)
    except Cancelled:
        report('cancelled', 'Распознавание отменено. Текущие субтитры сохранены.')
    except Exception as error:
        report('error', str(error))
    finally:
        # Keep recognition JSON/SRT and diagnostics; remove the intermediate audio.
        (folder/'audio.wav').unlink(missing_ok=True)

if __name__ == '__main__':
    run_job(sys.argv[1])
