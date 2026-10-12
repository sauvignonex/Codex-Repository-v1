"""Start the configured loopback model on demand, without a terminal window."""
from pathlib import Path
import hashlib, json, subprocess, urllib.request

config = json.loads((Path(__file__).parent/'transcription-config.json').read_text(encoding='utf-8-sig'))
try:
    with urllib.request.urlopen('http://127.0.0.1:18767/v1/models', timeout=2) as response:
        models=json.load(response)
    if not any('Qwen3-4B-Instruct-2507' in entry.get('id','') for entry in models.get('data',[])):
        raise RuntimeError('Port occupied by another service')
except (OSError, urllib.error.URLError):
    executable,model=Path(config['llama']),Path(config['topicsModel'])
    if not executable.is_file() or not model.is_file():
        raise RuntimeError('Topic model is not installed')
    if hashlib.sha256(executable.read_bytes()).hexdigest()!=config['llamaSha256']:
        raise RuntimeError('Runtime digest mismatch')
    # The file model path stays relative for Windows executables with narrow argv.
    logs=model.parent
    with (logs/'subtitle-api.stdout.log').open('wb') as stdout,(logs/'subtitle-api.stderr.log').open('wb') as stderr:
        subprocess.Popen([str(executable),'-m',model.name,'-ngl','99','-c','8192','--host','127.0.0.1','--port','18767','--no-webui'],cwd=str(model.parent),stdout=stdout,stderr=stderr,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
