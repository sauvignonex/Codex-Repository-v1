"""Exercise launcher decisions with isolated files and stubbed network/process APIs."""
import hashlib
import json
from pathlib import Path
import runpy
import tempfile
import unittest
from unittest.mock import patch, MagicMock
from urllib.error import URLError

ROOT = Path(__file__).resolve().parent.parent


class LauncherTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.launcher = self.root / 'local-ai-launcher.py'
        self.launcher.write_bytes((ROOT / 'premiere-subtitles-cep/local-ai-launcher.py').read_bytes())
        self.runtime = self.root / 'llama-server.exe'
        self.runtime.write_bytes(b'test-only executable fixture')
        self.model = self.root / 'model.gguf'
        self.model.write_bytes(b'test-only model fixture')
        self.config = {'llama': str(self.runtime), 'topicsModel': str(self.model),
                       'llamaSha256': hashlib.sha256(self.runtime.read_bytes()).hexdigest()}

    def tearDown(self):
        self.temp.cleanup()

    def run_launcher(self, response=None):
        (self.root / 'transcription-config.json').write_text(json.dumps(self.config))
        result = MagicMock()
        self.process = MagicMock()
        if response is not None:
            result.__enter__.return_value.read.return_value = json.dumps(response).encode()
        with patch('urllib.request.urlopen', side_effect=URLError('offline') if response is None else None,
                   return_value=result), patch('subprocess.Popen', self.process):
            runpy.run_path(str(self.launcher))['launch']()
            return self.process

    def test_matching_uppercase_digest_launches_configured_model(self):
        self.config['llamaSha256'] = self.config['llamaSha256'].upper()
        process = self.run_launcher()
        self.assertEqual(process.call_count, 1)
        self.assertEqual(process.call_args.args[0][:3], [str(self.runtime), '-m', self.model.name])
        self.assertEqual(process.call_args.kwargs['cwd'], str(self.model.parent))

    def test_wrong_digest_stops_before_process_creation(self):
        self.config['llamaSha256'] = '0' * 64
        with self.assertRaisesRegex(RuntimeError, 'Контрольная сумма'):
            self.run_launcher()
        self.process.assert_not_called()

    def test_missing_model_stops_before_process_creation(self):
        self.model.unlink()
        with self.assertRaisesRegex(RuntimeError, 'Не установлен'):
            self.run_launcher()
        self.process.assert_not_called()

    def test_expected_service_already_running_never_spawns(self):
        process = self.run_launcher({'data': [{'id': 'Qwen3-4B-Instruct-2507'}]})
        process.assert_not_called()

    def test_other_service_on_port_never_spawns(self):
        with self.assertRaisesRegex(RuntimeError, 'занят'):
            self.run_launcher({'data': [{'id': 'other-model'}]})
        self.process.assert_not_called()


    def test_loading_service_never_spawns(self):
        from urllib.error import HTTPError
        (self.root / 'transcription-config.json').write_text(json.dumps(self.config))
        with patch('urllib.request.urlopen', side_effect=HTTPError('url', 503, 'loading', {}, None)), patch('subprocess.Popen') as process:
            self.assertEqual(runpy.run_path(str(self.launcher))['launch'](), 'loading')
            process.assert_not_called()

    def test_status_handshake_reports_digest_failure_and_retry(self):
        status = self.root / 'status.json'
        self.config['llamaSha256'] = '0' * 64
        (self.root / 'transcription-config.json').write_text(json.dumps(self.config))
        module = runpy.run_path(str(self.launcher))
        with patch('urllib.request.urlopen', side_effect=URLError('offline')), patch('subprocess.Popen') as process:
            self.assertEqual(module['main'](status), 1)
            self.assertEqual(json.loads(status.read_text())['phase'], 'error')
            self.assertIn('Контрольная сумма', json.loads(status.read_text())['message'])
            process.assert_not_called()
            self.config['llamaSha256'] = hashlib.sha256(self.runtime.read_bytes()).hexdigest()
            (self.root / 'transcription-config.json').write_text(json.dumps(self.config))
            self.assertEqual(module['main'](status), 0)
            self.assertEqual(json.loads(status.read_text())['phase'], 'started')
            process.assert_called_once()
        self.assertFalse(status.with_suffix('.tmp').exists())


if __name__ == '__main__':
    result = unittest.TextTestRunner().run(unittest.defaultTestLoader.loadTestsFromTestCase(LauncherTests))
    report = {'status': 'Python-launcher-contract-tested; real model/process not started',
              'passed': result.testsRun - len(result.errors) - len(result.failures),
              'successful': result.wasSuccessful()}
    (ROOT / 'premiere-subtitles-cep/local-ai-launcher-tests.json').write_text(json.dumps(report, indent=2) + '\n')
    raise SystemExit(0 if result.wasSuccessful() else 1)
