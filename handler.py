import base64
import io
import os
import random
import re
import urllib.request

import runpod
import soundfile as sf

from yue2_instrumental_lora import (
    InstrumentalPipeline,
    MODEL_REVISION,
    VAE_REVISION,
)

# ---------------------------------------------------------------------------
# Instrumental KTO LoRA (stevensu/YuE2-3B-instrumental-kto-lora).
# The adapter is baked into the image at build time (see Dockerfile) and can be
# overridden at runtime via env for a Network Volume layout.
# ---------------------------------------------------------------------------
ADAPTER_PATH = os.environ.get(
    "YUE2_INSTRUMENTAL_LORA_PATH",
    "/workspace/models/loras/instrumental-kto/adapter.safetensors",
)

# Load once per worker (cold start). The model/VAE revisions are pinned to the
# exact upstream commits the KTO LoRA was trained and evaluated against, so the
# deltas stay aligned even if m-a-p/YuE2-3B moves to a newer checkpoint later.
print("Loading YuE2-3B model...", flush=True)
pipe = InstrumentalPipeline.from_pretrained(
    "m-a-p/YuE2-3B",
    device="cuda",
    revision=MODEL_REVISION,
    vae_revision=VAE_REVISION,
)

# Pre-compute the LoRA deltas once. `use_adapter()` reads the 70 MB safetensors
# file and computes B @ A on the CPU; afterwards each request only flips
# `pipe._deltas` between the loaded deltas (on) and None (off), mirroring
# `pipe.use_adapter(path)` / `pipe.use_adapter(None)`.
_adapter_deltas = None
_adapter_meta = None
if os.path.exists(ADAPTER_PATH):
    try:
        _adapter_meta = pipe.use_adapter(ADAPTER_PATH)
        _adapter_deltas = pipe._deltas
        print(f"Instrumental KTO LoRA ready: {_adapter_meta}", flush=True)
    except Exception as exc:  # noqa: BLE001 - keep serving base-model jobs
        print(f"WARNING: instrumental LoRA failed to load ({exc}); serving base model only", flush=True)
else:
    print(f"WARNING: instrumental LoRA not found at {ADAPTER_PATH}; serving base model only", flush=True)


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

    # Instrumental / YouTube BGM / game-music modes, or lyrics that contain only
    # section tags (no sung text), become vocal-free arrangements.
    instrumental = mode in {"instrumental", "youtube", "bgm"} or not re.search(
        r"[^\s\[\]]", re.sub(r"\[[^\]]*\]", "", lyrics)
    )
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

    # Adapter ON -> semantic tokens steered away from vocals (KTO).
    # Adapter OFF -> bit-identical to the official YuE2 pipeline.
    lora_field = str(inp.get("lora") or "").lower()
    use_lora = _adapter_deltas is not None and (
        instrumental
        or inp.get("enable_instrumental_lora") is True
        or "instrumental" in lora_field
        or "kto" in lora_field
    )
    pipe._deltas = _adapter_deltas if use_lora else None

    song = pipe(style=style, lyrics=lyrics, **kwargs)

    buffer = io.BytesIO()
    sf.write(buffer, song.audio, song.sample_rate, format="FLAC")
    flac = buffer.getvalue()

    # RunPod /run results are capped at ~10 MB. When the caller provides a signed
    # upload URL, PUT the FLAC there and return a small result instead.
    uploaded = False
    upload_url = inp.get("upload_url")
    if isinstance(upload_url, str) and upload_url.startswith("https://"):
        try:
            req = urllib.request.Request(upload_url, data=flac, method="PUT",
                                         headers={"Content-Type": "audio/flac", "User-Agent": "yue2-worker/1.5"})
            with urllib.request.urlopen(req, timeout=120) as resp:
                uploaded = 200 <= resp.status < 300
        except Exception as e:  # fall back to inline base64
            print(f"upload failed: {e}")
    audio_b64 = None if uploaded else base64.b64encode(flac).decode("utf-8")
    try:
        abc = song.abc
    except Exception:
        abc = None
    return {
        "status": "success",
        "audio_base64": audio_b64,
        "audio_uploaded": uploaded,
        "upload_key": inp.get("upload_key") if uploaded else None,
        "bytes": len(flac),
        "format": "flac",
        "abc": abc,
        "seed": seed,
        "style": style,
        "instrumental": instrumental,
        "instrumental_lora": use_lora,
        "duration": round(len(song.audio) / song.sample_rate, 2),
        "truncated": getattr(song, "truncated", None),
        "worker_version": "v1.5",
    }


if __name__ == "__main__":
    runpod.serverless.start({"handler": handler})
