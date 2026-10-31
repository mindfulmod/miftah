#!/usr/bin/env python3
"""Install an explicit owner-reviewed snapshot; default is a read-only dry run."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import unicodedata
import wave
import io

ROOT = Path(__file__).resolve().parents[1]
PACKAGE = Path('docs/letter-garden/reviews/marin-api-20261028')
BUNDLE = Path('assets/audio/letters/marin-teacher-v1')
sha = lambda data: hashlib.sha256(data).hexdigest()

def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + '.tmp')
    temp.write_bytes(data)
    temp.replace(path)

def install(review_file, apply=False):
    review_path = (ROOT / review_file).resolve()
    if not review_path.is_relative_to(ROOT): raise ValueError('Review must be preserved in the repository')
    evidence = review_path.read_bytes()
    review = json.loads(evidence)
    if review.get('kind') != 'letter-garden-teacher-install-approval': raise ValueError('Explicit owner approval required')
    held = {i['id'] for i in review['held']}
    bank_path = ROOT / 'src/letters/LetterVoiceClips.js'
    bank_source = bank_path.read_text()
    match = re.search(r'Object.freeze\((\{.*?\})\)', bank_source, re.S)
    bank = json.loads(match[1])
    manifest_path = ROOT / BUNDLE / 'manifest.json'
    prior = json.loads(manifest_path.read_text())['items'] if manifest_path.exists() else []
    installed = {i['text']: i for i in prior}
    prepared, seen = [], set()
    for item in review['reviews']:
        text = item['input']
        ident = 'lg-' + sha(text.encode())[:12]
        if text != unicodedata.normalize('NFC', text).strip() or item['id'] != ident or ident in seen or ident in held or item['decision'] != 'correct':
            raise ValueError('Ambiguous, duplicate or unapproved item')
        seen.add(ident)
        source = (ROOT / PACKAGE / item['file']).resolve()
        if not source.is_relative_to(ROOT / PACKAGE) or source.suffix != '.wav': raise ValueError('Invalid source file')
        data = source.read_bytes()
        if sha(data) != item['sha256']: raise ValueError('The approved recording changed')
        with wave.open(io.BytesIO(data), 'rb') as wav:
            if (wav.getnchannels(), wav.getsampwidth(), wav.getframerate()) != (1, 2, 24000): raise ValueError('Unexpected WAV format')
            duration = wav.getnframes() / 24000
            if not 0 < duration <= 15: raise ValueError('Unexpected isolated-clip length')
        dest = BUNDLE / (ident + '-' + item['sha256'][:12] + '.wav')
        if text in bank and bank[text] != str(dest): raise ValueError('Would replace an existing approved mapping')
        if (ROOT / dest).exists() and (ROOT / dest).read_bytes() != data: raise ValueError('Installed bytes changed')
        bank[text] = str(dest)
        installed[text] = dict(id=ident, text=text, file=str(dest), sha256=item['sha256'],
            durationSeconds=duration, sourceFile=str(source.relative_to(ROOT)),
            approvalFile=str(review_path.relative_to(ROOT)), approvalSHA256=sha(evidence))
        prepared.append((ROOT / dest, data))
    manifest = dict(voice='marin', processing='Exact copies of owner-approved WAV files; no audio transformations.', items=list(installed.values()))
    bank_text = bank_source[:match.start(1)] + json.dumps(bank, ensure_ascii=False, indent=2) + bank_source[match.end(1):]
    bank_text = bank_text.replace('Locally bundled AI speech from owner-supplied OpenAI.fm Marin recordings.', 'Locally bundled owner-approved Marin speech from OpenAI.fm and API recordings.')
    sw_path = ROOT / 'sw.js'; sw = sw_path.read_text()
    begin, end = '  // BEGIN MARIN TEACHER AUDIO', '  // END MARIN TEACHER AUDIO'
    block = '\n'.join([begin] + ['  "' + i['file'] + '",' for i in manifest['items']] + [end])
    sw = re.sub(re.escape(begin)+'.*?'+re.escape(end), lambda _: block, sw, flags=re.S) if begin in sw else sw.replace('const SHELL = [', 'const SHELL = [\n'+block)
    version = 'miftah-v429-letter-garden-marin-teacher-' + sha(bank_text.encode())[:10]
    sw = re.sub(r'const VERSION = "[^"]+";', 'const VERSION = "'+version+'";', sw, count=1)
    html_path = ROOT / 'letters.html'; html = html_path.read_text()
    html = re.sub(r'src/letters/LetterVoiceClips.js\?v=[^"\s]+', 'src/letters/LetterVoiceClips.js?v=marin-teacher-'+sha(bank_text.encode())[:10], html)
    if apply:
        for path, data in prepared: write(path, data)
        write(manifest_path, (json.dumps(manifest, ensure_ascii=False, indent=2)+'\n').encode())
        write(bank_path, bank_text.encode()); write(sw_path, sw.encode()); write(html_path, html.encode())
    return dict(applied=apply, approvedInSnapshot=len(prepared), bundleClips=len(installed), totalRuntimeClips=len(bank), held=len(held))

if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('review', type=Path)
    parser.add_argument('--apply', action='store_true')
    args=parser.parse_args()
    print(json.dumps(install(args.review, args.apply), indent=2))
