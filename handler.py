import runpod
import torch
import soundfile as sf
import base64
import io
from yue2 import YuE2Pipeline

# 冷启动时加载模型
print("Loading YuE2-3B model...")
pipe = YuE2Pipeline.from_pretrained("m-a-p/YuE2-3B", device="cuda", torch_dtype=torch.bfloat16)

def handler(job):
    job_input = job.get('input', {})
    
    style = job_input.get('style', 'pop, energetic')
    lyrics = job_input.get('lyrics', '[Verse]\nHello world')
    
    # 运行推理
    song = pipe(style=style, lyrics=lyrics)
    
    # 将生成的音频转为 Base64 字符串返回
    buffer = io.BytesIO()
    sf.write(buffer, song.audio, song.sample_rate, format='FLAC')
    buffer.seek(0)
    audio_b64 = base64.b64encode(buffer.read()).decode('utf-8')
    
    return {
        "status": "success",
        "audio_base64": audio_b64,
        "format": "flac"
    }

if __name__ == "__main__":
    runpod.serverless.start({"handler": handler})
