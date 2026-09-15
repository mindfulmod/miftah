#!/usr/bin/env python3
"""Generate Arabic audition files once, using local Chatterbox Multilingual V3.

The game never imports this script. Weights download on the first run; generation
runs on this computer. No voice server or paid inference API is used.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import time

ROOT = Path(__file__).resolve().parents[1]
RUNTIME = ROOT.parent / "letter-garden-voice-runtime"
OUTPUT = ROOT / "docs/letter-garden/reviews/audio-letters"
os.environ.setdefault("HF_HOME", str(RUNTIME / "huggingface"))
os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")
os.environ.setdefault("PKUSEG_HOME", str(RUNTIME / "pkuseg"))
os.environ.setdefault("PYTORCH_ENABLE_MPS_FALLBACK", "1")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=28)
    parser.add_argument("--device", choices=["auto", "cpu", "mps"], default="auto")
    args = parser.parse_args()

    import numpy as np
    import soundfile as sf
    import torch
    from scipy.signal import butter, sosfilt
    from chatterbox.mtl_tts import ChatterboxMultilingualTTS

    manifest_path = OUTPUT / "batch.json"
    manifest = json.loads(manifest_path.read_text())
    assert len(manifest["letters"]) == 28
    assert len({item["letter"] for item in manifest["letters"]}) == 28
    device = args.device if args.device != "auto" else ("mps" if torch.backends.mps.is_available() else "cpu")
    torch.set_num_threads(4)
    print(f"Loading Chatterbox Multilingual V3 on {device}…", flush=True)
    model = ChatterboxMultilingualTTS.from_pretrained(device=device, t3_model="v3")
    settings = {"language_id": "ar", "exaggeration": 0.25, "cfg_weight": 0.0,
                "temperature": 0.6, "repetition_penalty": 1.3, "min_p": 0.05, "top_p": 1.0}
    manifest.update({"status": "generating", "model": "ResembleAI/chatterbox — Multilingual V3",
                     "voice": "Built-in model voice", "engine": "local Chatterbox 0.1.7",
                     "engineRevision": "5de7a54aa4e5e2baadb0182dde554908b48b85c2",
                     "license": "MIT", "settings": settings, "device": device,
                     "generated": manifest.get("generated", []), "processing": "Silence padding, gentle 7 kHz low-pass, capped level adjustment, 5 ms fades; AI watermark applied after processing"})
    manifest.pop("instructions", None)
    manifest.setdefault("clips", {})
    def save():
        manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    save()
    raw_dir = RUNTIME / "raw-audition"
    raw_dir.mkdir(parents=True, exist_ok=True)

    for item in manifest["letters"][:args.limit]:
        destination = OUTPUT / item["file"]
        if item["file"] in manifest["generated"] and destination.exists():
            continue
        seed = 260915 + item["index"]
        torch.manual_seed(seed)
        np.random.seed(seed)
        started = time.monotonic()
        print(f"Generating {item['index']:02d}/28: {item['input']}", flush=True)
        samples = model.generate(item["input"], **settings).squeeze().cpu().numpy()
        sf.write(raw_dir / item["file"], samples, model.sr, subtype="PCM_16")
        if not np.isfinite(samples).all() or len(samples) < model.sr * 0.2:
            raise RuntimeError(f"Invalid/empty speech for {item['name']}")
        # Keep breath and consonant tails; trim only silence outside padded edges.
        active = np.flatnonzero(np.abs(samples) > max(0.003, float(np.max(np.abs(samples))) * 0.012))
        if not len(active):
            raise RuntimeError(f"Silent speech for {item['name']}")
        start = max(0, int(active[0]) - int(model.sr * 0.10))
        end = min(len(samples), int(active[-1]) + int(model.sr * 0.18))
        samples = samples[start:end]
        samples = sosfilt(butter(2, 7000, fs=model.sr, output="sos"), samples)
        peak = float(np.max(np.abs(samples)))
        rms = float(np.sqrt(np.mean(samples ** 2)))
        gain = min(0.65 / max(peak, 1e-6), 0.095 / max(rms, 1e-6), 2.0)
        samples *= gain
        fade = min(int(model.sr * 0.005), len(samples) // 2)
        samples[:fade] *= np.linspace(0, 1, fade)
        samples[-fade:] *= np.linspace(1, 0, fade)
        # Retain the engine's AI-audio provenance after level/EQ processing.
        samples = model.watermarker.apply_watermark(samples, sample_rate=model.sr)
        sf.write(destination, samples, model.sr, subtype="PCM_16")
        manifest["generated"].append(item["file"])
        manifest["clips"][item["file"]] = {
            "duration": round(len(samples) / model.sr, 3), "sampleRate": model.sr,
            "peak": round(float(np.max(np.abs(samples))), 4), "seed": seed,
            "sha256": hashlib.sha256(destination.read_bytes()).hexdigest(),
            "generationSeconds": round(time.monotonic() - started, 2),
        }
        save()
        print(f"Saved {item['file']}: {len(samples)/model.sr:.2f}s in {time.monotonic()-started:.1f}s", flush=True)

    if len(manifest["generated"]) == 28:
        combined = []
        for item in manifest["letters"]:
            samples, sr = sf.read(OUTPUT / item["file"])
            assert sr == model.sr
            combined.extend([samples, np.zeros(int(sr * 0.8))])
        sf.write(OUTPUT / "all-28-arabic-letter-names.wav", np.concatenate(combined), model.sr, subtype="PCM_16")
        manifest["status"] = "generated-awaiting-listening-review"
    else:
        manifest["status"] = "partial-audition"
    save()
    print(f"Finished: {len(manifest['generated'])}/28 clips. No voice process remains after this command exits.", flush=True)


if __name__ == "__main__":
    main()
