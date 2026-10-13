"""Start the configured loopback model; report startup failures to the panel."""
from pathlib import Path
import hashlib, json, subprocess, urllib.request, urllib.error, sys, os


def launch():
    config = json.loads((Path(__file__).parent/'transcription-config.json').read_text(encoding='utf-8-sig'))
    try:
        with urllib.request.urlopen('http://127.0.0.1:18767/v1/models', timeout=2) as response:
            models = json.load(response)
        if not any('Qwen3-4B-Instruct-2507' in entry.get('id', '') for entry in models.get('data', [])):
            raise RuntimeError('Локальный порт занят другой моделью.')
        return 'ready'
    except urllib.error.HTTPError as error:
        # llama-server returns 503 while loading: never start a second server.
        if error.code == 503:
            return 'loading'
        raise RuntimeError('Локальный сервис заголовков вернул ошибку HTTP.') from error
    except (OSError, urllib.error.URLError):
        pass
    executable, model = Path(config['llama']), Path(config['topicsModel'])
    if not executable.is_file() or not model.is_file():
        raise RuntimeError('Не установлен движок или модель смысловых заголовков.')
    if hashlib.sha256(executable.read_bytes()).hexdigest() != config['llamaSha256'].lower():
        raise RuntimeError('Контрольная сумма движка смысловых заголовков не совпадает. Проверь установку.')
    with (model.parent/'subtitle-api.stdout.log').open('wb') as stdout, (model.parent/'subtitle-api.stderr.log').open('wb') as stderr:
        subprocess.Popen([str(executable), '-m', model.name, '-ngl', '99', '-c', '8192', '--host', '127.0.0.1', '--port', '18767', '--no-webui'], cwd=str(model.parent), stdout=stdout, stderr=stderr, creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
    return 'started'


def report(path, status):
    # Atomic replacement keeps CEP from reading half a JSON response.
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(status, ensure_ascii=False), encoding='utf-8')
    os.replace(temporary, path)


def main(status_path=None):
    try:
        phase = launch()
    except Exception as error:
        if status_path is None:
            raise
        message = str(error) if isinstance(error, RuntimeError) else 'Не удалось запустить локальную модель. Проверь Python и установку движка.'
        report(status_path, {'phase': 'error', 'message': message})
        return 1
    if status_path is not None:
        report(status_path, {'phase': phase})
    return 0


if __name__ == '__main__':
    sys.exit(main(Path(sys.argv[1]) if len(sys.argv) > 1 else None))
