#!/usr/bin/env python3
"""Reproduce source-audited cuts; never infer a pronunciation from list position.

Uses the sibling letter-garden-voice-runtime (numpy/soundfile). The cut sheet
records source hashes, exact curriculum keys, bounds and mapping evidence.
Uncertain clips can be auditioned, but are never added to runtime playback.
"""
import hashlib
import json
import re
import unicodedata
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[1]
REVIEW = ROOT / 'docs/letter-garden/reviews/marin-curriculum'
ASSETS = ROOT / 'assets/audio/letters/marin-curriculum-v1'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    sheet = json.loads((REVIEW / 'cuts.json').read_text())
    expected = [item['text'] for item in json.loads((REVIEW / 'request-items.json').read_text())]
    assert len(expected) == len(set(expected)) == 409
    sources = {}
    for info in sheet['sources']:
        path = REVIEW / info['file']
        assert sha(path) == info['sha256'], 'Source changed: do not reuse its cut positions'
        data, sr = sf.read(path)
        assert sr == 24000 and data.ndim == 1 and np.isfinite(data).all()
        sources[info['id']] = (data, sr)
        info['duration'] = round(len(data) / sr, 4)

    # Keep the previously reviewed alphabet source intact on reruns.
    runtime = ROOT / 'src/letters/LetterVoiceClips.js'
    previous = json.loads(re.search(r'Object.freeze\((\{.*?\})\)', runtime.read_text(), re.S)[1])
    clips = {key: value for key, value in previous.items() if '/marin-v1/' in value}
    assert len(clips) == 25, 'The original voice bank changed; review before importing'
    cuts = {unicodedata.normalize('NFC', cut['text']): cut for cut in sheet['cuts']}
    assert len(cuts) == len(sheet['cuts']) and set(cuts) <= set(expected)
    ASSETS.mkdir(parents=True, exist_ok=True)
    (REVIEW / 'candidates').mkdir(exist_ok=True)
    items = []
    for index, text in enumerate(expected, 1):
        item = {'id': f'lg-{hashlib.sha256(text.encode()).hexdigest()[:12]}',
                'position': index, 'text': text, 'status': 'needs-review',
                'note': 'No reliable isolated mapping yet. Existing device speech remains active.'}
        cut = cuts.get(text)
        if cut:
            item.update(cut)
            item['text'] = text
            assert item['status'] in ('imported', 'needs-review', 'missing')
            if 'start' in cut:
                data, sr = sources[cut['source']]
                start, end = round(cut['start'] * sr), round(cut['end'] * sr)
                assert 0 <= start < end <= len(data)
                clip = data[start:end].copy()
                assert .12 <= len(clip) / sr <= 4
                # Quiet-gap cuts retain the original pitch, speed and levels.
                fade = min(round(sr * .004), len(clip) // 2)
                clip[:fade] *= np.linspace(0, 1, fade)
                clip[-fade:] *= np.linspace(1, 0, fade)
                assert .008 < np.max(np.abs(clip)) < .999
                destination = ((ASSETS if item['status'] == 'imported' else REVIEW / 'candidates')
                               / f"{item['id']}.wav")
                sf.write(destination, clip, sr, subtype='PCM_16')
                item.update(file=destination.relative_to(ROOT).as_posix(), sha256=sha(destination),
                            duration=round(len(clip) / sr, 4), peak=round(float(np.abs(clip).max()), 5))
                if item['status'] == 'imported':
                    assert item.get('evidence'), 'An active clip needs explicit mapping evidence'
                    clips[text] = item['file']
            else:
                assert item['status'] != 'imported'
        items.append(item)
    payload = {'sources': sheet['sources'], 'items': items,
               'processing': 'Source-audited cuts; original pitch, speed and level; 4 ms edge fades.',
               'qualification': 'AI-generated speech. Mapping evidence is not pronunciation certification.',
               'counts': {state: sum(i['status'] == state for i in items)
                          for state in ['imported', 'needs-review', 'missing']}}
    (REVIEW / 'manifest.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n')
    script = ('// Locally bundled AI speech from owner-supplied OpenAI.fm Marin recordings.\n'
              '// Exact NFC keys preserve vowel/length distinctions. Uncertain cuts are excluded.\n'
              '(function (ns) {\n  ns.LETTER_VOICE_CLIPS = Object.freeze(')
    script += json.dumps(clips, ensure_ascii=False, indent=2)
    script += ');\n})(window.MiftahGame || (window.MiftahGame = {}));\n'
    runtime.write_text(script)
    # Preserve all existing shell entries; replace only this import's own section.
    sw = ROOT / 'sw.js'
    content = sw.read_text()
    begin, end = '  // BEGIN MARIN CURRICULUM AUDIO', '  // END MARIN CURRICULUM AUDIO'
    block = '\n'.join([begin] + [f'  "{i["file"]}",' for i in items if i['status'] == 'imported'] + [end])
    if begin in content:
        content = re.sub(re.escape(begin) + r'.*?' + re.escape(end), lambda _: block, content, flags=re.S)
    else:
        content = content.replace('const SHELL = [', 'const SHELL = [\n' + block)
    sw.write_text(content)
    print(json.dumps(payload['counts']))


if __name__ == '__main__':
    main()
