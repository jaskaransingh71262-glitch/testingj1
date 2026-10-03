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

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
if DEVICE == "cuda":
    major, _ = torch.cuda.get_device_capability()
    DTYPE = torch.bfloat16 if major >= 8 else torch.float16
else:
    DTYPE = torch.float32

print(f"Backend: {BACKEND_URL}")
print(f"Model: {MODEL}")
print(f"Device: {DEVICE}")
if DEVICE == "cuda":
    print(f"GPU: {torch.cuda.get_device_name(0)}")
    print(f"VRAM: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")

print("Loading FLUX Kontext...")
pipe = FluxKontextPipeline.from_pretrained(
    MODEL,
    torch_dtype=DTYPE,
    token=HF_TOKEN,
)

if DEVICE == "cuda":
    # Keeps the model usable on smaller free GPUs by moving parts between
    # GPU and CPU instead of requiring the whole model in VRAM.
    pipe.enable_model_cpu_offload()
else:
    pipe.to(DEVICE)

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
        print("Could not report failure:", exc)

print("Worker is online and polling for jobs...")

while True:
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
        print(f"Processing job {job_id}")

        image_response = requests.get(
            BACKEND_URL + job["imageUrl"],
            timeout=120,
        )
        image_response.raise_for_status()
        source = Image.open(io.BytesIO(image_response.content)).convert("RGB")

        result = pipe(
            image=source,
            prompt=job["prompt"],
            num_inference_steps=28,
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
        print(f"Completed job {job_id}")

    except KeyboardInterrupt:
        print("Worker stopped.")
        break
    except Exception as exc:
        print("Worker error:", repr(exc))
        if "job_id" in locals():
            fail_job(job_id, exc)
            del job_id
        time.sleep(5)
