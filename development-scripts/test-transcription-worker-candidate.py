"""Portable worker contracts: synthetic audio and fake decoders, no model/media upload."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import wave

ROOT = Path(__file__).resolve().parents[1]


class WorkerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='subtitle-worker-')
        self.folder = Path(self.temp.name)
        source = self.folder / 'transcription-worker.py'
        source.write_bytes((ROOT / 'premiere-subtitles-cep/transcription-worker.py').read_bytes())
        spec = importlib.util.spec_from_file_location('isolated_worker', source)
        self.worker = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.worker)
        config = {}
        for key in ('ffmpeg', 'whisper', 'model'):
            file = self.folder / key
            file.write_bytes(b'fixture only')
            config[key] = str(file)
        (self.folder / 'transcription-config.json').write_text(json.dumps(config))
        self.input = self.folder / 'Исходный звук.wav'
        self.input.write_bytes(b'fixture input')
        self.job = {'id': 'isolated', 'input': str(self.input), 'language': 'ru'}
        self.calls = []
        self.silent = False
        self.exit_code = 0
        self.segments = [{'offsets': {'from': 100, 'to': 900}, 'text': 'Красивые субтитры', 'tokens': [
            {'text': ' Красивые', 'offsets': {'from': 100, 'to': 400}, 'p': .9},
            {'text': ' суб', 'offsets': {'from': 450, 'to': 650}, 'p': .8},
            {'text': 'титры', 'offsets': {'from': 650, 'to': 900}, 'p': .85}]}]

    def tearDown(self):
        self.temp.cleanup()

    def fake_process(self, args, **kwargs):
        self.calls.append((args, kwargs))
        if '-vn' in args:
            with wave.open(args[-1], 'wb') as audio:
                audio.setparams((1, 2, 16000, 0, 'NONE', 'not compressed'))
                audio.writeframes((b'\0\0' if self.silent else b'\x01\0') * 16000)
        else:
            Path(args[args.index('-of') + 1] + '.json').write_text(json.dumps({'transcription': self.segments}))
        code = self.exit_code
        class Process:
            returncode = code
            def poll(self):
                return self.returncode
        return Process()

    def run_job(self):
        job_file = self.folder / 'job.json'
        job_file.write_text(json.dumps(self.job))
        with patch.object(self.worker.subprocess, 'Popen', self.fake_process):
            self.worker.run_job(job_file)
        self.assertFalse((self.folder / 'audio.wav').exists())
        self.assertFalse((self.folder / 'status.tmp').exists())
        return json.loads((self.folder / 'status.json').read_text())

    def test_exact_tokens_and_subwords(self):
        words = self.worker.words_from_segments(self.segments)
        self.assertEqual([w['text'] for w in words], ['Красивые', 'субтитры'])
        self.assertEqual([(w['start'], w['end']) for w in words], [(100, 400), (450, 900)])
        self.assertTrue(all(not w['estimated'] for w in words))
        self.assertEqual(words[1]['confidence'], .8)

    def test_missing_or_mismatched_tokens_are_explicitly_estimated(self):
        for tokens in ([], [{'text': ' другая речь', 'offsets': {'from': 100, 'to': 900}}]):
            self.segments[0]['tokens'] = tokens
            words = self.worker.words_from_segments(self.segments)
            self.assertEqual([w['text'] for w in words], ['Красивые', 'субтитры'])
            self.assertTrue(all(w['estimated'] for w in words))
            self.assertEqual((words[0]['start'], words[-1]['end']), (100, 900))

    def test_non_speech_annotations_are_excluded(self):
        self.assertEqual(self.worker.words_from_segments([{'offsets': {'from': 0, 'to': 100}, 'text': '[Музыка]'}]), [])

    def test_complete_file_keeps_original_input_and_exact_times(self):
        original = self.input.read_bytes()
        state = self.run_job()
        self.assertEqual(state['phase'], 'complete')
        self.assertEqual(state['id'], self.job['id'])
        self.assertEqual(state['words'][0]['start'], 100)
        self.assertEqual(self.input.read_bytes(), original)
        self.assertNotIn('previewMedia', state)
        self.assertEqual(len(self.calls), 2)

    def test_selection_trim_offset_and_preview(self):
        self.job['selection'] = {'sourceInMs': 4000, 'durationMs': 7000, 'timelineStartMs': 15000, 'name': 'Выделенный клип'}
        state = self.run_job()
        self.assertEqual(state['phase'], 'complete')
        args = self.calls[0][0]
        self.assertEqual(args[args.index('-ss') + 1], '4.0')
        self.assertEqual(args[args.index('-t') + 1], '7.0')
        self.assertEqual([(w['start'], w['end']) for w in state['words']], [(15100, 15400), (15450, 15900)])
        self.assertEqual(state['previewMedia']['startMs'], 15000)
        self.assertTrue(Path(state['previewMedia']['path']).is_file())
        self.assertEqual(state['name'], 'Выделенный клип')

    def test_invalid_selection_never_launches(self):
        self.job['selection'] = {'sourceInMs': -1, 'durationMs': 7000, 'timelineStartMs': 0}
        self.assertEqual(self.run_job()['phase'], 'error')
        self.assertEqual(self.calls, [])

    def test_missing_input_never_launches(self):
        self.input.unlink()
        self.assertEqual(self.run_job()['phase'], 'error')
        self.assertEqual(self.calls, [])

    def test_silence_never_starts_decoder(self):
        self.silent = True
        state = self.run_job()
        self.assertEqual(state['phase'], 'error')
        self.assertIn('тишина', state['message'])
        self.assertEqual(len(self.calls), 1)

    def test_cancel_before_conversion_never_launches(self):
        (self.folder / 'cancel').write_text('cancel')
        self.assertEqual(self.run_job()['phase'], 'cancelled')
        self.assertEqual(self.calls, [])

    def test_failed_converter_reports_error_and_cleans_audio(self):
        self.exit_code = 1
        state = self.run_job()
        self.assertEqual(state['phase'], 'error')
        self.assertIn('Движок завершился с ошибкой', state['message'])
        self.assertEqual(len(self.calls), 1)

    def test_cancel_during_conversion_terminates_child_and_removes_audio(self):
        test = self
        class Process:
            returncode = None
            terminated = False
            def poll(self):
                (test.folder / 'cancel').write_text('cancel')
                return self.returncode
            def terminate(self):
                self.terminated = True
                self.returncode = -15
            def wait(self, timeout=None):
                return self.returncode
        child = Process()
        original = self.fake_process
        def start(args, **kwargs):
            original(args, **kwargs)
            return child
        with patch.object(self, 'fake_process', start):
            self.assertEqual(self.run_job()['phase'], 'cancelled')
        self.assertTrue(child.terminated)
        self.assertEqual(len(self.calls), 1)

    def test_empty_decoder_output_is_error_not_empty_success(self):
        self.segments = []
        state = self.run_job()
        self.assertEqual(state['phase'], 'error')
        self.assertIn('Речь не найдена', state['message'])


if __name__ == '__main__':
    result = unittest.TextTestRunner().run(unittest.defaultTestLoader.loadTestsFromTestCase(WorkerTests))
    report = {'status': 'isolated Python worker contracts; fake decoder, no actual recognition or Adobe',
              'passed': result.testsRun - len(result.errors) - len(result.failures), 'successful': result.wasSuccessful()}
    (ROOT / 'premiere-subtitles-cep/transcription-worker-tests-candidate.json').write_text(json.dumps(report, indent=2) + '\n')
    raise SystemExit(0 if result.wasSuccessful() else 1)
