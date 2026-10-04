"""Generate recommendation clips locally with Piper, preserving other voice clips.
Setup: pip install piper-tts lameenc
Run: node --import ./tests/register.mjs scripts/pairing-voice-texts.mjs texts.json
     python scripts/generate_pairing_voice.py texts.json en_GB-alba-medium.onnx
"""
import hashlib
import json
import sys
from pathlib import Path
import lameenc
from piper import PiperVoice, SynthesisConfig
out = Path(__file__).resolve().parent.parent / 'public/assets/voice'
texts = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
voice = PiperVoice.load(sys.argv[2])
manifest = json.loads((out / 'manifest.json').read_text(encoding='utf-8'))
config = SynthesisConfig(length_scale=1.05, noise_scale=.5, noise_w_scale=.6)
for index, text in enumerate(texts):
    # Sentence case avoids emphatic title/acronym readings; display labels stay unchanged.
    spoken = text[0].upper() + text[1:].lower() if len(text.split()) < 8 and text.istitle() else text
    name = 'pairing-piper-v2-' + hashlib.sha1(text.encode()).hexdigest()[:12] + '.mp3'
    if not (out / name).exists():
        pcm = b''.join(chunk.audio_int16_bytes for chunk in voice.synthesize(spoken, syn_config=config))
        enc = lameenc.Encoder()
        enc.set_bit_rate(96)
        enc.set_in_sample_rate(voice.config.sample_rate)
        enc.set_channels(1)
        enc.set_quality(2)
        (out / name).write_bytes(enc.encode(pcm) + enc.flush())
    manifest[text] = name
    if (index + 1) % 25 == 0:
        print(f'{index + 1}/{len(texts)} clips', flush=True)
        (out / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=0), encoding='utf-8')
(out / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=0), encoding='utf-8')
print(f'{len(texts)} recommendation clips ready', flush=True)
