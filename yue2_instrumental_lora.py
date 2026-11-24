"""YuE2 instrumental KTO LoRA: load the adapter and generate vocal-free BGM with the official YuE2 pipeline.

Standalone (needs only the official `yue2` package and, for the CLI, the YuE repository's instrumental skill):

    git clone https://github.com/multimodal-art-projection/YuE && git -C YuE checkout 1647252d68b70cbead046ffd3f7caf036dde47ee
    pip install ./YuE                                   # the official yue2 package (tested at this commit)
    python yue2_instrumental_lora.py --yue-repo /path/to/YuE \
        --style "cinematic orchestra, heroic brass, driving strings, 120 BPM, D minor" --out song.flac

How it works: the adapter is a rank-16 LoRA on YuE2's AR experts (q/k/v/o, gate/up/down of all 28 layers). Its
low-rank deltas are added to the AR weights ONLY while the semantic tokens are generated; score planning and the
NAR / VAE stages (the NAR prefill reads the AR modules) run on the untouched base weights, exactly as the adapter
was trained and evaluated. No wrapper modules are inserted, so YuE2's CUDA-graph AR keeps working, and with the
adapter off (or never loaded) the pipeline is bit-identical to the official one.

Library use:

    from yue2_instrumental_lora import InstrumentalPipeline
    pipe = InstrumentalPipeline.from_pretrained("m-a-p/YuE2-3B", revision=MODEL_REVISION, vae_revision=VAE_REVISION)
    pipe.use_adapter("adapter.safetensors")      # pipe.use_adapter(None) switches it off again
    song = pipe(style=..., lyrics=..., abc=..., cot="full", seed=...)   # same call as YuE2Pipeline

Weights: CC BY-NC 4.0 (adapted from YuE2-3B, CC BY-NC 4.0). This script: Apache 2.0.
"""
from __future__ import annotations

import argparse
import contextlib
import json
import sys
from pathlib import Path

import torch
import torch.nn as nn
from safetensors import safe_open

from yue2.pipeline import YuE2Pipeline

# The adapter was trained and evaluated on these exact upstream weights.
MODEL_REVISION = "8f24312f187763b9854adeec87e437e2b03bbff1"
VAE_REVISION = "152733a19ad43aa67e367f9b5503ef8075bb5126"
TARGETS = ("self_attn.q_proj", "self_attn.k_proj", "self_attn.v_proj", "self_attn.o_proj",
           "mlp.gate_proj", "mlp.up_proj", "mlp.down_proj")
META_KEY = "yue2_lora_meta"
# Section tags given to the score planner; with an empty lyric every vocal-line note is moved to the
# instrument track afterwards (the official instrumental flow). This is the plan used in all evaluations.
PLAN_LYRICS = "[Intro]\n\n[Verse]\n\n[Chorus]\n\n[Verse]\n\n[Chorus]\n\n[Bridge]\n\n[Chorus]\n\n[Outro]\n"
NO_VOICE = ("no vocals", "no singing", "no choir", "no spoken words")


def read_adapter(path):
    """Return (tensors, meta): tensors `model.layers.<i>.<target>.lora_a/lora_b` (FP32), meta = rank / alpha / training."""
    with safe_open(str(path), framework="pt", device="cpu") as f:
        meta = json.loads((f.metadata() or {}).get(META_KEY, "{}"))
        return {k: f.get_tensor(k) for k in f.keys()}, meta


def load_deltas(model, path):
    """[(linear, delta)] with delta = scale * B @ A for every target Linear; the model itself is not changed."""
    state, meta = read_adapter(path)
    scale = meta.get("alpha", 32.0) / meta.get("rank", 16)
    deltas = []
    for i, layer in enumerate(model.model.layers):
        for target in TARGETS:
            parent, child = target.split(".")
            linear = getattr(getattr(layer, parent), child)
            if type(linear) is not nn.Linear:
                raise TypeError(f"expected a plain nn.Linear at layer {i} {target} (fp8 / custom backends are not supported)")
            key = f"model.layers.{i}.{target}"
            a, b = state[f"{key}.lora_a"].float(), state[f"{key}.lora_b"].float()
            deltas.append((linear, (b @ a * scale).to(linear.weight.device)))
    if len(deltas) * 2 != len(state):
        raise KeyError(f"adapter has {len(state)} tensors, model consumed {2 * len(deltas)}")
    return deltas, meta


@contextlib.contextmanager
def applied(deltas):
    """Add the deltas to the base weights (FP32 add, cast back to BF16); restore the exact original tensors on exit."""
    originals = []
    with torch.no_grad():
        for linear, delta in deltas:
            originals.append(linear.weight.data)
            linear.weight.data = (linear.weight.data.float() + delta).to(linear.weight.dtype)
    try:
        yield
    finally:
        for (linear, _), original in zip(deltas, originals):
            linear.weight.data = original


class InstrumentalPipeline(YuE2Pipeline):
    """YuE2Pipeline whose semantic stage can run with the instrumental adapter (planning / NAR / VAE stay base)."""

    _deltas = None

    def use_adapter(self, path):
        if path is None:
            self._deltas = None
            return None
        if self.backend == "vllm" or self.quantization != "none":
            raise ValueError("the adapter needs backend='torch' (or 'torch-eager') and quantization='none'")
        self._deltas, meta = load_deltas(self._load_model(), path)
        return meta

    def generate_semantic(self, plan, **kwargs):
        if self._deltas is None:
            return super().generate_semantic(plan, **kwargs)
        with applied(self._deltas):
            return super().generate_semantic(plan, **kwargs)


def instrumental_style(style):
    style = style.strip().rstrip(".,")
    if not style.lower().startswith("instrumental"):
        style = "Instrumental, " + style
    for condition in NO_VOICE:
        if condition not in style.lower():
            style += ", " + condition
    return style + "."


def main():
    p = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    p.add_argument("--style", required=True, help="instrumentation / mood / tempo / key; 'no vocals' etc. are added")
    p.add_argument("--out", type=Path, required=True, help="output .flac (48 kHz stereo); the score is saved next to it")
    p.add_argument("--adapter", default="adapter.safetensors", help="adapter file; 'none' = official model (for A/B)")
    p.add_argument("--yue-repo", type=Path, required=True,
                   help="YuE repository checkout (uses skills/yue2-music/instrumental for the Vocal -> Ins score conversion)")
    p.add_argument("--seed", type=int, default=20261601)
    args = p.parse_args()
    sys.path.insert(0, str(args.yue_repo / "skills/yue2-music/instrumental/scripts"))
    from instrumental import lyric_tags, validate_request
    from instrumentalize import convert_score

    pipe = InstrumentalPipeline.from_pretrained("m-a-p/YuE2-3B", revision=MODEL_REVISION, vae_revision=VAE_REVISION)
    if args.adapter != "none":
        print("adapter:", json.dumps(pipe.use_adapter(args.adapter)), flush=True)
    style = instrumental_style(args.style)
    with pipe:
        # 1. the planner writes a score from section tags (base weights); 2. vocal-line notes move to the
        # instrument track; 3. that score is rendered - semantic tokens with the adapter, NAR + VAE on base weights
        plan = pipe.plan(style=style, lyrics=PLAN_LYRICS, cot="full", seed=args.seed)
        if plan.truncated or not plan.abc:
            raise SystemExit("the score planner hit its length limit; try another --seed")
        converted, _ = convert_score(plan.abc, overlap="vocal", keep_chords=True)
        request = {"style": style, "lyrics": lyric_tags(converted), "abc": converted}
        # the skill validates the request; cot must match the score (full if the vocal line keeps chords)
        for cot in ("full", "melody"):
            try:
                validate_request({"id": args.out.stem, "seed": args.seed, **request, "cot": cot})
                request["cot"] = cot
                break
            except ValueError as error:
                if cot == "melody" or "Use cot=" not in str(error):
                    raise
        song = pipe(id=args.out.stem, seed=args.seed + 1, **request)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    song.save(args.out)
    args.out.with_suffix(".abc").write_text(converted, encoding="utf-8")
    print(json.dumps({"out": str(args.out), "seconds": round(len(song.audio) / song.sample_rate, 1),
                      "truncated": song.truncated, "style": style}), flush=True)


if __name__ == "__main__":
    main()
