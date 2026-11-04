# /// script
# requires-python = ">=3.11,<3.12"
# dependencies = [
#     "chatterbox-tts",
#     "faster-whisper",
#     # The watermarker of `resemble-perth` still needs `pkg_resources`.
#     "setuptools<81",
# ]
#
# [tool.uv.sources]
# # PyPI (0.1.7) doesn't know Multilingual V3 yet, the last commit of the
# # (retired) repository does.
# chatterbox-tts = { git = "https://github.com/resemble-ai/chatterbox.git", rev = "ab55923c27757c90cfcc407baa57dc25a7d25217" }
# ///
"""
Text-to-speech with Chatterbox Multilingual V3, open source and local.

Called by `tts.js`, which passes a JSON job on stdin:

    {
        "language": "nl",
        "voice": "/path/to/reference.wav" or null,
        "items": [ { "text": "...", "file": "/path/to/step.wav" } ]
    }

The model loads once for all items. `uv run` installs the dependencies in
its own cache, the first run also downloads the model (a few GB).

Chatterbox sometimes mumbles or adds babble at the end. So Whisper
transcribes each take, and when the transcript differs too much from the
text, it tries again with another seed and keeps the best take.

See https://github.com/resemble-ai/chatterbox
"""

import difflib
import json
import os
import re
import sys

# Run operations that MPS doesn't support on the CPU.
os.environ.setdefault("PYTORCH_ENABLE_MPS_FALLBACK", "1")

import torch
import torchaudio

from chatterbox.mtl_tts import ChatterboxMultilingualTTS
from faster_whisper import WhisperModel

# Similarity of the transcript to the text that is good enough.
GOOD_ENOUGH = 0.9

MAX_TAKES = 4


def words(text):
    return re.sub(r"[^\w\s]", " ", text.lower()).split()


def similarity(text, transcript):
    return difflib.SequenceMatcher(None, words(text), words(transcript)).ratio()


def device():
    if torch.cuda.is_available():
        return "cuda"

    if torch.backends.mps.is_available():
        return "mps"

    return "cpu"


def main():
    job = json.load(sys.stdin)

    target = device()

    # The checkpoints are saved on CUDA, load them on the available device.
    original_load = torch.load

    def load(*args, **kwargs):
        kwargs.setdefault("map_location", torch.device(target))

        return original_load(*args, **kwargs)

    torch.load = load

    model = ChatterboxMultilingualTTS.from_pretrained(device=target, t3_model="v3")

    options = {
        "language_id": job["language"],
        "exaggeration": job.get("exaggeration", 0.5),
        "cfg_weight": job.get("cfg_weight", 0.5),
    }

    if job.get("voice"):
        options["audio_prompt_path"] = job["voice"]

    whisper = WhisperModel("small", device="cpu", compute_type="int8")

    for item in job["items"]:
        best = None

        for take in range(1, MAX_TAKES + 1):
            # The same text gives the same audio.
            torch.manual_seed(job.get("seed", 1) + take - 1)

            wav = model.generate(item["text"], **options)

            wav = wav.cpu()

            torchaudio.save(item["file"], wav, model.sr)

            segments, _ = whisper.transcribe(item["file"], language=job["language"])

            transcript = " ".join(segment.text.strip() for segment in segments)

            score = similarity(item["text"], transcript)

            print(
                f"chatterbox: {item['file']} take {take}: {score:.2f} {transcript}",
                file=sys.stderr,
                flush=True,
            )

            if best is None or score > best[0]:
                best = (score, wav)

            if score >= GOOD_ENOUGH:
                break

        torchaudio.save(item["file"], best[1], model.sr)


if __name__ == "__main__":
    main()
