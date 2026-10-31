#!/usr/bin/env python3
"""Offline Letter Garden Marin audit and one-file-per-item API generation.

Default is a dry run. --prepare refreshes an isolated review package. --generate
asks for a key without echoing/storing it and creates a 12-item pilot by default.
Nothing here edits the approved bank, installs a runtime service or publishes.
"""
import argparse
import csv
import fcntl
import getpass
import hashlib
import io
import json
import math
import os
from pathlib import Path
import re
import struct
import subprocess
import sys
import time
import unicodedata
import urllib.error
import urllib.request
import wave
import zipfile

ROOT = Path(__file__).resolve().parents[1]
PACKAGE = ROOT / 'docs/letter-garden/reviews/marin-api-20261028'
ENDPOINT = 'https://api.openai.com/v1/audio/speech'
MODEL = 'gpt-4o-mini-tts-2025-12-15'
RESERVATION = 0.05  # Planning allowance per attempt, NOT measured API billing.
CALIBRATION_STAGE = 'calibration-v1'
REFERENCE_STAGE = 'original-direction-v1'
SNAPSHOT_STAGE = 'snapshot-20250320-v1'
SNAPSHOT_MODEL = 'gpt-4o-mini-tts-2025-03-20'
TEACHER_STAGE = 'composed-teacher-v1'
FLOW_STAGE = 'composed-teacher-flow-v1'
TEACHER_LIBRARY_STAGE = 'composed-teacher-library-v1'
TEACHER_REPAIR_STAGE = 'composed-teacher-repair-v1'
PRONUNCIATION_STAGE = 'teacher-consonants-v1'
TIMSAH_CONTEXT_STAGE = 'teacher-timsah-context-v1'
TANWIN_STAGE = 'teacher-tanwin-v1'
TANWIN_REMAINING_STAGE = 'teacher-tanwin-remaining-v1'
TANWIN_REPAIR_STAGE = 'teacher-tanwin-repair-v1'
TEACHER_INSTRUCTIONS = ('Speak in clear Modern Standard Arabic as a warm, composed preschool teacher addressing a small class. '
    'Use a natural feminine speaking voice in a comfortable middle register, with a clear steady tone and small pitch variations. '
    'Sound attentive and gently encouraging, with understated expression. '
    'Use ordinary classroom speech with direct vowel onsets and clean endings. '
    'Keep consonants clear and long vowels accurate and evenly timed, without stretching them for expression. '
    'Avoid breathiness, whispering, vocal fry and sing-song pitch glides. '
    'Read only each Arabic letter name written in the script, in order. Say each name once. '
    'Leave a clear two-second silent pause between names. No introduction, numbers, commentary, music or additional sounds.')
# Preserve the selected voice direction verbatim. Only the task instruction
# changes: each library request contains one curriculum item, not two names.
TEACHER_LIBRARY_INSTRUCTIONS = TEACHER_INSTRUCTIONS.split('Read only each Arabic letter name')[0] + (
    'Read only the supplied Arabic item exactly once, as teaching speech. '
    'Preserve its written short and long vowels. Do not add a letter name or a lead-in. '
    'No introduction, numbers, commentary, music or additional sounds.')
CALIBRATION_INSTRUCTIONS = ('Read the supplied Arabic text exactly once in clear Modern Standard Arabic. '
    'Use your natural Marin speaking voice, an even conversational pitch and pace, '
    'and a gentle, matter-of-fact delivery.')
sha = lambda b: hashlib.sha256(b).hexdigest()
key = lambda s: unicodedata.normalize('NFC', s).strip()

def calibration_jobs():
    # A bounded experiment, not replacements or approval. Context recordings
    # include a spoken lead-in and cannot be installed as isolated game clips.
    jobs = []
    for target in ['سُكُونْ', 'مَا', 'قُلْ']:
        for variant in ['direct', 'context']:
            text = key(target if variant == 'direct' else 'اِسْتَمِعْ جَيِّدًا. ' + target + '.')
            jobs.append(dict(id='lg-' + sha(text.encode())[:12], input=text, targetInput=target,
                variant=variant, voice='marin', instructions=CALIBRATION_INSTRUCTIONS))
    return jobs

def reference_jobs():
    evidence=json.loads((PACKAGE/'original-fm-direction.json').read_text())
    if evidence.get('voice')!='marin' or not evidence.get('originalInstructions'):
        raise ValueError('Original FM direction is missing')
    text='بَاءْ.\n\nمِيمْ.'
    return [dict(id='lg-'+sha(text.encode())[:12],input=text,targetInput='بَاءْ · مِيمْ',
        variant='recovered-original-direction',voice='marin',instructions=evidence['originalInstructions'])]

def snapshot_jobs():
    # Reproduce the prior two-name request; change only the model snapshot.
    return [dict(j,variant='earlier-model-snapshot') for j in reference_jobs()]

def teacher_jobs(flow=False):
    # Keep the preferred March voice, text and speed; change direction only.
    direction=TEACHER_INSTRUCTIONS
    if flow:
        direction=direction.replace(
            'Use ordinary classroom speech with direct vowel onsets and clean endings. '
            'Keep consonants clear and long vowels accurate and evenly timed, without stretching them for expression. ',
            'Speak each complete letter name as one smooth, continuous utterance at a natural conversational pace. '
            'Keep consonants clear and Arabic long vowels correct; release each sound naturally without extra holding, internal pauses or stretching the ending. ')
    return [dict(j,variant='composed-classroom-flow' if flow else 'composed-classroom-direction',instructions=direction) for j in snapshot_jobs()]

def teacher_library_jobs():
    jobs=read_lines(PACKAGE/'api-generation-requests.jsonl')
    return [validate_job(dict(j,instructions=TEACHER_LIBRARY_INSTRUCTIONS if n<112 else TEACHER_LIBRARY_INSTRUCTIONS.replace('direct vowel onsets','clear word beginnings'),
        variant='selected-composed-teacher-library')) for n,j in enumerate(jobs)]

def teacher_repair_jobs():
    plan=json.loads((PACKAGE/'teacher-repair-plan.json').read_text())
    review=json.loads((PACKAGE/'teacher-library/owner-review.json').read_text())
    if plan.get('stage')!=TEACHER_REPAIR_STAGE or review.get('stage')!=TEACHER_LIBRARY_STAGE:
        raise ValueError('Repair plan does not match the reviewed library')
    job=next((j for j in teacher_library_jobs() if j['id']==plan.get('id') and j['input']==plan.get('input')),None)
    rejected=next((r for r in review.get('reviews',[]) if r.get('id')==plan.get('id') and r.get('decision')=='fix' and r.get('sha256')==plan.get('replacesSha256')),None)
    original=PACKAGE/'teacher-library-candidates'/(str(plan.get('id'))+'.wav')
    if not job or not rejected or not original.exists() or sha(original.read_bytes())!=plan['replacesSha256']:
        raise ValueError('Repair requires the exact owner-rejected recording; no key was read')
    return [dict(job,variant='owner-rejected-item-replacement')]

def pronunciation_jobs():
    plan=json.loads((PACKAGE/'pronunciation-check-plan.json').read_text())
    reviews=json.loads((PACKAGE/'teacher-library/owner-review.json').read_text())
    jobs=[validate_job(j) for j in plan['jobs']]
    if plan.get('stage')!=PRONUNCIATION_STAGE or reviews.get('stage')!=TEACHER_LIBRARY_STAGE or [j['input'] for j in jobs]!=['كِ','تِ','تِمْسَاح']:
        raise ValueError('This check is limited to the three rejected consonant examples')
    for job in jobs:
        match=next((r for r in reviews['reviews'] if r['id']==job['id'] and r.get('decision')=='fix' and r.get('sha256')==job.get('replacesSha256')),None)
        original=PACKAGE/'teacher-library-candidates'/(job['id']+'.wav')
        if not match or not original.exists() or sha(original.read_bytes())!=job['replacesSha256']:
            raise ValueError('Pronunciation check needs the exact rejected source')
    return jobs

def timsah_context_jobs():
    plan=json.loads((PACKAGE/'timsah-context-plan.json').read_text())
    jobs=[validate_job(j) for j in plan['jobs']]
    if plan.get('stage')!=TIMSAH_CONTEXT_STAGE or len(jobs)!=1 or jobs[0]['input']!='نَقُولُ: تِمْسَاحْ.' or jobs[0].get('targetInput')!='تِمْسَاح':
        raise ValueError('This test contains only the planned Timsah phrase')
    reviews=json.loads((PACKAGE/'teacher-library/owner-review.json').read_text())
    source=next((r for r in reviews['reviews'] if r['input']=='تِمْسَاح' and r.get('decision')=='fix' and r.get('sha256')==jobs[0].get('replacesSha256')),None)
    path=PACKAGE/'pronunciation-candidates/lg-de1e5cba8529.wav'
    if not source or not path.exists() or sha(path.read_bytes())!=jobs[0]['replacesSha256']:
        raise ValueError('The rejected word source changed; review before generating')
    return jobs

def tanwin_jobs():
    plan=json.loads((PACKAGE/'tanwin-check-plan.json').read_text())
    jobs=[validate_job(j) for j in plan['jobs']]
    if plan.get('stage')!=TANWIN_STAGE or [(j.get('targetInput'),j['input']) for j in jobs]!=[('بً','بَنْ'),('طٍ','طِنْ'),('ضٌ','ضُنْ')]:
        raise ValueError('Only the three planned teaching-sound examples are allowed')
    reviews=json.loads((PACKAGE/'teacher-library/owner-review.json').read_text())
    for job in jobs:
        target_id='lg-'+sha(job['targetInput'].encode())[:12]
        source=next((r for r in reviews['reviews'] if r['id']==target_id and r.get('decision')=='fix' and r.get('sha256')==job.get('replacesSha256')),None)
        path=PACKAGE/'teacher-library-candidates'/(target_id+'.wav')
        if not source or not path.exists() or sha(path.read_bytes())!=job['replacesSha256']:
            raise ValueError('The rejected teaching-sound source changed')
    return jobs

def tanwin_remaining_jobs():
    plan=json.loads((PACKAGE/'tanwin-remaining-plan.json').read_text())
    initial=json.loads((PACKAGE/'tanwin-check-plan.json').read_text())
    approval=json.loads((PACKAGE/'teacher-library/install-approval-tanwin3-20261029.json').read_text())
    if approval.get('kind')!='letter-garden-teacher-install-approval':
        raise ValueError('The three pilot sounds must be owner approved first')
    for trial in initial['jobs']:
        approved=next((r for r in approval['reviews'] if r['id']==trial['targetId'] and r['input']==trial['targetInput'] and r.get('generatedInput')==trial['input'] and r.get('decision')=='correct'),None)
        if not approved or approved['file']!='tanwin-candidates/'+trial['id']+'.wav' or sha((PACKAGE/approved['file']).read_bytes())!=approved['sha256']:
            raise ValueError('Initial tanwin approval no longer matches its recording')
    jobs=[validate_job(j) for j in plan['jobs']]
    held=json.loads((PACKAGE/'teacher-library/batch100-diagnosis.json').read_text())['held']
    noon={'ً':'َنْ','ٍ':'ِنْ','ٌ':'ُنْ'}
    targets=[r for r in held if len(r['input'])==2 and r['input'][-1] in noon]
    expected=[(r['input'],r['input'][0]+noon[r['input'][-1]]) for r in targets]
    if plan.get('stage')!=TANWIN_REMAINING_STAGE or len(jobs)!=19 or [(j.get('targetInput'),j['input']) for j in jobs]!=expected:
        raise ValueError('Only the 19 remaining held tanwin sounds are allowed')
    reviews=json.loads((PACKAGE/'teacher-library/owner-review.json').read_text())['reviews']
    for job,target in zip(jobs,targets):
        review=next((r for r in reviews if r['id']==target['id']),None)
        source='teacher-library-candidates/'+target['id']+'.wav'
        if (job.get('targetId')!=target['id'] or job.get('sourceFile')!=source
            or job.get('replacesSha256')!=target['sha256'] or not review or review.get('sha256')!=target['sha256']
            or job['instructions']!=initial['jobs'][0]['instructions'] or sha((PACKAGE/source).read_bytes())!=target['sha256']):
            raise ValueError('Held recording or accepted tanwin direction changed')
    return jobs

def tanwin_repair_jobs():
    plan=json.loads((PACKAGE/'tanwin-repair-plan.json').read_text())
    jobs=[validate_job(j) for j in plan['jobs']]
    if plan.get('stage')!=TANWIN_REPAIR_STAGE or [(j.get('targetInput'),j['input']) for j in jobs]!=[('وٌ','وُنْ'),('تً','تَنْ')]:
        raise ValueError('Only the two reviewed tanwin defects may be repaired')
    reviews=json.loads((PACKAGE/'teacher-library/owner-review.json').read_text())['reviews']
    for job in jobs:
        target_id='lg-'+sha(job['targetInput'].encode())[:12]
        source='tanwin-remaining-candidates/'+job['id']+'.wav'
        review=next((r for r in reviews if r['id']==target_id and r.get('decision')=='fix'),None)
        if (not review or job.get('targetId')!=target_id or job.get('sourceFile')!=source
            or review.get('file')!=source or review.get('sha256')!=job.get('replacesSha256')
            or sha((PACKAGE/source).read_bytes())!=job['replacesSha256']):
            raise ValueError('The rejected replacement changed; review before generating')
    return jobs

def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(path)

def read_lines(path):
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()] if path.exists() else []

def read_pcm(data):
    with wave.open(io.BytesIO(data), 'rb') as wav:
        channels, rate, width, declared = wav.getnchannels(), wav.getframerate(), wav.getsampwidth(), wav.getnframes()
        samples = wav.readframes(declared)
    if width != 2 or channels != 1 or rate != 24000:
        raise ValueError('Expected PCM16 mono 24 kHz WAV')
    block = channels * width
    if len(samples) % block:
        raise ValueError('Incomplete PCM frame')
    actual = len(samples) // block
    # The Speech API can return RIFF/data size 0xffffffff for a streamed WAV.
    # Measure received PCM; this marker is not a 25-hour recording. Ordinary
    # finite WAV headers must still match, so a truncated download is not hidden.
    streaming = struct.unpack_from('<I', data, 4)[0] == 0xffffffff and declared == 0xffffffff // block
    if actual != declared and not streaming:
        raise ValueError('Truncated WAV data')
    return samples, actual, streaming

def prepare_wav(data):
    samples, frames, streaming = read_pcm(data)
    if not streaming:
        return data
    output = io.BytesIO()
    with wave.open(output, 'wb') as wav:
        wav.setnchannels(1); wav.setsampwidth(2); wav.setframerate(24000)
        wav.writeframes(samples)
    return output.getvalue()

def metrics(data):
    samples, frames, streaming = read_pcm(data)
    values = struct.unpack('<' + 'h' * (len(samples) // 2), samples)
    peak = max(map(abs, values), default=0)
    duration = frames / 24000
    flags = []
    if duration < .45: flags.append('very-short')
    if duration > 15: flags.append('unexpectedly-long')
    if peak < 200: flags.append('near-silent')
    if values and sum(abs(x) >= 32760 for x in values) / len(values) > .001: flags.append('possible-clipping')
    return dict(durationSeconds=round(duration, 4), peakDbfs=round(20 * math.log10(max(peak, 1) / 32768), 2), flags=flags, streamingLengthHeader=streaming)

def validate_job(job):
    text = key(job['input'])
    if not text or text != job['input'] or len(text) > 4096:
        raise ValueError('Invalid or non-canonical input')
    if job['id'] != 'lg-' + sha(text.encode())[:12] or job.get('voice') != 'marin':
        raise ValueError('Mismatched exact text identity or voice')
    if not isinstance(job.get('instructions'), str) or len(job['instructions']) > 4000:
        raise ValueError('Invalid instructions')
    return job

def prepare(archive):
    # Reuse the tested source catalogue; do not infer pronunciation from spelling.
    command = "import {auditAudio,writePackage} from './scripts/audit-letter-garden-audio.mjs'; const a=await auditAudio(); writePackage(a,process.argv[1]);"
    subprocess.run(['node', '--input-type=module', '-e', command, str(PACKAGE)], cwd=ROOT, check=True)
    audit = json.loads((PACKAGE / 'inventory.json').read_text())
    jobs = {x['id']: x for x in read_lines(PACKAGE / 'generation-requests.jsonl')}
    recovered, blocked = {}, {}
    if archive.exists():
        with zipfile.ZipFile(archive) as z:
            prefix = 'marin-complete-20261020/'
            history = [json.loads(line) for line in z.read(prefix+'generation-manifest.jsonl').decode().splitlines() if line.strip()]
            for event in history:
                ident = event.get('id')
                if ident not in jobs or not event.get('preparedPath') or not event.get('sha256'): continue
                if key(event.get('input', '')) != jobs[ident]['input'] or event.get('voice') != 'marin': continue
                path = f'candidates/{ident}.wav'  # Never trust an archive path for extraction.
                data = z.read(prefix + path)
                if sha(data) != event['sha256']: raise ValueError('Hank candidate checksum mismatch')
                info = metrics(data)
                dest = PACKAGE / path
                dest.parent.mkdir(parents=True, exist_ok=True)
                if dest.exists() and sha(dest.read_bytes()) != sha(data): raise ValueError('Candidate already exists with different bytes')
                dest.write_bytes(data)
                recovered[ident] = dict(id=ident,text=jobs[ident]['input'],file=path,sha256=sha(data),voice='marin',reviewStatus='unreviewed',source='Hank supplied archive',**info)
            triage = json.loads(z.read(prefix+'reports/quran-pronunciation-triage.json'))
            for item in triage['proposedBlockers']:
                if item['id'] in jobs and key(item['input']) == jobs[item['id']]['input']:
                    blocked[item['id']] = item
    reusable = {i for i, r in recovered.items() if not r['flags']}
    queued = []
    for ident, job in jobs.items():
        if ident in reusable or ident in blocked: continue
        entry = next(e for e in audit['entries'] if e['id'] == ident)
        queued.append(dict(job, direction=entry['direction'], replacementOfFlaggedCandidate=ident in recovered))
    # Favor broadly reused early-learning speech; sample every direction first.
    queued.sort(key=lambda x: (-len(x['uses']), x['id']))
    pilot, used = [], set()
    for direction in ['names','syllables','story-words','quran-reading']:
        for job in [j for j in queued if j['direction'] == direction][:3]:
            pilot.append(job); used.add(job['id'])
    for job in queued:
        if len(pilot) >= 12: break
        if job['id'] not in used: pilot.append(job); used.add(job['id'])
    ordered = pilot + [j for j in queued if j['id'] not in used]
    for job in ordered: validate_job(job)
    (PACKAGE/'api-generation-requests.jsonl').write_text(''.join(json.dumps(x,ensure_ascii=False)+'\n' for x in ordered))
    write_json(PACKAGE/'recovered-candidates.json', list(recovered.values()))
    write_json(PACKAGE/'contextual-reading-review.json', list(blocked.values()))
    unresolved = [e for e in audit['entries'] if e['status'] not in ['approved-local','local-name-sequence']]
    with (PACKAGE/'not-yet-marin.csv').open('w',newline='') as f:
        writer=csv.writer(f);writer.writerow(['id','Arabic','Current fallback','Next action','Used by'])
        for entry in unresolved:
            ident=entry['id']
            action='Teaching example needed' if entry['status']=='pronunciation-decision' else 'Reading context to confirm' if ident in blocked else 'Review existing candidate' if ident in reusable else 'Generate one Marin file'
            writer.writerow([ident,entry['text'],'Remote recitation where audioPath exists; device speech otherwise' if entry.get('remoteRecitation') else 'Device Arabic speech',action,'; '.join(entry['uses'])])
    summary=dict(counts=audit['counts'],uncovered=len(unresolved),allAlphabetNamesCovered=all(e['status']=='approved-local' for e in audit['entries'] if 'alphabet' in e['uses']),generationByType={d:sum(j['direction']==d for j in ordered) for d in ['names','syllables','story-words','quran-reading']},recovered=len(recovered),reusableUnreviewed=len(reusable),flaggedCandidates=[x for x in recovered.values() if x['flags']],contextualReadingReview=len(blocked),readyForAPI=len(ordered),pilotIds=[j['id'] for j in pilot],pricing={'textInputPerMillionUSD':.60,'audioOutputPerMillionUSD':12,'source':'https://developers.openai.com/api/docs/pricing','checked':'2026-10-28'},planningReservationPerAttemptUSD=RESERVATION,planningReservationForQueueUSD=round(len(ordered)*RESERVATION,2),budgetNote='Reservation is not actual billing or an account-level hard cap. Check pilot usage in the API dashboard before the full run.',model=MODEL,modelShutdown='2027-01-06')
    write_json(PACKAGE/'summary.json',summary)
    return summary

def append_event(path, event):
    with path.open('a') as f:
        f.write(json.dumps(dict(timestamp=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),**event),ensure_ascii=False)+'\n');f.flush();os.fsync(f.fileno())

def pending_jobs(jobs, events, limit, budget, stage='pilot'):
    # Any prior attempt is held, including uncertain outcomes; no blind retries.
    attempted=set()
    for event in events:
        if event.get('stage', 'pilot') != stage: continue
        if event.get('event')=='attempt': attempted.add(event['id'])
        elif event.get('event')=='retry-authorized' and event.get('reason')=='confirmed-http-401-no-audio': attempted.discard(event['id'])
    reserved=sum(e.get('reservedUSD',0) for e in events if e.get('event')=='attempt')
    pending=[validate_job(j) for j in jobs if j['id'] not in attempted][:limit]
    if reserved+len(pending)*RESERVATION > budget+1e-8:
        raise ValueError('Planning allowance would be exceeded; review usage before another batch')
    return pending,reserved

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,req,fp,code,msg,headers,newurl):
        return None  # Never forward Authorization to another host.

def generate(args):
    PACKAGE.mkdir(parents=True, exist_ok=True)
    with (PACKAGE/'.generation.lock').open('w') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        calibrating=getattr(args,'calibrate',False)
        reference_check=getattr(args,'reference_check',False)
        snapshot_check=getattr(args,'snapshot_check',False)
        flow_check=getattr(args,'flow_check',False)
        teacher_repair=getattr(args,'teacher_repair',False)
        pronunciation_check=getattr(args,'pronunciation_check',False)
        timsah_context=getattr(args,'timsah_context',False)
        tanwin_check=getattr(args,'tanwin_check',False)
        tanwin_remaining=getattr(args,'tanwin_remaining',False)
        tanwin_repair=getattr(args,'tanwin_repair',False)
        teacher_batch=getattr(args,'teacher_batch',False) or teacher_repair
        teacher_check=getattr(args,'teacher_check',False) or flow_check
        teacher_stage=FLOW_STAGE if flow_check else TEACHER_STAGE
        stage=TEACHER_REPAIR_STAGE if teacher_repair else TEACHER_LIBRARY_STAGE if teacher_batch else teacher_stage if teacher_check else SNAPSHOT_STAGE if snapshot_check else REFERENCE_STAGE if reference_check else CALIBRATION_STAGE if calibrating else 'pilot'
        selected_model=SNAPSHOT_MODEL if teacher_batch or snapshot_check or teacher_check else MODEL
        if pronunciation_check:stage,selected_model=PRONUNCIATION_STAGE,SNAPSHOT_MODEL
        if timsah_context:stage,selected_model=TIMSAH_CONTEXT_STAGE,SNAPSHOT_MODEL
        if tanwin_check:stage,selected_model=TANWIN_STAGE,SNAPSHOT_MODEL
        if tanwin_remaining:stage,selected_model=TANWIN_REMAINING_STAGE,SNAPSHOT_MODEL
        if tanwin_repair:stage,selected_model=TANWIN_REPAIR_STAGE,SNAPSHOT_MODEL
        control_path=PACKAGE/'quality-control.json'
        control=json.loads(control_path.read_text()) if control_path.exists() else {}
        if teacher_batch and control.get('teacherBatchMaximum') and (args.all or args.limit>control['teacherBatchMaximum'] or sha((PACKAGE/'api-generation-requests.jsonl').read_bytes())!=control.get('teacherNextQueueHash')):
            raise ValueError('Use only the saved next-100 queue and limit 212')
        reference_allowed=reference_check and control.get('referenceCheckAllowed')==REFERENCE_STAGE
        snapshot_allowed=snapshot_check and control.get('snapshotCheckAllowed')==SNAPSHOT_STAGE
        teacher_allowed=teacher_check and control.get('flowCheckAllowed' if flow_check else 'teacherCheckAllowed')==teacher_stage
        library_allowed=(teacher_batch and control.get('teacherLibraryAllowed')==TEACHER_LIBRARY_STAGE
            and control.get('teacherLibraryInstructionHash')==sha(TEACHER_LIBRARY_INSTRUCTIONS.encode()))
        pronunciation_allowed=(pronunciation_check and control.get('pronunciationCheckAllowed')==PRONUNCIATION_STAGE
            and (PACKAGE/'pronunciation-check-plan.json').exists()
            and control.get('pronunciationPlanHash')==sha((PACKAGE/'pronunciation-check-plan.json').read_bytes()))
        context_allowed=(timsah_context and control.get('timsahContextAllowed')==TIMSAH_CONTEXT_STAGE
            and (PACKAGE/'timsah-context-plan.json').exists()
            and control.get('timsahContextPlanHash')==sha((PACKAGE/'timsah-context-plan.json').read_bytes()))
        tanwin_allowed=(tanwin_check and control.get('tanwinCheckAllowed')==TANWIN_STAGE
            and (PACKAGE/'tanwin-check-plan.json').exists()
            and control.get('tanwinCheckPlanHash')==sha((PACKAGE/'tanwin-check-plan.json').read_bytes()))
        tanwin_remaining_allowed=(tanwin_remaining and control.get('tanwinRemainingAllowed')==TANWIN_REMAINING_STAGE
            and (PACKAGE/'tanwin-remaining-plan.json').exists()
            and control.get('tanwinRemainingPlanHash')==sha((PACKAGE/'tanwin-remaining-plan.json').read_bytes()))
        tanwin_repair_allowed=(tanwin_repair and control.get('tanwinRepairAllowed')==TANWIN_REPAIR_STAGE
            and (PACKAGE/'tanwin-repair-plan.json').exists()
            and control.get('tanwinRepairPlanHash')==sha((PACKAGE/'tanwin-repair-plan.json').read_bytes()))
        experiment_allowed=reference_allowed or snapshot_allowed or teacher_allowed or library_allowed or pronunciation_allowed or context_allowed or tanwin_allowed or tanwin_remaining_allowed or tanwin_repair_allowed
        if args.generate and tanwin_repair and not tanwin_repair_allowed:
            print('The two-sound repair plan is not enabled or has changed. No key was read or request made.',file=sys.stderr)
            return 1
        if args.generate and tanwin_remaining and not tanwin_remaining_allowed:
            print('The remaining tanwin repair plan is not enabled or has changed. No key was read or request made.',file=sys.stderr)
            return 1
        if args.generate and tanwin_check and not tanwin_allowed:
            print('The three-sound ending test is not enabled or has changed. No key was read or request made.',file=sys.stderr)
            return 1
        if args.generate and timsah_context and not context_allowed:
            print('The one-phrase Timsah test is not enabled or has changed. No key was read or request made.',file=sys.stderr)
            return 1
        if args.generate and pronunciation_check and not pronunciation_allowed:
            print('The three-item pronunciation plan is not enabled or has changed. No key was read or request made.',file=sys.stderr)
            return 1
        if args.generate and teacher_batch and not library_allowed:
            print('The composed-teacher library settings are not selected. No key was read or request made.',file=sys.stderr)
            return 1
        if args.generate and teacher_check and not teacher_allowed:
            print('The one-recording teacher direction test is not enabled. No API request was made.',file=sys.stderr)
            return 1
        if args.generate and snapshot_check and not snapshot_allowed:
            print('The one-recording snapshot comparison is not enabled. No API request was made.',file=sys.stderr)
            return 1
        if args.generate and reference_check and not reference_allowed:
            print('The one-recording reference check is not enabled. No API request was made.',file=sys.stderr)
            return 1
        if args.generate and control.get('allGenerationHold') and not experiment_allowed:
            print('All audio generation is on hold: the comparison did not match the approved voice. No key was read and no API request was made. Recover the original voice settings before any further experiment.',file=sys.stderr)
            return 1
        if args.generate and not calibrating and not experiment_allowed and control.get('generationHold'):
            print('Generation is on hold: the pilot failed listening review. No key was read and no API request was made. Use only the six-file calibration test after reviewing its plan.',file=sys.stderr)
            return 1
        jobs=teacher_repair_jobs() if teacher_repair else teacher_library_jobs() if teacher_batch else teacher_jobs(flow=flow_check) if teacher_check else snapshot_jobs() if snapshot_check else reference_jobs() if reference_check else calibration_jobs() if calibrating else read_lines(PACKAGE/'api-generation-requests.jsonl')
        if pronunciation_check:jobs=pronunciation_jobs()
        if timsah_context:jobs=timsah_context_jobs()
        if tanwin_check:jobs=tanwin_jobs()
        if tanwin_remaining:jobs=tanwin_remaining_jobs()
        if tanwin_repair:jobs=tanwin_repair_jobs()
        if not jobs: raise ValueError('Prepare the audit first')
        # Library limits are a cumulative queue boundary. Re-running 12 never
        # silently spends on item 13 after a rejected or uncertain item.
        if teacher_batch and not args.all: jobs=jobs[:args.limit]
        ledger=PACKAGE/'api-events.jsonl';events=read_lines(ledger)
        latest_candidates={e['id']:e for e in events if e.get('event')=='candidate' and e.get('stage','pilot')==stage}
        completed=sum(not e.get('flags') for e in latest_candidates.values())
        limit=len(jobs) if teacher_batch or teacher_check or snapshot_check or reference_check or calibrating or args.all else max(0,args.limit-completed)
        if pronunciation_check or timsah_context or tanwin_check or tanwin_remaining or tanwin_repair:limit=len(jobs)
        pending,reserved=pending_jobs(jobs,events,limit,args.budget,stage=stage)
        print(json.dumps(dict(stage=stage,model=selected_model,remaining=len(pending),generationHold=bool(control.get('generationHold')),planningReservationUSD=round(len(pending)*RESERVATION,2),previousReservationUSD=round(reserved,2),mode='generate' if args.generate else 'dry-run'),indent=2))
        if not args.generate:return
        if not pending:
            print('No unattempted items in this batch. No key was requested. Review the saved recordings or recorded failure before another run.')
            return
        # Key is never accepted as a command-line argument, persisted or logged.
        secret=os.environ.get('OPENAI_API_KEY','').strip()
        if not secret:
            if not sys.stdin.isatty(): raise ValueError('Run in an interactive Terminal for hidden key entry')
            secret=getpass.getpass('OpenAI API key (hidden; not saved): ').strip()
        if not secret: raise ValueError('No API key supplied')
        opener=urllib.request.build_opener(NoRedirect())
        prefix='teacher-repair' if teacher_repair else 'teacher-library' if teacher_batch else 'teacher-flow' if flow_check else 'teacher' if teacher_check else 'snapshot' if snapshot_check else 'reference' if reference_check else 'calibration' if calibrating else 'api'
        if pronunciation_check:prefix='pronunciation'
        if timsah_context:prefix='timsah-context'
        if tanwin_check:prefix='tanwin'
        if tanwin_remaining:prefix='tanwin-remaining'
        if tanwin_repair:prefix=getattr(args,'output_prefix','tanwin-repair')
        destination=PACKAGE/(prefix+'-candidates');destination.mkdir(exist_ok=True)
        raw_directory=PACKAGE/(prefix+'-raw');raw_directory.mkdir(exist_ok=True)
        for index,job in enumerate(pending,1):
            target=destination/(job['id']+'.wav')
            raw_target=raw_directory/(job['id']+'.wav')
            if target.exists() or raw_target.exists():raise ValueError('Unlogged file exists; inspect it rather than overwrite')
            payload=dict(model=selected_model,voice='marin',input=job['input'],instructions=job['instructions'],response_format='wav',speed=1.0)
            append_event(ledger,dict(event='attempt',stage=stage,id=job['id'],input=job['input'],targetInput=job.get('targetInput',job['input']),variant=job.get('variant'),model=selected_model,voice='marin',instructions=job['instructions'],reservedUSD=RESERVATION,reviewStatus='unreviewed'))
            print(f"{index}/{len(pending)}: {job['input']}",flush=True)
            request=urllib.request.Request(ENDPOINT,data=json.dumps(payload).encode(),headers={'Authorization':'Bearer '+secret,'Content-Type':'application/json'},method='POST')
            try:
                with opener.open(request,timeout=90) as response:
                    data=response.read(4_000_001)
                    request_id=response.headers.get('x-request-id')
                if len(data)>4_000_000:raise ValueError('Response larger than expected for an isolated item')
                # Preserve raw response and every PCM sample. Only replace streaming
                # length markers in the playable copy; do not trim or re-encode.
                raw_target.write_bytes(data)
                prepared=prepare_wav(data)
                target.write_bytes(prepared)
                info=metrics(prepared)
                append_event(ledger,dict(event='candidate',stage=stage,id=job['id'],file=str(target.relative_to(PACKAGE)),sha256=sha(prepared),rawFile=str(raw_target.relative_to(PACKAGE)),rawSha256=sha(data),headerNormalized=prepared!=data,requestId=request_id,reviewStatus='unreviewed',**info))
                # Short syllables can legitimately be brief. This opt-in batch
                # keeps the warning in the ledger/review, without halting on it.
                blocking_flags = [flag for flag in info['flags']
                    if not (flag == 'very-short' and getattr(args, 'continue_short_for_review', False))]
                if blocking_flags:raise ValueError('Candidate needs technical review; stopped before spending more')
            except Exception as exc:
                append_event(ledger,dict(event='stopped',stage=stage,id=job['id'],errorType=type(exc).__name__,httpStatus=getattr(exc,'code',None)))
                if isinstance(exc, urllib.error.HTTPError) and exc.code == 401:
                    message='OpenAI rejected the key (HTTP 401). No audio was returned; copy the complete API key next time.'
                elif isinstance(exc, ValueError):
                    message='The downloaded file needs review. Your key was accepted; do not regenerate it.'
                else:
                    message='The request did not finish cleanly; check API usage before any retry.'
                print(message+' Saved details are in api-events.jsonl. No automatic retry; key is not logged.',file=sys.stderr)
                return 1
        print('Candidate files saved for review. Approved game audio is unchanged.')
    return 0

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--prepare',action='store_true')
    parser.add_argument('--archive',type=Path,default=Path.home()/'Downloads/letter-garden-marin-results-20261020.zip')
    parser.add_argument('--generate',action='store_true')
    parser.add_argument('--calibrate',action='store_true',help='Only six comparison clips for Sukoon, Maa and Qul; not game replacements')
    parser.add_argument('--reference-check',action='store_true',help='One recording: Baa then Meem, using the recovered original FM direction')
    parser.add_argument('--snapshot-check',action='store_true',help='One Baa / Meem comparison on the documented March 2025 snapshot; all other request settings unchanged')
    parser.add_argument('--teacher-check',action='store_true',help='One Baa / Meem recording on March 2025 Marin; composed classroom direction only')
    parser.add_argument('--flow-check',action='store_true',help='One Baa / Meem recording retaining the composed teacher voice, with smoother natural phrasing')
    parser.add_argument('--teacher-batch',action='store_true',help='Build missing curriculum files using the selected composed-teacher March Marin direction; --limit is a cumulative queue boundary')
    parser.add_argument('--teacher-repair',action='store_true',help='Generate only the owner-rejected item in the saved repair plan, preserving the original')
    parser.add_argument('--pronunciation-check',action='store_true',help='Only three rejected consonant examples with explicit pronunciation guidance; bulk generation stays held')
    parser.add_argument('--timsah-context',action='store_true',help='One short phrase containing Timsah, for review before any word extraction')
    parser.add_argument('--tanwin-check',action='store_true',help='Three isolated teaching sounds with explicit final noon; review only, no installation')
    parser.add_argument('--tanwin-remaining',action='store_true',help='Only the 19 remaining held tanwin sounds using the owner-approved pronunciation approach')
    parser.add_argument('--tanwin-repair',action='store_true',help='Only the rejected wun vowel and tan opening; preserves the other approved recordings')
    parser.add_argument('--all',action='store_true',help='Generate all remaining eligible requests after the pilot review')
    parser.add_argument('--limit',type=int,default=12)
    parser.add_argument('--budget',type=float,default=20,help='Cumulative planning reservation, not a guaranteed billing cap; never over $23')
    args=parser.parse_args()
    if args.tanwin_repair and (args.all or args.prepare or args.tanwin_remaining or args.tanwin_check or args.timsah_context or args.pronunciation_check or args.teacher_repair or args.teacher_batch or args.calibrate or args.reference_check or args.snapshot_check or args.teacher_check or args.flow_check):parser.error('--tanwin-repair is a separate two-item repair mode')
    if args.tanwin_remaining and (args.all or args.prepare or args.tanwin_check or args.timsah_context or args.pronunciation_check or args.teacher_repair or args.teacher_batch or args.calibrate or args.reference_check or args.snapshot_check or args.teacher_check or args.flow_check):parser.error('--tanwin-remaining is a separate 19-item repair mode')
    if args.tanwin_check and (args.all or args.prepare or args.timsah_context or args.pronunciation_check or args.teacher_repair or args.teacher_batch or args.calibrate or args.reference_check or args.snapshot_check or args.teacher_check or args.flow_check):parser.error('--tanwin-check is a separate three-item mode')
    if args.timsah_context and (args.all or args.prepare or args.pronunciation_check or args.teacher_repair or args.teacher_batch or args.calibrate or args.reference_check or args.snapshot_check or args.teacher_check or args.flow_check):parser.error('--timsah-context is a separate one-phrase mode')
    if args.pronunciation_check and (args.all or args.prepare or args.teacher_repair or args.teacher_batch or args.calibrate or args.reference_check or args.snapshot_check or args.teacher_check or args.flow_check):parser.error('--pronunciation-check is a separate three-item mode')
    if args.teacher_repair and (args.all or args.prepare or args.teacher_batch or args.calibrate or args.reference_check or args.snapshot_check or args.teacher_check or args.flow_check):parser.error('--teacher-repair is a separate one-item mode')
    if args.teacher_batch and (args.prepare or args.calibrate or args.reference_check or args.snapshot_check or args.teacher_check or args.flow_check):parser.error('--teacher-batch cannot be combined with preparation or voice experiments')
    if args.calibrate and (args.all or args.prepare):parser.error('--calibrate cannot be combined with --all or --prepare')
    if args.reference_check and (args.all or args.prepare or args.calibrate):parser.error('--reference-check cannot be combined with other generation modes or --prepare')
    if args.snapshot_check and (args.all or args.prepare or args.calibrate or args.reference_check):parser.error('--snapshot-check cannot be combined with other generation modes or --prepare')
    if args.teacher_check and (args.all or args.prepare or args.calibrate or args.reference_check or args.snapshot_check):parser.error('--teacher-check cannot be combined with other generation modes or --prepare')
    if args.flow_check and (args.all or args.prepare or args.calibrate or args.reference_check or args.snapshot_check or args.teacher_check):parser.error('--flow-check cannot be combined with other generation modes or --prepare')
    if not math.isfinite(args.budget) or not 0<args.budget<=23 or args.limit<1:parser.error('Budget must be positive and at most $23; limit must be positive')
    if args.prepare:
        summary=prepare(args.archive);print(json.dumps(summary,ensure_ascii=False,indent=2));return 0
    return generate(args)

if __name__=='__main__':
    try:sys.exit(main())
    except (ValueError,OSError,subprocess.CalledProcessError) as exc:
        # Deliberately do not echo exception details that could originate in HTTP.
        print('Cannot continue: '+type(exc).__name__+'. Check the local audit, selected options and API usage. No key was saved.',file=sys.stderr);sys.exit(1)
