"""Build a reviewable source bundle, or a CEP QA bundle from a real AE-exported 063.

No installation, native launch, project migration, or release publication is performed.
"""
import argparse
import hashlib
import json
from pathlib import Path
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = 'Subtitle Studio Vertical 063 Adaptive'
RUNTIME_SUFFIXES = {'.js', '.jsx', '.html', '.css', '.py', '.xml'}
CONTROLS = {'Основной текст', 'Рукописный акцент', 'Текст речи', 'Масштаб',
            'Масштаб акцента', 'Высота', 'Цвет', 'Длительность',
            'Роль: 1 заголовок, 2 речь, 3 акцент',
            'Анимация: 0 нет, 1 мягкая, 2 акцент, 3 раскрытие'}


def validate_template(file):
    with zipfile.ZipFile(file) as archive:
        if len(archive.namelist()) != len(set(archive.namelist())):
            raise ValueError('Повторяющиеся файлы в MOGRT.')
        for name in ('definition.json', 'project.aegraphic'):
            if name not in archive.namelist() or archive.getinfo(name).file_size == 0:
                raise ValueError('Неполный MOGRT: ' + name)
        if archive.testzip():
            raise ValueError('Повреждённый MOGRT.')
        definition = json.loads(archive.read('definition.json'))
    if definition.get('capsuleName') != TEMPLATE or definition.get('authorApp') != 'aefx':
        raise ValueError('Нужен экспорт AE 063 Adaptive; переименование файла 062 не подходит.')
    controls = {}
    for control in definition.get('clientControls', []):
        for label in control.get('uiName', {}).get('strDB', []):
            controls[label.get('str')] = control
    if not CONTROLS <= controls.keys():
        raise ValueError('MOGRT не содержит все необходимые параметры.')
    for name, font in {'Основной текст': 'BebasNeueCyrillic',
                       'Рукописный акцент': 'Christopher',
                       'Текст речи': 'CeraPro-Medium'}.items():
        info = controls[name].get('fonteditinfo', {})
        if info.get('fontEditValue') != font or info.get('fontFSAllCapsValue') or info.get('fontFSSmallCapsValue'):
            raise ValueError('Неверный шрифт/капитализация: ' + name)
    return definition


def build(output, template=None, engine_config=None):
    output = Path(output).resolve()
    if output.exists():
        raise ValueError('Архив уже существует; выбери новый путь.')
    if engine_config and not template:
        raise ValueError('Настройки движков нужны только для CEP QA-пакета.')
    if template:
        validate_template(template)  # Fail before writing anything.
    files = {}
    for file in (ROOT / 'premiere-subtitles-cep').rglob('*'):
        if file.is_file() and file.suffix in RUNTIME_SUFFIXES:
            files[file.relative_to(ROOT).as_posix()] = file.read_bytes()
    docs = ['AGENTS.md', 'README.md', 'release-0.6.3-candidate.md',
            'docs/NATIVE-QA-063.md', 'docs/AUTONOMOUS-WORK.md', 'docs/VISUAL-REVIEW-063.md', 'local-ai.md', 'docs/STATUS-AND-ROADMAP.md',
            'development-scripts/build-vertical-template-062.jsx',
            'development-scripts/build-vertical-template-063.jsx',
            'development-scripts/check-stationary-speech-063.jsx',
            'development-scripts/test-stationary-speech.cjs',
            'development-scripts/test-motion-quality-062.cjs',
            'development-scripts/test-phrases.cjs',
            'development-scripts/test-host-loader.cjs',
            'development-scripts/browser-test-runtime.cjs',
            'development-scripts/test-writer-preflight.cjs',
            'development-scripts/test-engine-config.cjs',
            'development-scripts/test-engine-startup.cjs',
            'development-scripts/test-visual-design.cjs',
            'premiere-subtitles-cep/visual-design-tests.json',
            'development-scripts/test-local-ai-launcher.py',
            'premiere-subtitles-cep/local-ai-launcher-tests.json',
            'premiere-subtitles-cep/engine-config-tests.json',
            'premiere-subtitles-cep/engine-startup-tests.json',
            'development-scripts/test-update-races.cjs',
            'premiere-subtitles-cep/writer-preflight-tests.json',
            'premiere-subtitles-cep/update-race-tests.json',
            'development-scripts/test-playback-recovery.cjs',
            'development-scripts/test-playback-061.cjs',
            'premiere-subtitles-cep/host-loader-tests.json',
            'premiere-subtitles-cep/playback-recovery-tests.json',
            'premiere-subtitles-cep/playback-tests-candidate.json',
            'development-scripts/package-candidate.py',
            'development-scripts/test-package-candidate.py',
            'premiere-subtitles-cep/package-candidate-tests.json',
            'development-scripts/Настроить локальные движки.ps1',
            'premiere-subtitles-cep/stationary-speech-tests.json',
            'premiere-subtitles-cep/motion-quality-tests-candidate.json']
    for name in docs:
        files[name] = (ROOT / name).read_bytes()
    # Portable placeholders retain the expected config shape and public runtime digest.
    config = json.loads((ROOT / 'premiere-subtitles-cep/transcription-config.json').read_text(encoding='utf-8-sig'))
    for key in ('python', 'ffmpeg', 'whisper', 'model', 'llama', 'topicsModel'):
        config[key] = ''
    files['premiere-subtitles-cep/transcription-config.json'] = (json.dumps(config, ensure_ascii=False, indent=2) + '\n').encode()
    if template:
        files['premiere-subtitles-cep/templates/' + TEMPLATE + '.mogrt'] = Path(template).read_bytes()
        for name in ('batch.jsx', 'test-graphic.jsx'):
            key = 'premiere-subtitles-cep/' + name
            text = files[key].decode('utf-8')
            if text.count('Subtitle Studio Vertical 062 Adaptive') != 2:
                raise ValueError('Изменились пути шаблона: ' + name)
            files[key] = text.replace('Subtitle Studio Vertical 062 Adaptive', TEMPLATE).encode('utf-8')
        for name in ('host-loader.js', 'index.html', 'CSXS/manifest.xml'):
            key = 'premiere-subtitles-cep/' + name
            text = files[key].decode('utf-8')
            if '0.6.2' not in text:
                raise ValueError('Не найдена исходная версия: ' + name)
            text = text.replace('0.6.2', '0.6.3')
            if name == 'index.html':
                text = text.replace('CEP · 0.6.3', 'CEP · 0.6.3 · проверка')
            files[key] = text.encode('utf-8')
        if engine_config:
            config = json.loads(Path(engine_config).read_text(encoding='utf-8-sig'))
            if not isinstance(config, dict) or not all(isinstance(config.get(k), str) and config[k].strip()
                                                       for k in ('python', 'ffmpeg', 'whisper', 'model', 'llama', 'topicsModel', 'llamaSha256')):
                raise ValueError('Неполная конфигурация локальных движков.')
            digest = config['llamaSha256']
            if len(digest) != 64 or any(char not in '0123456789abcdefABCDEF' for char in digest):
                raise ValueError('Неверная контрольная сумма локального движка.')
            files['premiere-subtitles-cep/transcription-config.json'] = (json.dumps(config, ensure_ascii=False, indent=2) + '\n').encode()
    instructions = ('Кандидат 0.6.3 — не проверено в Adobe, не финальный выпуск.\n'
                    'Этот архив не устанавливает панель и не изменяет проекты/кэш.\n'
                    'Исторические пользовательские файлы, шрифты, модели и секреты не включены.\n'
                    'См. docs/NATIVE-QA-063.md.\n')
    instructions += ('CEP QA: экспорт 063 включён, четыре пути импорта и версии согласованы.\n'
                     'Перед распознаванием настрой локальные движки: пути по умолчанию пустые.\n'
                     if template else
                     'Только исходники: MOGRT отсутствует. Этот архив нельзя устанавливать как готовый CEP.\n'
                     'Для QA-пакета сначала экспортируй 063 в AE, затем запусти package-candidate.py --template <MOGRT>.\n')
    files['ПРОДОЛЖИТЬ РАЗРАБОТКУ.md'] = instructions.encode('utf-8')
    files['Актуальные требования.md'] = (ROOT / 'AGENTS.md').read_bytes()
    manifest = {'version': '0.6.3-candidate', 'kind': 'cep-qa' if template else 'source-only',
                'native_verified': False,
                'files': {name: {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
                          for name, data in sorted(files.items())}}
    files['candidate-manifest.json'] = (json.dumps(manifest, ensure_ascii=False, indent=2) + '\n').encode()
    output.parent.mkdir(parents=True, exist_ok=True)
    # Verify before exposing the archive; preserve previous archives.
    with tempfile.TemporaryDirectory(dir=output.parent) as temp:
        staged = Path(temp) / 'candidate.zip'
        with zipfile.ZipFile(staged, 'w', zipfile.ZIP_DEFLATED) as archive:
            for name, data in sorted(files.items()):
                archive.writestr(name, data)
        with zipfile.ZipFile(staged) as archive:
            if archive.testzip():
                raise ValueError('Проверка ZIP не прошла.')
            for name, data in files.items():
                if archive.read(name) != data:
                    raise ValueError('Проверка содержимого не прошла: ' + name)
        # Exclusive creation prevents overwriting a concurrently created archive.
        with output.open('xb') as dest:
            dest.write(staged.read_bytes())
    return manifest


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--template', type=Path, help='Real AE-exported 063 Adaptive MOGRT; builds CEP QA bundle')
    parser.add_argument('--engine-config', type=Path, help='Optional local transcription configuration for QA bundle')
    args = parser.parse_args()
    try:
        manifest = build(args.output, args.template, args.engine_config)
    except (ValueError, OSError, zipfile.BadZipFile) as error:
        parser.exit(1, 'Сборка остановлена: ' + str(error) + '\n')
    print(f"{manifest['kind']}: {len(manifest['files'])} файлов проверены; {args.output}")
