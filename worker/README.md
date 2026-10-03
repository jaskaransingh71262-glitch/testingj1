# Free GPU worker

This worker connects the Render job API to FLUX.1 Kontext [dev].

## Current free deployment path: Google Colab

Colab free GPU availability is not guaranteed and sessions can end, so this is a development/public-demo worker rather than an always-on production GPU.

### 1. Accept the FLUX model license

The model is gated on Hugging Face. Sign in, accept the model conditions, and create a Hugging Face access token.

Model: https://huggingface.co/black-forest-labs/FLUX.1-Kontext-dev

### 2. Start a Colab GPU runtime

Open a new Google Colab notebook and select Runtime -> Change runtime type -> T4 GPU (if offered).

### 3. Install dependencies

    !pip install -U requests torch torchvision transformers diffusers accelerate safetensors Pillow huggingface_hub

### 4. Set worker variables

    import os
    os.environ["BACKEND_URL"] = "https://testingj1-1.onrender.com"
    os.environ["WORKER_SECRET"] = "PASTE_THE_VALUE_FROM_RENDER_HERE"
    os.environ["HF_TOKEN"] = "PASTE_YOUR_HUGGING_FACE_TOKEN_HERE"

Do not commit either secret to GitHub.

### 5. Run the worker

Download worker/colab_worker.py from this repository and run it in Colab.

The worker polls Render, downloads the uploaded product image, runs FLUX.1 Kontext [dev], sends the generated PNG back to Render, and marks the job completed.

Keep the Colab session running while you want generation available.

## Important limitations

- Free Colab does not guarantee a GPU, a particular GPU type, or unlimited runtime.
- Render's local filesystem is temporary in this prototype.
- FLUX.1 Kontext [dev] is gated and uses the FLUX.1 [dev] Non-Commercial License. Check the current model terms before commercial deployment.
