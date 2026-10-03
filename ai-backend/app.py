import spaces
import gradio as gr
import torch
from diffusers import AutoPipelineForImage2Image
from PIL import Image

MODEL = "stabilityai/sdxl-turbo"
pipe = AutoPipelineForImage2Image.from_pretrained(
    MODEL,
    torch_dtype=torch.float16,
    variant="fp16",
).to("cuda")

@spaces.GPU(duration=45)
def generate(product_image, prompt, strength, steps):
    if product_image is None:
        raise gr.Error("Upload a product image first.")
    if not prompt.strip():
        prompt = "premium commercial product photography, clean studio composition"
    image = product_image.convert("RGB")
    result = pipe(
        prompt=prompt,
        image=image,
        strength=float(strength),
        num_inference_steps=int(steps),
        guidance_scale=0.0,
    ).images[0]
    return result

with gr.Blocks(title="AI Product Studio API") as demo:
    gr.Markdown("# AI Product Studio — Generation Engine")
    gr.Markdown("ZeroGPU image-to-image generation backend.")
    image = gr.Image(type="pil", label="Product image")
    prompt = gr.Textbox(label="Creative direction", value="premium commercial product photography, clean studio composition")
    strength = gr.Slider(0.15, 0.75, value=0.35, step=0.05, label="Transformation strength")
    steps = gr.Slider(1, 4, value=4, step=1, label="Inference steps")
    output = gr.Image(label="Generated image")
    btn = gr.Button("Generate", variant="primary")
    btn.click(generate, [image, prompt, strength, steps], output)

if __name__ == "__main__":
    demo.launch()
