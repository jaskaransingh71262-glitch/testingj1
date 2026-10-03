import os, time, base64, io, requests, torch
from PIL import Image
from diffusers import FluxKontextPipeline

BACKEND=os.environ["BACKEND_URL"].rstrip("/")
SECRET=os.environ.get("WORKER_SECRET","")
MODEL=os.environ.get("FLUX_MODEL","black-forest-labs/FLUX.1-Kontext-dev")
DEVICE="cuda" if torch.cuda.is_available() else "cpu"
DTYPE=torch.bfloat16 if DEVICE=="cuda" else torch.float32

print("Loading",MODEL,"on",DEVICE)
pipe=FluxKontextPipeline.from_pretrained(MODEL, torch_dtype=DTYPE)
pipe.to(DEVICE)

def headers():
    return {"x-worker-secret":SECRET} if SECRET else {}

while True:
    r=requests.get(BACKEND+"/api/worker/jobs/next",headers=headers(),timeout=60)
    if r.status_code==204:
        time.sleep(2); continue
    r.raise_for_status()
    job=r.json()
    job_id=job["jobId"]
    try:
        img_r=requests.get(BACKEND+job["imageUrl"],timeout=60)
        img_r.raise_for_status()
        source=Image.open(io.BytesIO(img_r.content)).convert("RGB")
        prompt=job["prompt"]
        result=pipe(
            image=source,
            prompt=prompt,
            num_inference_steps=28,
            guidance_scale=3.5
        ).images[0]
        buf=io.BytesIO(); result.save(buf,format="PNG")
        payload={"imageBase64":base64.b64encode(buf.getvalue()).decode(),"mimeType":"image/png"}
        done=requests.post(BACKEND+"/api/worker/jobs/"+job_id+"/complete",json=payload,headers=headers(),timeout=120)
        done.raise_for_status()
    except Exception as e:
        requests.post(BACKEND+"/api/worker/jobs/"+job_id+"/fail",json={"error":str(e)},headers=headers(),timeout=60)
