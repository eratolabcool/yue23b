# YuE2 RunPod serverless worker (queue-based endpoint).
#
# Base image: RunPod runtime on CUDA 12.8.1 + cuDNN 9.8 + Python 3.9-3.13.
# CUDA 12.8 matches the CUDA runtime bundled with the pinned torch==2.10.0 wheel
# (nvidia-cuda-runtime-cu12==12.8.90).
FROM runpod/base:1.3.1-cuda1281-ubuntu2204

WORKDIR /app

# Copy the repo. .dockerignore keeps .git, caches and model weights out of the image.
COPY . .

# Install the yue2 package (pulls torch==2.10.0 CUDA build, transformers, soundfile,
# etc. from pyproject.toml) plus the RunPod SDK, which provides
# runpod.serverless.start({"handler": handler}).
RUN python3.11 -m pip install --no-cache-dir . runpod hf_transfer

# RunPod serverless runs this command; handler.py loads the YuE2 model from
# Hugging Face at first start and calls runpod.serverless.start().
CMD ["python3.11", "-u", "handler.py"]
