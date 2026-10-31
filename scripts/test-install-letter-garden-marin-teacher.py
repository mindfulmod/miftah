import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import wave

spec=importlib.util.spec_from_file_location('install',Path(__file__).with_name('install-letter-garden-marin-teacher.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

class InstallTests(unittest.TestCase):
    def seed(self,root):
        (root/'src/letters').mkdir(parents=True)
        (root/'src/letters/LetterVoiceClips.js').write_text('const clips=Object.freeze({"old":"old.wav"});')
        (root/'sw.js').write_text('const VERSION = "old";\nconst SHELL = [\n"old.wav",\n];')
        (root/'letters.html').write_text('<script src="src/letters/LetterVoiceClips.js?v=old"></script>')
        source=root/m.PACKAGE/'sample.wav';source.parent.mkdir(parents=True)
        out=io.BytesIO()
        with wave.open(out,'wb') as w:
            w.setnchannels(1);w.setsampwidth(2);w.setframerate(24000);w.writeframes(b'\0\x10'*24000)
        source.write_bytes(out.getvalue());text='تِمْسَاح';ident='lg-'+m.sha(text.encode())[:12]
        self.review=dict(kind='letter-garden-teacher-install-approval',held=[],reviews=[dict(id=ident,input=text,file='sample.wav',sha256=m.sha(out.getvalue()),decision='correct')])
        self.path=root/'approval.json';self.path.write_text(json.dumps(self.review))
        return source
    def snapshot(self,root):return {str(p.relative_to(root)):p.read_bytes() for p in root.rglob('*') if p.is_file()}
    def test_dry_run_and_repeated_install_preserve_existing_bank_and_exact_samples(self):
        with tempfile.TemporaryDirectory() as td,patch.object(m,'ROOT',Path(td).resolve()):
            root=Path(td).resolve();source=self.seed(root);before=self.snapshot(root)
            self.assertEqual(m.install('approval.json')['bundleClips'],1);self.assertEqual(before,self.snapshot(root))
            result=m.install('approval.json',True);self.assertEqual(result['totalRuntimeClips'],2)
            manifest=json.loads((root/m.BUNDLE/'manifest.json').read_text())
            self.assertEqual((root/manifest['items'][0]['file']).read_bytes(),source.read_bytes())
            self.assertIn('"old": "old.wav"',(root/'src/letters/LetterVoiceClips.js').read_text())
            installed=self.snapshot(root);m.install('approval.json',True);self.assertEqual(installed,self.snapshot(root))
    def test_bad_hash_or_held_item_cannot_partially_mutate_runtime(self):
        with tempfile.TemporaryDirectory() as td,patch.object(m,'ROOT',Path(td).resolve()):
            root=Path(td).resolve();self.seed(root)
            bad=dict(self.review['reviews'][0],input='بً',id='lg-'+m.sha('بً'.encode())[:12],sha256='0'*64)
            self.review['reviews'].append(bad);self.path.write_text(json.dumps(self.review));before=self.snapshot(root)
            with self.assertRaises(ValueError):m.install('approval.json',True)
            self.assertEqual(before,self.snapshot(root))
            self.review['reviews'].pop();self.review['held']=[dict(id=self.review['reviews'][0]['id'])];self.path.write_text(json.dumps(self.review));before=self.snapshot(root)
            with self.assertRaises(ValueError):m.install('approval.json',True)
            self.assertEqual(before,self.snapshot(root))

if __name__=='__main__':unittest.main()
