import os
import time
import base64
import io

import requests
import torch
from PIL import Image
from diffusers import FluxKontextPipeline

BACKEND_URL = os.environ["BACKEND_URL"].rstrip("/")
WORKER_SECRET = os.environ.get("WORKER_SECRET", "")
HF_TOKEN = os.environ["HF_TOKEN"]
MODEL = os.environ.get("FLUX_MODEL", "black-forest-labs/FLUX.1-Kontext-dev")

print("Backend:", BACKEND_URL)
print("Model:", MODEL)

if not torch.cuda.is_available():
    raise RuntimeError("Kaggle GPU is not enabled. Set Notebook accelerator to GPU.")

DEVICE = "cuda"
major, minor = torch.cuda.get_device_capability(0)
GPU_NAME = torch.cuda.get_device_name(0)
GPU_MEMORY_GB = torch.cuda.get_device_properties(0).total_memory / 1024**3

# T4 is compute capability 7.5, so use fp16.
# Newer GPUs can use bf16.
DTYPE = torch.bfloat16 if major >= 8 else torch.float16

print(f"GPU: {GPU_NAME}")
print(f"VRAM: {GPU_MEMORY_GB:.1f} GB")
print(f"CUDA capability: {major}.{minor}")
print(f"Dtype: {DTYPE}")

print("Loading FLUX Kontext...")
pipe = FluxKontextPipeline.from_pretrained(
    MODEL,
    torch_dtype=DTYPE,
    token=HF_TOKEN,
)

# Important for 16 GB GPUs: don't require the whole model to stay in VRAM.
pipe.enable_model_cpu_offload()

def auth_headers():
    return {"x-worker-secret": WORKER_SECRET} if WORKER_SECRET else {}

def fail_job(job_id, message):
    try:
        requests.post(
            f"{BACKEND_URL}/api/worker/jobs/{job_id}/fail",
            json={"error": str(message)[:4000]},
            headers=auth_headers(),
            timeout=60,
        )
    except Exception as exc:
        print("Could not report failure:", repr(exc))

print("Worker is online and polling Render...")

while True:
    job_id = None

    try:
        response = requests.get(
            f"{BACKEND_URL}/api/worker/jobs/next",
            headers=auth_headers(),
            timeout=60,
        )

        if response.status_code == 204:
            time.sleep(3)
            continue

        response.raise_for_status()
        job = response.json()
        job_id = job["jobId"]

        print(f"Processing job: {job_id}")

        image_response = requests.get(
            BACKEND_URL + job["imageUrl"],
            timeout=120,
        )
        image_response.raise_for_status()

        source = Image.open(
            io.BytesIO(image_response.content)
        ).convert("RGB")

        result = pipe(
            image=source,
            prompt=job["prompt"],
            num_inference_steps=24,
            guidance_scale=3.5,
        ).images[0]

        buffer = io.BytesIO()
        result.save(buffer, format="PNG")

        payload = {
            "imageBase64": base64.b64encode(buffer.getvalue()).decode("ascii"),
            "mimeType": "image/png",
        }

        completed = requests.post(
            f"{BACKEND_URL}/api/worker/jobs/{job_id}/complete",
            json=payload,
            headers=auth_headers(),
            timeout=180,
        )
        completed.raise_for_status()

        print(f"Completed job: {job_id}")

        # Release temporary GPU allocations between jobs.
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

    except KeyboardInterrupt:
        print("Worker stopped.")
        break

    except Exception as exc:
        print("Worker error:", repr(exc))

        if job_id is not None:
            fail_job(job_id, exc)

        if torch.cuda.is_available():
            torch.cuda.empty_cache()

        time.sleep(5)
