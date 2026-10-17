import base64
import io
import random
import re

import runpod
import soundfile as sf
from yue2 import YuE2Pipeline

# Load once per worker (cold start).
print("Loading YuE2-3B model...")
pipe = YuE2Pipeline.from_pretrained("m-a-p/YuE2-3B", device="cuda")

SECTION_NAMES = {
    "intro": "Intro", "verse": "Verse", "pre-chorus": "Pre-Chorus", "prechorus": "Pre-Chorus",
    "chorus": "Chorus", "bridge": "Bridge", "outro": "Outro", "instrumental": "Instrumental",
    "interlude": "Interlude", "solo": "Solo", "hook": "Hook",
}
INSTRUMENTAL_LYRICS = "[Intro]\n\n[Instrumental]\n\n[Solo]\n\n[Instrumental]\n\n[Outro]"


def _norm_lyrics(text: str) -> str:
    def fix(m):
        raw = m.group(1).strip()
        key = raw.lower()
        return f"[{SECTION_NAMES.get(key, raw[:1].upper() + raw[1:])}]"
    return re.sub(r"\[([^\]\n]{1,40})\]", fix, text or "").strip()


def handler(job):
    inp = job.get("input", {}) or {}
    # Site historically sent the style as `prompt`; accept both.
    style = str(inp.get("style") or inp.get("prompt") or inp.get("tags") or "pop").strip()
    style = re.sub(r",?\s*48\s?kHz( stereo)?", "", style, flags=re.I).strip(" ,")[:600] or "pop"
    mode = str(inp.get("mode") or "full").lower()
    lyrics = _norm_lyrics(str(inp.get("lyrics") or ""))

    instrumental = mode == "instrumental" or not re.search(r"[^\s\[\]]", re.sub(r"\[[^\]]*\]", "", lyrics))
    if instrumental:
        lyrics = INSTRUMENTAL_LYRICS
        if not re.search(r"instrumental|no vocals", style, re.I):
            style = f"instrumental, no vocals, {style}"

    seed = inp.get("seed")
    if not isinstance(seed, int) or seed < 0:
        seed = random.randint(1, 2**31 - 1)

    kwargs = {"cot": "full", "seed": seed}
    cfg = inp.get("cfg_scale")
    if isinstance(cfg, (int, float)) and 0 <= cfg <= 20:
        kwargs["cfg_scale"] = float(cfg)
    # External ABC is only used when explicitly requested in native YuE2 format.
    if inp.get("use_abc") and isinstance(inp.get("abc"), str) and inp["abc"].strip():
        kwargs["abc"] = inp["abc"]

    song = pipe(style=style, lyrics=lyrics, **kwargs)

    buffer = io.BytesIO()
    sf.write(buffer, song.audio, song.sample_rate, format="FLAC")
    audio_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    try:
        abc = song.abc
    except Exception:
        abc = None
    return {
        "status": "success",
        "audio_base64": audio_b64,
        "format": "flac",
        "abc": abc,
        "seed": seed,
        "style": style,
        "instrumental": instrumental,
        "duration": round(len(song.audio) / song.sample_rate, 2),
        "truncated": getattr(song, "truncated", None),
        "worker_version": "v1.3",
    }


if __name__ == "__main__":
    runpod.serverless.start({"handler": handler})
