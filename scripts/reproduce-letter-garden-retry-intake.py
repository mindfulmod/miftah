#!/usr/bin/env python3
"""Reproduce the unassigned batch-4 cuts without changing any curriculum mapping."""
import hashlib
import io
import json
from pathlib import Path

import numpy as np
import soundfile as sf

root = Path(__file__).resolve().parents[1]
base = root / 'docs/letter-garden/reviews/audio-confirmation/retry-recording'
manifest = json.loads((base / 'manifest.json').read_text())
source = root / manifest['source']['repositoryFile']
sha = lambda data: hashlib.sha256(data).hexdigest()
assert sha(source.read_bytes()) == manifest['source']['sha256']
data, rate = sf.read(source)
assert data.ndim == 1 and rate == 24000 and np.isfinite(data).all()
for item in manifest['items']:
    clip = data[round(item['start'] * rate):round(item['end'] * rate)].copy()
    fade = round(rate * .004)
    clip[:fade] *= np.linspace(0, 1, fade)
    clip[-fade:] *= np.linspace(1, 0, fade)
    encoded = io.BytesIO()
    sf.write(encoded, clip, rate, format='WAV', subtype='PCM_16')
    wav = encoded.getvalue()
    assert sha(wav) == item['sha256'], f"Different cut: {item['id']}"
    destination = base / item['file']
    assert not destination.exists() or destination.read_bytes() == wav
    destination.write_bytes(wav)
print(f"Reproduced {len(manifest['items'])} exact unassigned cuts; runtime unchanged.")
