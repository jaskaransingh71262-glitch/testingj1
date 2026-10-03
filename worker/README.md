# Free GPU worker

This worker connects the Render job API to FLUX.1 Kontext [dev].

## Current free deployment path: Kaggle

Kaggle notebooks can provide free GPU access, but GPU availability and session duration are not guaranteed. Use the Kaggle notebook as an on-demand worker rather than assuming an always-on GPU server.

Kaggle's current GPU guidance should be checked before relying on a specific accelerator or quota.

### Model

The worker uses:

- Model: `black-forest-labs/FLUX.1-Kontext-dev`
- Input: product image + creative prompt
- Output: generated PNG sent back to Render
- GPU mode: CUDA
- Memory strategy: Diffusers CPU offload
- T4: FP16
- Newer GPUs with compute capability >= 8: BF16

The FLUX model is gated on Hugging Face. Accept its current terms and create a Hugging Face access token before running the worker.

## Kaggle setup

### 1. Create a Kaggle notebook

Create a new Kaggle Notebook.

Set:

**Notebook -> Accelerator -> GPU**

A T4 is suitable for the current worker. If Kaggle assigns another supported NVIDIA GPU, the worker automatically selects FP16/BF16 based on compute capability.

### 2. Add Kaggle Secrets

Add these notebook secrets:

- `HF_TOKEN` = your Hugging Face access token
- `WORKER_SECRET` = the exact Render environment variable value

Do not put either secret in GitHub or in a notebook cell.

### 3. Run the notebook cells

Use the cells documented below in the project setup instructions.

The worker downloads `worker/kaggle_worker.py` from GitHub, loads FLUX, polls Render for queued jobs, downloads each product image, generates the campaign image, and uploads the result back to Render.

### 4. Keep the notebook running

When the Kaggle session ends, the GPU worker stops. New jobs remain queued on Render until another worker session is started.

## Existing backend contract

The worker uses these Render endpoints:

- `GET /api/worker/jobs/next`
- `POST /api/worker/jobs/:id/complete`
- `POST /api/worker/jobs/:id/fail`

The existing `WORKER_SECRET` protects all worker endpoints.

## Important limitations

- Free Kaggle GPU availability is not guaranteed.
- Kaggle sessions can stop, so this is not an always-on production GPU.
- Render's prototype job queue is in memory.
- Render's local filesystem is temporary.
- FLUX.1 Kontext [dev] is subject to its current model/license terms. Check the current Hugging Face terms before commercial deployment.
