#!/usr/bin/env python3
"""Bounded eight-item review batch using the existing guarded audio runner."""
import argparse, importlib.util, json
from pathlib import Path
from types import SimpleNamespace
spec=importlib.util.spec_from_file_location('runner',Path(__file__).with_name('letter-garden-marin-api.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
p=m.PACKAGE
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--generate',action='store_true');args=parser.parse_args()
plan=json.loads((p/'combined64-plan.json').read_text());control=json.loads((p/'quality-control.json').read_text())
assert control.get('combined64Allowed')==plan['stage']=='teacher-combined64-v1'
assert control.get('combined64PlanHash')==m.sha((p/'combined64-plan.json').read_bytes())
jobs=[m.validate_job(j) for j in plan['jobs']];assert len(jobs)==64
for j in jobs:
 if j.get('sourceFile'):
  assert j['sourceFile']=='teacher-library-candidates/'+j['targetId']+'.wav'
  assert m.sha((p/j['sourceFile']).read_bytes())==j['replacesSha256']
# Isolate this batch's control and output while reusing authentication, budget,
# ledger, no-retry and WAV handling. No runtime installation is performed.
original_read=m.Path.read_text
original_jobs=m.tanwin_repair_jobs
m.TANWIN_REPAIR_STAGE=plan['stage']
m.tanwin_repair_jobs=lambda:jobs
# Runner's two-item mode is an internal execution adapter only.
def read_text(self,*a,**kw):
 text=original_read(self,*a,**kw)
 if self==p/'quality-control.json':
  d=json.loads(text);d['tanwinRepairAllowed']=plan['stage'];d['tanwinRepairPlanHash']=m.sha((p/'tanwin-repair-plan.json').read_bytes());return json.dumps(d)
 return text
m.Path.read_text=read_text
m.generate(SimpleNamespace(generate=args.generate,all=False,limit=64,budget=23,tanwin_repair=True,output_prefix='combined64'))
