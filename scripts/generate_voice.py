"""Pre-render human-like English voice clips (Piper neural TTS) for every learnable word and phrase.

Setup:  pip install piper-tts lameenc
        curl -LO https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/alba/medium/en_GB-alba-medium.onnx{,.json}
Run:    node --import ./tests/register.mjs scripts/voice-texts.mjs > texts.json
        python scripts/generate_voice.py texts.json en_GB-alba-medium.onnx
Output: public/assets/voice/<hash>.mp3 and public/assets/voice/manifest.json (text -> file name).
"""
import hashlib, json, sys
from pathlib import Path
import lameenc
from piper import PiperVoice

texts = json.load(open(sys.argv[1]))
voice = PiperVoice.load(sys.argv[2])
out = Path(__file__).resolve().parent.parent / 'public/assets/voice'
out.mkdir(parents=True, exist_ok=True)
manifest_path = out / 'manifest.json'
manifest = json.loads(manifest_path.read_text(encoding='utf-8')) if manifest_path.exists() else {}
for text in texts:
    name = manifest.get(text) or hashlib.sha1(text.encode()).hexdigest()[:12] + '.mp3'
    manifest[text] = name
    if (out / name).exists():
        continue
    pcm = b''.join(chunk.audio_int16_bytes for chunk in voice.synthesize(text))
    enc = lameenc.Encoder()
    enc.set_bit_rate(40); enc.set_in_sample_rate(voice.config.sample_rate); enc.set_channels(1); enc.set_quality(2)
    (out / name).write_bytes(enc.encode(pcm) + enc.flush())
(out / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=0))
print(len(manifest), 'clips')
