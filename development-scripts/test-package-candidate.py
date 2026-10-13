"""Archive integrity/contract tests. Synthetic fixture does not validate rendering in Adobe."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
import zipfile

spec = importlib.util.spec_from_file_location('candidate', Path(__file__).with_name('package-candidate.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class CandidateTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        with zipfile.ZipFile(module.ROOT / 'premiere-subtitles-cep/templates/Subtitle Studio Vertical 062 Adaptive.mogrt') as archive:
            self.definition = json.loads(archive.read('definition.json'))
        self.definition['capsuleName'] = module.TEMPLATE

    def tearDown(self):
        self.temp.cleanup()

    def fixture(self, definition=None):
        fixture = self.root / 'synthetic-test-only.mogrt'
        with zipfile.ZipFile(fixture, 'w') as archive:
            archive.writestr('definition.json', json.dumps(definition or self.definition))
            archive.writestr('project.aegraphic', b'FAKE TEST PAYLOAD; NOT AN ADOBE PROJECT')
        return fixture

    def test_source_archive_hashes_and_exclusions(self):
        file = self.root / 'source.zip'
        manifest = module.build(file)
        self.assertEqual(manifest['kind'], 'source-only')
        self.assertFalse(manifest['native_verified'])
        with zipfile.ZipFile(file) as archive:
            for name, metadata in manifest['files'].items():
                data = archive.read(name)
                self.assertEqual(hashlib.sha256(data).hexdigest(), metadata['sha256'])
                self.assertEqual(len(data), metadata['bytes'])
            self.assertFalse(any(name.endswith(('.mogrt', '.wav', '.mp4', '.prproj', '.ttf', '.otf')) for name in archive.namelist()))
            config = json.loads(archive.read('premiere-subtitles-cep/transcription-config.json'))
            self.assertEqual(config['python'], '')
            self.assertIn('Только исходники', archive.read('ПРОДОЛЖИТЬ РАЗРАБОТКУ.md').decode())

    def test_existing_archive_preserved(self):
        file = self.root / 'existing.zip'
        file.write_bytes(b'previous version')
        with self.assertRaises(ValueError):
            module.build(file)
        self.assertEqual(file.read_bytes(), b'previous version')

    def test_old_template_and_missing_file_rejected_before_output(self):
        output = self.root / 'invalid.zip'
        for template in [module.ROOT / 'premiere-subtitles-cep/templates/Subtitle Studio Vertical 062 Adaptive.mogrt', self.root / 'missing.mogrt']:
            with self.assertRaises((ValueError, OSError)):
                module.build(output, template)
            self.assertFalse(output.exists())

    def test_missing_control_bad_font_and_caps_rejected(self):
        for case in ['control', 'font', 'caps']:
            definition = copy.deepcopy(self.definition)
            if case == 'control':
                definition['clientControls'] = []
            else:
                control = next(c for c in definition['clientControls'] if c.get('fonteditinfo', {}).get('fontEditValue') == 'Christopher')
                control['fonteditinfo']['fontEditValue' if case == 'font' else 'fontFSAllCapsValue'] = 'Arial' if case == 'font' else True
            with self.assertRaises(ValueError):
                module.build(self.root / (case + '.zip'), self.fixture(definition))

    def test_qa_archive_all_import_paths_and_loader_versions_agree(self):
        file = self.root / 'qa.zip'
        manifest = module.build(file, self.fixture())
        self.assertEqual(manifest['kind'], 'cep-qa')
        self.assertFalse(manifest['native_verified'])
        with zipfile.ZipFile(file) as archive:
            for name in ('batch.jsx', 'test-graphic.jsx'):
                text = archive.read('premiere-subtitles-cep/' + name).decode()
                self.assertEqual(text.count(module.TEMPLATE), 2)
                self.assertNotIn('062 Adaptive', text)
            for name in ('index.html', 'CSXS/manifest.xml', 'host-loader.js'):
                text = archive.read('premiere-subtitles-cep/' + name).decode()
                self.assertIn('0.6.3', text)
                self.assertNotIn('0.6.2', text)
            self.assertIn('проверка', archive.read('premiere-subtitles-cep/index.html').decode())

    def test_engine_config_validation(self):
        config = self.root / 'engines.json'
        config.write_text('{}')
        with self.assertRaises(ValueError):
            module.build(self.root / 'bad-config.zip', self.fixture(), config)
        self.assertFalse((self.root / 'bad-config.zip').exists())

    def test_complete_config_with_invalid_digest_rejected(self):
        config = self.root / 'engines.json'
        data = json.loads((module.ROOT / 'premiere-subtitles-cep/transcription-config.json').read_text(encoding='utf-8-sig'))
        data['llamaSha256'] = 'invalid'
        config.write_text(json.dumps(data))
        with self.assertRaises(ValueError):
            module.build(self.root / 'bad-digest.zip', self.fixture(), config)
        self.assertFalse((self.root / 'bad-digest.zip').exists())

    def test_valid_config_preserved_in_qa_bundle(self):
        config = self.root / 'engines.json'
        data = json.loads((module.ROOT / 'premiere-subtitles-cep/transcription-config.json').read_text(encoding='utf-8-sig'))
        data['llamaSha256'] = data['llamaSha256'].upper()
        config.write_text('\ufeff' + json.dumps(data), encoding='utf-8')
        output = self.root / 'configured-qa.zip'
        module.build(output, self.fixture(), config)
        with zipfile.ZipFile(output) as archive:
            self.assertEqual(json.loads(archive.read('premiere-subtitles-cep/transcription-config.json')), data)


if __name__ == '__main__':
    result = unittest.TextTestRunner().run(unittest.defaultTestLoader.loadTestsFromTestCase(CandidateTests))
    report = {'status': 'archive-contract-tested; native Adobe verification pending', 'passed': result.testsRun - len(result.errors) - len(result.failures), 'tests': result.testsRun, 'successful': result.wasSuccessful(), 'synthetic_mogrt_fixture': True}
    (module.ROOT / 'premiere-subtitles-cep/package-candidate-tests.json').write_text(json.dumps(report, indent=2) + '\n')
    raise SystemExit(0 if result.wasSuccessful() else 1)
