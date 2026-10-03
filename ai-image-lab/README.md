# AI Product Studio — Zero-Cost Image Lab

This directory is an experimental inference prototype. It is intentionally separate from the existing 3D website.

## Goal

Prove whether we can generate commercially useful product imagery using:

- Hugging Face ZeroGPU
- FLUX.1-schnell
- Gradio

The prototype records generation time so we can measure reality rather than assume it.

## Intended deployment

Create a Hugging Face Space with:

- SDK: Gradio
- Hardware: ZeroGPU
- Visibility: private while testing

Upload `app.py` and `requirements.txt`.

## Important

The first experiment is not a production service. Do not expose it publicly until usage limits, model licensing, image storage, abuse controls, and authentication have been designed.

The current product experiment is "AI Product Studio": turn ordinary product descriptions/images into commercial-looking marketing imagery.
