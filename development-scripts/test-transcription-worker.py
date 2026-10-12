from pathlib import Path
import importlib.util,json,tempfile,wave
root=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('worker',root/'premiere-subtitles-cep/transcription-worker.py');w=importlib.util.module_from_spec(spec);spec.loader.exec_module(w)
checks=[]
segment={'offsets':{'from':100,'to':900},'text':'Красивые субтитры','tokens':[{'text':' Красивые','offsets':{'from':100,'to':400},'p':.9},{'text':' суб','offsets':{'from':450,'to':650},'p':.8},{'text':'титры','offsets':{'from':650,'to':900},'p':.85}]}
words=w.words_from_segments([segment]);assert [x['text'] for x in words]==['Красивые','субтитры'];assert all(not x['estimated'] for x in words);checks.append('subword tokens reconstruct timed words')
segment['tokens']=[];words=w.words_from_segments([segment]);assert all(x['estimated'] for x in words);assert words[0]['start']==100 and words[-1]['end']==900;checks.append('missing token offsets explicitly approximate')
assert w.words_from_segments([{'offsets':{'from':0,'to':100},'text':'[Музыка]'}])==[];checks.append('non speech annotations excluded')
with tempfile.TemporaryDirectory(prefix='subtitle-test-') as temp:
 p=Path(temp)
 job=p/'job.json';job.write_text(json.dumps({'id':'test','input':str(p/'missing.mp3')}),encoding='utf8');w.run_job(job);assert json.loads((p/'status.json').read_text(encoding='utf8'))['phase']=='error';checks.append('missing audio returns recoverable error')
 audio=p/'silence.wav'
 with wave.open(str(audio),'wb') as a:a.setparams((1,2,16000,0,'NONE','not compressed'));a.writeframes(b'\0\0'*16000)
 job.write_text(json.dumps({'id':'test','input':str(audio)}),encoding='utf8');w.run_job(job);state=json.loads((p/'status.json').read_text(encoding='utf8'));assert state['phase']=='error' and 'тишина' in state['message'];assert not (p/'audio.wav').exists();checks.append('silence rejected and intermediate audio removed')
 (p/'cancel').write_text('cancel');w.run_job(job);assert json.loads((p/'status.json').read_text(encoding='utf8'))['phase']=='cancelled';checks.append('cancelled recognition never launches decoder')
report={'passed':len(checks),'checks':checks};(root/'premiere-subtitles-cep/transcription-worker-tests.json').write_text(json.dumps(report,indent=2),encoding='utf8');print(report)
