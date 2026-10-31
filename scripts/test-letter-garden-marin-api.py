import importlib.util
import io
import json
from pathlib import Path
import tempfile
import shutil
import struct
from types import SimpleNamespace
import unittest
from unittest.mock import patch
import wave
import urllib.error

spec=importlib.util.spec_from_file_location('marin',Path(__file__).with_name('letter-garden-marin-api.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

def job(text='بَ'):
    return dict(id='lg-'+m.sha(text.encode())[:12],input=text,voice='marin',instructions='Read only this syllable.')

def wav():
    out=io.BytesIO()
    with wave.open(out,'wb') as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(24000);w.writeframes(b'\x00\x10'*24000)
    return out.getvalue()

class GenerationTests(unittest.TestCase):
    def test_exact_identity_and_voice_are_required(self):
        self.assertEqual(m.validate_job(job()),job())
        for altered in [dict(job(),input='بُ'),dict(job(),voice='alloy'),dict(job(),id='../../bad'),dict(job(),input='بَ ')]:
            with self.assertRaises(ValueError):m.validate_job(altered)

    def test_reservation_includes_failed_and_uncertain_attempts(self):
        jobs=[job('بَ'),job('بُ')]
        events=[dict(event='attempt',id=jobs[0]['id'],reservedUSD=.05),dict(event='stopped',id=jobs[0]['id'])]
        pending,spent=m.pending_jobs(jobs,events,12,.10)
        self.assertEqual(pending,[jobs[1]]);self.assertEqual(spent,.05)
        with self.assertRaises(ValueError):m.pending_jobs(jobs,events,12,.09)

    def test_audio_validation_preserves_quiet_or_truncated_candidate_for_review(self):
        self.assertEqual(m.metrics(wav())['flags'],[])
        out=io.BytesIO()
        with wave.open(out,'wb') as w:
            w.setnchannels(1);w.setsampwidth(2);w.setframerate(24000);w.writeframes(b'\x01\x00'*500)
        self.assertIn('near-silent',m.metrics(out.getvalue())['flags'])
        self.assertIn('very-short',m.metrics(out.getvalue())['flags'])

    def test_dry_run_does_not_read_key_or_call_service(self):
        with tempfile.TemporaryDirectory() as td,patch.object(m,'PACKAGE',Path(td)),patch.object(m.getpass,'getpass',side_effect=AssertionError('must not prompt')),patch.object(m.urllib.request,'build_opener',side_effect=AssertionError('must not call')):
            (Path(td)/'api-generation-requests.jsonl').write_text(json.dumps(job())+'\n')
            m.generate(SimpleNamespace(all=False,limit=12,budget=20,generate=False))

    def test_one_file_per_request_and_no_secret_in_saved_outputs(self):
        class Response(io.BytesIO):
            headers={'x-request-id':'request-test'}
        calls=[]
        class Opener:
            def open(self,request,timeout):
                calls.append(request)
                self_test.assertEqual(request.full_url,m.ENDPOINT)
                self_test.assertEqual(request.headers['Authorization'],'Bearer LOCAL-TEST-SECRET')
                self_test.assertEqual(json.loads(request.data)['voice'],'marin')
                self_test.assertEqual(json.loads(request.data)['input'],'بَ')
                return Response(wav())
        self_test=self
        with tempfile.TemporaryDirectory() as td,patch.object(m,'PACKAGE',Path(td)),patch.dict(m.os.environ,{'OPENAI_API_KEY':'LOCAL-TEST-SECRET'}),patch.object(m.urllib.request,'build_opener',return_value=Opener()):
            (Path(td)/'api-generation-requests.jsonl').write_text(json.dumps(job())+'\n')
            args=SimpleNamespace(all=False,limit=12,budget=20,generate=True)
            self.assertEqual(m.generate(args),0)
            m.generate(args);self.assertEqual(len(calls),1,'resume must not purchase duplicates')
            events=m.read_lines(Path(td)/'api-events.jsonl')
            self.assertEqual(events[-1]['reviewStatus'],'unreviewed')
            self.assertEqual((Path(td)/events[-1]['file']).read_bytes(),wav())
            for p in Path(td).rglob('*'):
                if p.is_file():self.assertNotIn(b'LOCAL-TEST-SECRET',p.read_bytes())

    def test_timeout_stops_and_never_blindly_retries(self):
        class Opener:
            def open(self,*a,**kw):raise TimeoutError('do not log request contents')
        with tempfile.TemporaryDirectory() as td,patch.object(m,'PACKAGE',Path(td)),patch.dict(m.os.environ,{'OPENAI_API_KEY':'LOCAL-TEST-SECRET'}),patch.object(m.urllib.request,'build_opener',return_value=Opener()):
            (Path(td)/'api-generation-requests.jsonl').write_text(json.dumps(job())+'\n')
            self.assertEqual(m.generate(SimpleNamespace(all=False,limit=12,budget=20,generate=True)),1)
            pending,_=m.pending_jobs([job()],m.read_lines(Path(td)/'api-events.jsonl'),12,20)
            self.assertEqual(pending,[])
            self.assertNotIn('do not log request contents',(Path(td)/'api-events.jsonl').read_text())

    def test_streamed_wav_uses_received_frames_and_repairs_only_header(self):
        raw=bytearray(wav())
        struct.pack_into('<I',raw,4,0xffffffff)
        struct.pack_into('<I',raw,40,0xffffffff)
        raw=bytes(raw)
        self.assertEqual(m.metrics(raw)['durationSeconds'],1)
        self.assertTrue(m.metrics(raw)['streamingLengthHeader'])
        self.assertEqual(m.metrics(raw)['flags'],[])
        prepared=m.prepare_wav(raw)
        self.assertEqual(prepared,wav(),'every PCM byte and original timing must survive')
        self.assertFalse(m.metrics(prepared)['streamingLengthHeader'])

    def test_finite_truncated_or_partial_frame_files_are_not_silently_repaired(self):
        for data in [wav()[:-100],wav()[:-1]]:
            with self.assertRaises(ValueError):m.prepare_wav(data)

    def test_auth_rejection_is_retryable_only_after_explicit_local_recovery(self):
        j=job();events=[dict(event='attempt',id=j['id'],reservedUSD=.05),dict(event='stopped',id=j['id'],httpStatus=401)]
        self.assertEqual(m.pending_jobs([j],events,1,20)[0],[])
        events.append(dict(event='retry-authorized',id=j['id'],reason='confirmed-http-401-no-audio'))
        pending,reserved=m.pending_jobs([j],events,1,20)
        self.assertEqual(pending,[j]);self.assertEqual(reserved,.05)
        events.append(dict(event='attempt',id=j['id'],reservedUSD=.05))
        self.assertEqual(m.pending_jobs([j],events,1,20)[0],[])

    def test_pilot_limit_counts_existing_candidates_not_just_this_invocation(self):
        with tempfile.TemporaryDirectory() as td,patch.object(m,'PACKAGE',Path(td)),patch.object(m.getpass,'getpass',side_effect=AssertionError('pilot already full')),patch.object(m.urllib.request,'build_opener',side_effect=AssertionError('must not generate')):
            first,second=job('بَ'),job('بُ')
            (Path(td)/'api-generation-requests.jsonl').write_text(json.dumps(first)+'\n'+json.dumps(second)+'\n')
            m.append_event(Path(td)/'api-events.jsonl',dict(event='attempt',id=first['id'],reservedUSD=.05))
            m.append_event(Path(td)/'api-events.jsonl',dict(event='candidate',id=first['id'],flags=[]))
            m.generate(SimpleNamespace(all=False,limit=1,budget=20,generate=True))

    def test_authorization_never_follows_a_redirect(self):
        self.assertIsNone(m.NoRedirect().redirect_request(None,None,302,'',{},'https://other.invalid'))

    def test_quality_hold_blocks_pilot_and_bulk_before_key_or_network(self):
        with tempfile.TemporaryDirectory() as td,patch.object(m,'PACKAGE',Path(td)),patch.object(m.getpass,'getpass',side_effect=AssertionError('must not prompt')),patch.object(m.urllib.request,'build_opener',side_effect=AssertionError('must not call')):
            (Path(td)/'quality-control.json').write_text(json.dumps(dict(generationHold=True)))
            for all_jobs in [False,True]:
                self.assertEqual(m.generate(SimpleNamespace(all=all_jobs,limit=12,budget=20,generate=True)),1)

    def test_calibration_is_exactly_six_and_keeps_target_distinctions(self):
        jobs=m.calibration_jobs()
        self.assertEqual(len(jobs),6)
        self.assertEqual(len(set(j['id'] for j in jobs)),6)
        self.assertEqual(len(set(j['instructions'] for j in jobs)),1)
        for target in ['سُكُونْ','مَا','قُلْ']:
            direct,context=[j for j in jobs if j['targetInput']==target]
            self.assertEqual(direct['input'],target)
            self.assertEqual(context['input'],'اِسْتَمِعْ جَيِّدًا. '+target+'.')
        for j in jobs:m.validate_job(j)

    def test_failed_voice_comparison_blocks_every_generation_mode(self):
        with tempfile.TemporaryDirectory() as td,patch.object(m,'PACKAGE',Path(td)),patch.object(m.getpass,'getpass',side_effect=AssertionError('must not prompt')),patch.object(m.urllib.request,'build_opener',side_effect=AssertionError('must not call')):
            (Path(td)/'quality-control.json').write_text(json.dumps(dict(generationHold=True,allGenerationHold=True)))
            for all_jobs,calibrate in [(False,False),(True,False),(False,True)]:
                self.assertEqual(m.generate(SimpleNamespace(all=all_jobs,limit=12,budget=20,generate=True,calibrate=calibrate)),1)

    def test_calibration_never_overwrites_pilot_or_repeats_its_own_attempts(self):
        class Response(io.BytesIO):headers={'x-request-id':'calibration-test'}
        calls=[]
        class Opener:
            def open(self,request,timeout):
                calls.append(json.loads(request.data));return Response(wav())
        with tempfile.TemporaryDirectory() as td,patch.object(m,'PACKAGE',Path(td)),patch.dict(m.os.environ,{'OPENAI_API_KEY':'LOCAL-TEST-SECRET'}),patch.object(m.urllib.request,'build_opener',return_value=Opener()):
            p=Path(td);(p/'quality-control.json').write_text(json.dumps(dict(generationHold=True)))
            pilot=p/'api-candidates';pilot.mkdir();saved=pilot/(m.calibration_jobs()[0]['id']+'.wav');saved.write_bytes(b'preserve-pilot')
            m.append_event(p/'api-events.jsonl',dict(event='attempt',id=m.calibration_jobs()[0]['id'],reservedUSD=.05))
            args=SimpleNamespace(all=False,limit=999,budget=20,generate=True,calibrate=True)
            self.assertEqual(m.generate(args),0)
            self.assertEqual(len(calls),6)
            m.generate(args);self.assertEqual(len(calls),6)
            self.assertEqual(saved.read_bytes(),b'preserve-pilot')
            events=m.read_lines(p/'api-events.jsonl')
            self.assertAlmostEqual(sum(e.get('reservedUSD',0) for e in events),.35)
            self.assertEqual(len(list((p/'calibration-candidates').glob('*.wav'))),6)
            self.assertTrue(all(e['reviewStatus']=='unreviewed' and e['stage']==m.CALIBRATION_STAGE for e in events if e['event']=='candidate'))
            for j in m.calibration_jobs():
                file=j['id']+'.wav'
                self.assertEqual((p/'calibration-candidates'/file).read_bytes(),(p/'calibration-raw'/file).read_bytes())

    def test_calibration_and_pilot_share_one_cumulative_budget(self):
        events=[dict(event='attempt',id=job()['id'],reservedUSD=.05)]
        with self.assertRaises(ValueError):m.pending_jobs(m.calibration_jobs(),events,6,.30,stage=m.CALIBRATION_STAGE)
        pending,reserved=m.pending_jobs(m.calibration_jobs(),events,6,.35,stage=m.CALIBRATION_STAGE)
        self.assertEqual(len(pending),6);self.assertEqual(reserved,.05)

    def test_reference_check_is_one_recording_with_recovered_direction_and_no_repeat(self):
        class Response(io.BytesIO):headers={'x-request-id':'reference-test'}
        calls=[]
        class Opener:
            def open(self,request,timeout):
                calls.append(json.loads(request.data));return Response(wav())
        with tempfile.TemporaryDirectory() as td,patch.object(m,'PACKAGE',Path(td)),patch.dict(m.os.environ,{'OPENAI_API_KEY':'LOCAL-TEST-SECRET'}),patch.object(m.urllib.request,'build_opener',return_value=Opener()):
            p=Path(td)
            (p/'original-fm-direction.json').write_text(json.dumps(dict(voice='marin',originalInstructions='Recovered original direction verbatim.')))
            control=dict(generationHold=True,allGenerationHold=True)
            (p/'quality-control.json').write_text(json.dumps(control))
            args=SimpleNamespace(all=False,limit=999,budget=20,generate=True,reference_check=True)
            self.assertEqual(m.generate(args),1);self.assertEqual(calls,[])
            control['referenceCheckAllowed']=m.REFERENCE_STAGE
            (p/'quality-control.json').write_text(json.dumps(control))
            m.append_event(p/'api-events.jsonl',dict(event='attempt',id='prior-pilot',reservedUSD=.05))
            self.assertEqual(m.generate(args),0)
            self.assertEqual(len(calls),1)
            self.assertEqual(calls[0]['input'],'بَاءْ.\n\nمِيمْ.')
            self.assertEqual(calls[0]['instructions'],'Recovered original direction verbatim.')
            m.generate(args);self.assertEqual(len(calls),1)
            self.assertEqual(len(list((p/'reference-candidates').glob('*.wav'))),1)
            events=m.read_lines(p/'api-events.jsonl')
            self.assertAlmostEqual(sum(e.get('reservedUSD',0) for e in events),.10)
            self.assertEqual(events[-1]['reviewStatus'],'unreviewed')
            self.assertEqual(events[-1]['stage'],m.REFERENCE_STAGE)

    def test_snapshot_comparison_changes_only_model_and_never_repeats(self):
        class Response(io.BytesIO):headers={'x-request-id':'snapshot-test'}
        calls=[]
        class Opener:
            def open(self,request,timeout):
                calls.append(json.loads(request.data));return Response(wav())
        with tempfile.TemporaryDirectory() as td,patch.object(m,'PACKAGE',Path(td)),patch.dict(m.os.environ,{'OPENAI_API_KEY':'LOCAL-TEST-SECRET'}),patch.object(m.urllib.request,'build_opener',return_value=Opener()):
            p=Path(td);instruction='Recovered original teacher direction.'
            (p/'original-fm-direction.json').write_text(json.dumps(dict(voice='marin',originalInstructions=instruction)))
            control=dict(generationHold=True,allGenerationHold=True)
            (p/'quality-control.json').write_text(json.dumps(control))
            args=SimpleNamespace(all=False,limit=999,budget=20,generate=True,snapshot_check=True)
            self.assertEqual(m.generate(args),1);self.assertEqual(calls,[])
            control['snapshotCheckAllowed']=m.SNAPSHOT_STAGE
            (p/'quality-control.json').write_text(json.dumps(control))
            ident=m.reference_jobs()[0]['id'];old=p/'reference-candidates';old.mkdir();(old/(ident+'.wav')).write_bytes(b'keep-existing-reference')
            m.append_event(p/'api-events.jsonl',dict(event='attempt',stage=m.REFERENCE_STAGE,id=ident,reservedUSD=.05))
            self.assertEqual(m.generate(args),0);self.assertEqual(len(calls),1)
            self.assertEqual(calls[0],dict(model=m.SNAPSHOT_MODEL,voice='marin',input='بَاءْ.\n\nمِيمْ.',instructions=instruction,response_format='wav',speed=1.0))
            m.generate(args);self.assertEqual(len(calls),1)
            self.assertEqual((old/(ident+'.wav')).read_bytes(),b'keep-existing-reference')
            self.assertEqual((p/'snapshot-candidates'/(ident+'.wav')).read_bytes(),wav())
            events=m.read_lines(p/'api-events.jsonl');attempts=[e for e in events if e['event']=='attempt']
            self.assertEqual(attempts[-1]['model'],m.SNAPSHOT_MODEL)
            self.assertAlmostEqual(sum(e.get('reservedUSD',0) for e in attempts),.10)
            self.assertEqual(events[-1]['reviewStatus'],'unreviewed')
            self.assertEqual(events[-1]['stage'],m.SNAPSHOT_STAGE)
            for options in [dict(all=False),dict(all=True),dict(all=False,reference_check=True),dict(all=False,calibrate=True)]:
                self.assertEqual(m.generate(SimpleNamespace(limit=12,budget=20,generate=True,**options)),1)
            self.assertEqual(len(calls),1,'snapshot permission must not unlock any previous generation mode')

    def test_teacher_direction_changes_only_instructions_and_is_one_guarded_request(self):
        class Response(io.BytesIO):headers={'x-request-id':'teacher-test'}
        calls=[]
        class Opener:
            def open(self,request,timeout):
                calls.append(json.loads(request.data));return Response(wav())
        with tempfile.TemporaryDirectory() as td,patch.object(m,'PACKAGE',Path(td)),patch.dict(m.os.environ,{'OPENAI_API_KEY':'LOCAL-TEST-SECRET'}),patch.object(m.urllib.request,'build_opener',return_value=Opener()):
            p=Path(td);(p/'original-fm-direction.json').write_text(json.dumps(dict(voice='marin',originalInstructions='Original direction.')))
            control=dict(allGenerationHold=True,generationHold=True)
            (p/'quality-control.json').write_text(json.dumps(control))
            args=SimpleNamespace(all=False,limit=999,budget=20,generate=True,teacher_check=True)
            self.assertEqual(m.generate(args),1);self.assertEqual(calls,[])
            control['teacherCheckAllowed']=m.TEACHER_STAGE
            (p/'quality-control.json').write_text(json.dumps(control))
            ident=m.snapshot_jobs()[0]['id'];old=p/'snapshot-candidates';old.mkdir();(old/(ident+'.wav')).write_bytes(b'keep-march-sample')
            m.append_event(p/'api-events.jsonl',dict(event='attempt',stage=m.SNAPSHOT_STAGE,id=ident,reservedUSD=.05))
            self.assertEqual(m.generate(args),0);m.generate(args);self.assertEqual(len(calls),1)
            self.assertEqual(calls[0],dict(model=m.SNAPSHOT_MODEL,voice='marin',input='بَاءْ.\n\nمِيمْ.',instructions=m.TEACHER_INSTRUCTIONS,response_format='wav',speed=1.0))
            self.assertEqual((old/(ident+'.wav')).read_bytes(),b'keep-march-sample')
            self.assertEqual((p/'teacher-candidates'/(ident+'.wav')).read_bytes(),wav())
            events=m.read_lines(p/'api-events.jsonl');self.assertEqual(events[-1]['stage'],m.TEACHER_STAGE)
            self.assertEqual(events[-1]['reviewStatus'],'unreviewed')
            self.assertAlmostEqual(sum(e.get('reservedUSD',0) for e in events),.10)
            for options in [dict(all=True),dict(all=False),dict(all=False,snapshot_check=True),dict(all=False,reference_check=True),dict(all=False,calibrate=True)]:
                self.assertEqual(m.generate(SimpleNamespace(limit=12,budget=20,generate=True,**options)),1)
            self.assertEqual(len(calls),1)

    def test_flow_is_one_instruction_only_sample_preserving_teacher_and_hold(self):
        class Response(io.BytesIO):headers={'x-request-id':'flow-test'}
        calls=[]
        class Opener:
            def open(self,request,timeout):
                calls.append(json.loads(request.data));return Response(wav())
        with tempfile.TemporaryDirectory() as td,patch.object(m,'PACKAGE',Path(td)),patch.dict(m.os.environ,{'OPENAI_API_KEY':'LOCAL-TEST-SECRET'}),patch.object(m.urllib.request,'build_opener',return_value=Opener()):
            p=Path(td);(p/'original-fm-direction.json').write_text(json.dumps(dict(voice='marin',originalInstructions='Original.')))
            control=dict(allGenerationHold=True,generationHold=True,teacherCheckAllowed=m.TEACHER_STAGE)
            (p/'quality-control.json').write_text(json.dumps(control))
            args=SimpleNamespace(all=False,limit=999,budget=20,generate=True,flow_check=True)
            self.assertEqual(m.generate(args),1);self.assertEqual(calls,[])
            control.pop('teacherCheckAllowed');control['flowCheckAllowed']=m.FLOW_STAGE
            (p/'quality-control.json').write_text(json.dumps(control))
            ident=m.teacher_jobs()[0]['id'];old=p/'teacher-candidates';old.mkdir();(old/(ident+'.wav')).write_bytes(b'keep-teacher-sample')
            m.append_event(p/'api-events.jsonl',dict(event='attempt',stage=m.TEACHER_STAGE,id=ident,reservedUSD=.05))
            self.assertEqual(m.generate(args),0);m.generate(args);self.assertEqual(len(calls),1)
            self.assertEqual(calls[0],dict(model=m.SNAPSHOT_MODEL,voice='marin',input='بَاءْ.\n\nمِيمْ.',instructions=m.teacher_jobs(flow=True)[0]['instructions'],response_format='wav',speed=1.0))
            self.assertNotEqual(calls[0]['instructions'],m.TEACHER_INSTRUCTIONS)
            self.assertIn('long vowels correct',calls[0]['instructions'])
            self.assertEqual((old/(ident+'.wav')).read_bytes(),b'keep-teacher-sample')
            self.assertEqual((p/'teacher-flow-candidates'/(ident+'.wav')).read_bytes(),wav())
            events=m.read_lines(p/'api-events.jsonl');self.assertEqual(events[-1]['stage'],m.FLOW_STAGE)
            self.assertEqual(events[-1]['reviewStatus'],'unreviewed')
            for options in [dict(all=True),dict(all=False),dict(all=False,teacher_check=True)]:
                self.assertEqual(m.generate(SimpleNamespace(limit=12,budget=20,generate=True,**options)),1)
            self.assertEqual(len(calls),1)

    def test_snapshot_service_rejection_never_falls_back_or_retries(self):
        calls=[]
        class Opener:
            def open(self,request,timeout):
                calls.append(json.loads(request.data));raise urllib.error.HTTPError(m.ENDPOINT,400,'request rejected',{},None)
        with tempfile.TemporaryDirectory() as td,patch.object(m,'PACKAGE',Path(td)),patch.dict(m.os.environ,{'OPENAI_API_KEY':'LOCAL-TEST-SECRET'}),patch.object(m.urllib.request,'build_opener',return_value=Opener()):
            p=Path(td);(p/'original-fm-direction.json').write_text(json.dumps(dict(voice='marin',originalInstructions='Recovered direction.')))
            (p/'quality-control.json').write_text(json.dumps(dict(allGenerationHold=True,generationHold=True,snapshotCheckAllowed=m.SNAPSHOT_STAGE)))
            args=SimpleNamespace(all=False,limit=12,budget=20,generate=True,snapshot_check=True)
            self.assertEqual(m.generate(args),1);m.generate(args)
            self.assertEqual(len(calls),1)
            self.assertEqual(calls[0]['model'],m.SNAPSHOT_MODEL)
            events=m.read_lines(p/'api-events.jsonl');self.assertEqual(events[-1]['httpStatus'],400)
            self.assertFalse(any(e['event']=='candidate' for e in events))

    def test_selected_teacher_library_uses_frozen_delivery_and_cumulative_queue_limit(self):
        calls=[]
        class Response:
            headers={}
            def __enter__(self):return self
            def __exit__(self,*a):pass
            def read(self,*a):return wav()
        class Opener:
            def open(self,request,timeout):calls.append(json.loads(request.data));return Response()
        with tempfile.TemporaryDirectory() as td,patch.object(m,'PACKAGE',Path(td)),patch.dict(m.os.environ,{'OPENAI_API_KEY':'LOCAL-TEST-SECRET'}),patch.object(m.urllib.request,'build_opener',return_value=Opener()):
            p=Path(td);queue=[dict(job(t),direction='syllables') for t in ['بَ','بِ','بُ']]
            (p/'api-generation-requests.jsonl').write_text(''.join(json.dumps(j)+'\n' for j in queue))
            control=dict(allGenerationHold=True,generationHold=True,teacherLibraryAllowed=m.TEACHER_LIBRARY_STAGE,teacherLibraryInstructionHash=m.sha(m.TEACHER_LIBRARY_INSTRUCTIONS.encode()))
            (p/'quality-control.json').write_text(json.dumps(control))
            m.append_event(p/'api-events.jsonl',dict(event='attempt',stage='pilot',id=queue[0]['id'],reservedUSD=.05))
            args=SimpleNamespace(all=False,limit=2,budget=20,generate=True,teacher_batch=True)
            self.assertEqual(m.generate(args),0);m.generate(args);self.assertEqual(len(calls),2)
            for i,call in enumerate(calls):
                self.assertEqual(call,dict(model=m.SNAPSHOT_MODEL,voice='marin',input=queue[i]['input'],instructions=m.TEACHER_LIBRARY_INSTRUCTIONS,response_format='wav',speed=1.0))
                self.assertEqual((p/'teacher-library-candidates'/(queue[i]['id']+'.wav')).read_bytes(),wav())
            self.assertTrue(m.TEACHER_LIBRARY_INSTRUCTIONS.startswith(m.TEACHER_INSTRUCTIONS.split('Read only each Arabic letter name')[0]))
            self.assertNotIn('two-second',m.TEACHER_LIBRARY_INSTRUCTIONS)
            self.assertNotIn('LOCAL-TEST-SECRET',(p/'api-events.jsonl').read_text())
            args.limit=3;self.assertEqual(m.generate(args),0);self.assertEqual(len(calls),3)
            self.assertTrue(all(e.get('reviewStatus')=='unreviewed' for e in m.read_lines(p/'api-events.jsonl') if e['event']=='candidate'))

    def test_teacher_library_profile_drift_is_blocked_before_key_or_network(self):
        with tempfile.TemporaryDirectory() as td,patch.object(m,'PACKAGE',Path(td)),patch.object(m.getpass,'getpass',side_effect=AssertionError('no key')),patch.object(m.urllib.request,'build_opener',side_effect=AssertionError('no network')):
            p=Path(td);args=SimpleNamespace(all=False,limit=12,budget=20,generate=True,teacher_batch=True)
            for digest in [None,'changed']:
                (p/'quality-control.json').write_text(json.dumps(dict(teacherLibraryAllowed=m.TEACHER_LIBRARY_STAGE,teacherLibraryInstructionHash=digest)))
                self.assertEqual(m.generate(args),1)

    def test_teacher_library_request_failure_stops_the_run_without_fallback(self):
        calls=[]
        class Opener:
            def open(self,request,timeout):
                calls.append(json.loads(request.data));raise urllib.error.HTTPError(m.ENDPOINT,401,'rejected',{},None)
        with tempfile.TemporaryDirectory() as td,patch.object(m,'PACKAGE',Path(td)),patch.dict(m.os.environ,{'OPENAI_API_KEY':'LOCAL-TEST-SECRET'}),patch.object(m.urllib.request,'build_opener',return_value=Opener()):
            p=Path(td);(p/'api-generation-requests.jsonl').write_text(''.join(json.dumps(job(t))+'\n' for t in ['بَ','بِ']))
            (p/'quality-control.json').write_text(json.dumps(dict(teacherLibraryAllowed=m.TEACHER_LIBRARY_STAGE,teacherLibraryInstructionHash=m.sha(m.TEACHER_LIBRARY_INSTRUCTIONS.encode()))))
            self.assertEqual(m.generate(SimpleNamespace(all=False,limit=2,budget=20,generate=True,teacher_batch=True)),1)
            self.assertEqual(len(calls),1);events=m.read_lines(p/'api-events.jsonl');self.assertEqual(events[-1]['httpStatus'],401)
            self.assertFalse(any(e['event']=='candidate' for e in events));self.assertEqual(calls[0]['model'],m.SNAPSHOT_MODEL)

    def test_teacher_repair_is_one_separate_recording_and_never_repeats(self):
        calls=[]
        class Response:
            headers={}
            def __enter__(self):return self
            def __exit__(self,*a):pass
            def read(self,*a):return wav()
        class Opener:
            def open(self,request,timeout):calls.append(json.loads(request.data));return Response()
        with tempfile.TemporaryDirectory() as td,patch.object(m,'PACKAGE',Path(td)),patch.dict(m.os.environ,{'OPENAI_API_KEY':'LOCAL-TEST-SECRET'}),patch.object(m.urllib.request,'build_opener',return_value=Opener()):
            p=Path(td);j=job('رُمَّان');original=wav();digest=m.sha(original)
            (p/'api-generation-requests.jsonl').write_text(json.dumps(j)+'\n'+json.dumps(job('بَ'))+'\n')
            (p/'teacher-library-candidates').mkdir();(p/'teacher-library-candidates'/(j['id']+'.wav')).write_bytes(original)
            (p/'teacher-library').mkdir();(p/'teacher-library/owner-review.json').write_text(json.dumps(dict(stage=m.TEACHER_LIBRARY_STAGE,reviews=[dict(id=j['id'],decision='fix',sha256=digest)])))
            (p/'teacher-repair-plan.json').write_text(json.dumps(dict(stage=m.TEACHER_REPAIR_STAGE,id=j['id'],input=j['input'],replacesSha256=digest)))
            (p/'quality-control.json').write_text(json.dumps(dict(teacherLibraryAllowed=m.TEACHER_LIBRARY_STAGE,teacherLibraryInstructionHash=m.sha(m.TEACHER_LIBRARY_INSTRUCTIONS.encode()))))
            args=SimpleNamespace(all=False,limit=12,budget=20,generate=True,teacher_repair=True)
            self.assertEqual(m.generate(args),0);m.generate(args)
            self.assertEqual(len(calls),1)
            self.assertEqual(calls[0],dict(model=m.SNAPSHOT_MODEL,voice='marin',input='رُمَّان',instructions=m.TEACHER_LIBRARY_INSTRUCTIONS,response_format='wav',speed=1.0))
            self.assertEqual((p/'teacher-library-candidates'/(j['id']+'.wav')).read_bytes(),original)
            self.assertTrue((p/'teacher-repair-candidates'/(j['id']+'.wav')).exists())
            self.assertEqual(m.read_lines(p/'api-events.jsonl')[-1]['reviewStatus'],'unreviewed')
            # Changed source or an approved item cannot use the rejected-item route.
            (p/'teacher-library-candidates'/(j['id']+'.wav')).write_bytes(b'changed')
            with self.assertRaises(ValueError):m.teacher_repair_jobs()
            (p/'teacher-library-candidates'/(j['id']+'.wav')).write_bytes(original)
            (p/'teacher-library/owner-review.json').write_text(json.dumps(dict(stage=m.TEACHER_LIBRARY_STAGE,reviews=[dict(id=j['id'],decision='correct',sha256=digest)])))
            with self.assertRaises(ValueError):m.teacher_repair_jobs()

    def test_pronunciation_check_spends_only_on_three_rejected_items_and_keeps_bulk_held(self):
        calls=[]
        class Response:
            headers={}
            def __enter__(self):return self
            def __exit__(self,*a):pass
            def read(self,*a):return wav()
        class Opener:
            def open(self,request,timeout):calls.append(json.loads(request.data));return Response()
        with tempfile.TemporaryDirectory() as td,patch.object(m,'PACKAGE',Path(td)),patch.dict(m.os.environ,{'OPENAI_API_KEY':'LOCAL-TEST-SECRET'}),patch.object(m.urllib.request,'build_opener',return_value=Opener()):
            p=Path(td);original=wav();digest=m.sha(original);jobs=[dict(job(t),replacesSha256=digest,instructions='Selected teacher direction with consonant guidance.') for t in ['كِ','تِ','تِمْسَاح']]
            (p/'teacher-library-candidates').mkdir();(p/'teacher-library').mkdir()
            for j in jobs:(p/'teacher-library-candidates'/(j['id']+'.wav')).write_bytes(original)
            (p/'teacher-library/owner-review.json').write_text(json.dumps(dict(stage=m.TEACHER_LIBRARY_STAGE,reviews=[dict(id=j['id'],decision='fix',sha256=digest) for j in jobs])))
            plan=p/'pronunciation-check-plan.json';plan.write_text(json.dumps(dict(stage=m.PRONUNCIATION_STAGE,jobs=jobs)));plan_bytes=plan.read_bytes()
            (p/'quality-control.json').write_text(json.dumps(dict(allGenerationHold=True,generationHold=True,teacherLibraryAllowed=None,pronunciationCheckAllowed=m.PRONUNCIATION_STAGE,pronunciationPlanHash=m.sha(plan_bytes))))
            args=SimpleNamespace(generate=True,all=False,limit=12,budget=20,pronunciation_check=True)
            plan.write_bytes(plan_bytes+b' ');self.assertEqual(m.generate(args),1);self.assertEqual(calls,[]);plan.write_bytes(plan_bytes)
            source=p/'teacher-library-candidates'/(jobs[0]['id']+'.wav');source.write_bytes(b'changed')
            with self.assertRaises(ValueError):m.generate(args)
            self.assertEqual(calls,[]);source.write_bytes(original)
            self.assertEqual(m.generate(args),0);m.generate(args);self.assertEqual(len(calls),3)
            for j,call in zip(jobs,calls):
                self.assertEqual(call,dict(model=m.SNAPSHOT_MODEL,voice='marin',input=j['input'],instructions=j['instructions'],response_format='wav',speed=1.0))
                self.assertEqual((p/'teacher-library-candidates'/(j['id']+'.wav')).read_bytes(),original)
                self.assertTrue((p/'pronunciation-candidates'/(j['id']+'.wav')).exists())
            self.assertEqual(m.generate(SimpleNamespace(generate=True,all=True,limit=112,budget=20,teacher_batch=True)),1)
            events=m.read_lines(p/'api-events.jsonl');self.assertEqual(len([e for e in events if e['event']=='candidate']),3)
            self.assertTrue(all(e.get('reviewStatus')=='unreviewed' for e in events if e['event']=='candidate'))
            self.assertNotIn('LOCAL-TEST-SECRET',(p/'api-events.jsonl').read_text())

    def test_timsah_context_generates_one_phrase_once_with_selected_voice(self):
        calls=[]
        class Response:
            headers={}
            def __enter__(self):return self
            def __exit__(self,*a):pass
            def read(self,*a):return wav()
        class Opener:
            def open(self,request,timeout):calls.append(json.loads(request.data));return Response()
        with tempfile.TemporaryDirectory() as td,patch.object(m,'PACKAGE',Path(td)),patch.dict(m.os.environ,{'OPENAI_API_KEY':'LOCAL-TEST-SECRET'}),patch.object(m.urllib.request,'build_opener',return_value=Opener()):
            p=Path(td);digest=m.sha(wav());j=dict(job('نَقُولُ: تِمْسَاحْ.'),targetInput='تِمْسَاح',replacesSha256=digest)
            (p/'pronunciation-candidates').mkdir();source=p/'pronunciation-candidates/lg-de1e5cba8529.wav';source.write_bytes(wav())
            (p/'teacher-library').mkdir();(p/'teacher-library/owner-review.json').write_text(json.dumps(dict(reviews=[dict(input='تِمْسَاح',decision='fix',sha256=digest)])))
            plan=p/'timsah-context-plan.json';plan.write_text(json.dumps(dict(stage=m.TIMSAH_CONTEXT_STAGE,jobs=[j])));original=plan.read_bytes()
            (p/'quality-control.json').write_text(json.dumps(dict(allGenerationHold=True,generationHold=True,timsahContextAllowed=m.TIMSAH_CONTEXT_STAGE,timsahContextPlanHash=m.sha(original))))
            args=SimpleNamespace(generate=True,all=False,limit=12,budget=20,timsah_context=True)
            plan.write_bytes(original+b' ');self.assertEqual(m.generate(args),1);self.assertEqual(calls,[]);plan.write_bytes(original)
            self.assertEqual(m.generate(args),0);m.generate(args);self.assertEqual(len(calls),1)
            self.assertEqual(calls[0],dict(model=m.SNAPSHOT_MODEL,voice='marin',input=j['input'],instructions=j['instructions'],response_format='wav',speed=1.0))
            self.assertEqual(source.read_bytes(),wav());self.assertTrue((p/'timsah-context-candidates'/(j['id']+'.wav')).exists())
            self.assertEqual(m.generate(SimpleNamespace(generate=True,all=True,limit=112,budget=20,teacher_batch=True)),1)
            events=m.read_lines(p/'api-events.jsonl');self.assertEqual(events[-1]['reviewStatus'],'unreviewed')
            source.write_bytes(b'changed')
            with self.assertRaises(ValueError):m.timsah_context_jobs()

    def test_tanwin_test_is_bounded_hash_guarded_and_never_installs(self):
        calls=[]
        class Response:
            headers={}
            def __enter__(self):return self
            def __exit__(self,*a):pass
            def read(self,*a):return wav()
        class Opener:
            def open(self,request,timeout):calls.append(json.loads(request.data));return Response()
        with tempfile.TemporaryDirectory() as td,patch.object(m,'PACKAGE',Path(td)),patch.dict(m.os.environ,{'OPENAI_API_KEY':'LOCAL-TEST-SECRET'}),patch.object(m.urllib.request,'build_opener',return_value=Opener()):
            p=Path(td);digest=m.sha(wav());jobs=[];reviews=[]
            (p/'teacher-library-candidates').mkdir();(p/'teacher-library').mkdir()
            for target,spoken in [('بً','بَنْ'),('طٍ','طِنْ'),('ضٌ','ضُنْ')]:
                ident=job(target)['id'];jobs.append(dict(job(spoken),targetInput=target,replacesSha256=digest))
                reviews.append(dict(id=ident,input=target,decision='fix',sha256=digest))
                (p/'teacher-library-candidates'/(ident+'.wav')).write_bytes(wav())
            (p/'teacher-library/owner-review.json').write_text(json.dumps(dict(reviews=reviews)))
            plan=p/'tanwin-check-plan.json';plan.write_text(json.dumps(dict(stage=m.TANWIN_STAGE,jobs=jobs)));original=plan.read_bytes()
            (p/'quality-control.json').write_text(json.dumps(dict(allGenerationHold=True,generationHold=True,tanwinCheckAllowed=m.TANWIN_STAGE,tanwinCheckPlanHash=m.sha(original))))
            args=SimpleNamespace(generate=True,all=False,limit=100,budget=20,tanwin_check=True)
            plan.write_bytes(original+b' ');self.assertEqual(m.generate(args),1);self.assertEqual(calls,[]);plan.write_bytes(original)
            self.assertEqual(m.generate(args),0);m.generate(args);self.assertEqual(len(calls),3)
            for payload,j in zip(calls,jobs):
                self.assertEqual(payload,dict(model=m.SNAPSHOT_MODEL,voice='marin',input=j['input'],instructions=j['instructions'],response_format='wav',speed=1.0))
                self.assertTrue((p/'tanwin-candidates'/(j['id']+'.wav')).exists())
            self.assertEqual(m.generate(SimpleNamespace(generate=True,all=True,limit=112,budget=20,teacher_batch=True)),1)
            self.assertFalse((p/'assets').exists())
            attempts=[e for e in m.read_lines(p/'api-events.jsonl') if e['event']=='attempt']
            self.assertEqual([e['targetInput'] for e in attempts],['بً','طٍ','ضٌ'])
            source=p/'teacher-library-candidates'/(reviews[0]['id']+'.wav');source.write_bytes(b'changed')
            with self.assertRaises(ValueError):m.tanwin_jobs()

    def test_remaining_tanwin_batch_keeps_voice_and_never_repeats_the_approved_three(self):
        calls=[]
        class Response:
            headers={}
            def __enter__(self):return self
            def __exit__(self,*a):pass
            def read(self,*a):return wav()
        class Opener:
            def open(self,request,timeout):calls.append(json.loads(request.data));return Response()
        source=m.PACKAGE
        with tempfile.TemporaryDirectory() as td,patch.object(m,'PACKAGE',Path(td)),patch.dict(m.os.environ,{'OPENAI_API_KEY':'LOCAL-TEST-SECRET'}),patch.object(m.urllib.request,'build_opener',return_value=Opener()):
            p=Path(td)
            for name in ['tanwin-remaining-plan.json','tanwin-check-plan.json','quality-control.json','teacher-library/install-approval-tanwin3-20261029.json','teacher-library/owner-review.json','teacher-library/batch100-diagnosis.json']:
                dest=p/name;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source/name,dest)
            plan=json.loads((p/'tanwin-remaining-plan.json').read_text())
            approval=json.loads((p/'teacher-library/install-approval-tanwin3-20261029.json').read_text())
            # Recreate this batch's pre-review state, independent of later approvals.
            rows=[dict(id=j['targetId'],input=j['targetInput'],sha256=j['replacesSha256'],decision='fix') for j in plan['jobs']]
            (p/'teacher-library/owner-review.json').write_text(json.dumps(dict(reviews=rows)))
            (p/'teacher-library/batch100-diagnosis.json').write_text(json.dumps(dict(held=rows)))
            control=json.loads((p/'quality-control.json').read_text())
            control.update(tanwinRemainingAllowed=m.TANWIN_REMAINING_STAGE,tanwinRemainingPlanHash=m.sha((p/'tanwin-remaining-plan.json').read_bytes()))
            (p/'quality-control.json').write_text(json.dumps(control))
            for name in [j['sourceFile'] for j in plan['jobs']]+[r['file'] for r in approval['reviews']]:
                dest=p/name;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source/name,dest)
            args=SimpleNamespace(generate=True,all=False,limit=999,budget=20,tanwin_remaining=True)
            original=(p/'tanwin-remaining-plan.json').read_bytes()
            (p/'tanwin-remaining-plan.json').write_bytes(original+b' ')
            self.assertEqual(m.generate(args),1);self.assertEqual(calls,[])
            (p/'tanwin-remaining-plan.json').write_bytes(original)
            self.assertEqual(m.generate(args),0);m.generate(args);self.assertEqual(len(calls),19)
            self.assertEqual([c['input'] for c in calls],[j['input'] for j in plan['jobs']])
            initial=json.loads((p/'tanwin-check-plan.json').read_text())
            for c in calls:
                self.assertEqual(c['instructions'],initial['jobs'][0]['instructions'])
                self.assertEqual((c['model'],c['voice'],c['speed']),(m.SNAPSHOT_MODEL,'marin',1.0))
                self.assertNotIn(c['input'],[j['input'] for j in initial['jobs']])
            self.assertEqual(m.generate(SimpleNamespace(generate=True,all=False,limit=12,budget=20,tanwin_check=True)),1)
            self.assertEqual(m.generate(SimpleNamespace(generate=True,all=True,limit=112,budget=20,teacher_batch=True)),1)
            (p/approval['reviews'][0]['file']).write_bytes(b'changed')
            with self.assertRaises(ValueError):m.tanwin_remaining_jobs()

    def test_two_tanwin_repairs_are_bound_to_rejected_files_and_do_not_repeat(self):
        calls=[]
        class Response:
            headers={}
            def __enter__(self):return self
            def __exit__(self,*a):pass
            def read(self,*a):return wav()
        class Opener:
            def open(self,request,timeout):calls.append(json.loads(request.data));return Response()
        with tempfile.TemporaryDirectory() as td,patch.object(m,'PACKAGE',Path(td)),patch.dict(m.os.environ,{'OPENAI_API_KEY':'LOCAL-TEST-SECRET'}),patch.object(m.urllib.request,'build_opener',return_value=Opener()):
            p=Path(td);(p/'tanwin-remaining-candidates').mkdir();(p/'teacher-library').mkdir();jobs=[];reviews=[]
            for target,spoken in [('وٌ','وُنْ'),('تً','تَنْ')]:
                j=dict(job(spoken),targetInput=target,targetId=job(target)['id'],replacesSha256=m.sha(wav()))
                j['sourceFile']='tanwin-remaining-candidates/'+j['id']+'.wav';(p/j['sourceFile']).write_bytes(wav());jobs.append(j)
                reviews.append(dict(id=j['targetId'],input=target,decision='fix',sha256=j['replacesSha256'],file=j['sourceFile']))
            (p/'teacher-library/owner-review.json').write_text(json.dumps(dict(reviews=reviews)))
            plan=p/'tanwin-repair-plan.json';plan.write_text(json.dumps(dict(stage=m.TANWIN_REPAIR_STAGE,jobs=jobs)));original=plan.read_bytes()
            (p/'quality-control.json').write_text(json.dumps(dict(allGenerationHold=True,generationHold=True,tanwinRepairAllowed=m.TANWIN_REPAIR_STAGE,tanwinRepairPlanHash=m.sha(original))))
            args=SimpleNamespace(generate=True,all=False,limit=999,budget=20,tanwin_repair=True)
            plan.write_bytes(original+b' ');self.assertEqual(m.generate(args),1);self.assertEqual(calls,[]);plan.write_bytes(original)
            self.assertEqual(m.generate(args),0);m.generate(args);self.assertEqual(len(calls),2)
            self.assertEqual([c['input'] for c in calls],['وُنْ','تَنْ'])
            for c,j in zip(calls,jobs):
                self.assertEqual(c,dict(model=m.SNAPSHOT_MODEL,voice='marin',speed=1.0,response_format='wav',input=j['input'],instructions=j['instructions']))
                self.assertEqual((p/j['sourceFile']).read_bytes(),wav())
            self.assertEqual(m.generate(SimpleNamespace(generate=True,all=False,limit=19,budget=20,tanwin_remaining=True)),1)
            self.assertEqual(m.generate(SimpleNamespace(generate=True,all=True,limit=112,budget=20,teacher_batch=True)),1)
            (p/jobs[0]['sourceFile']).write_bytes(b'changed')
            with self.assertRaises(ValueError):m.tanwin_repair_jobs()

if __name__=='__main__':unittest.main()
