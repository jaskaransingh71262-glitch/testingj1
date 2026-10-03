import time
import gradio as gr
import spaces
import torch
from diffusers import FluxPipeline

MODEL_ID = "black-forest-labs/FLUX.1-schnell"
pipe = None

def load_pipeline():
    global pipe
    if pipe is None:
        pipe = FluxPipeline.from_pretrained(
            MODEL_ID,
            torch_dtype=torch.bfloat16,
        )
        pipe.enable_model_cpu_offload()
    return pipe

def build_prompt(product, style, background, lighting):
    return (
        f"Professional commercial product photography of {product}, "
        f"{style} visual direction, {background} background, {lighting} lighting, "
        "premium ecommerce advertising, realistic materials, accurate product geometry, "
        "clean composition, photorealistic, sharp focus, studio quality, no text, no watermark."
    )

@spaces.GPU(duration=60)
def generate(product, style, background, lighting, steps, guidance):
    if not product.strip():
        raise gr.Error("Describe the product first.")

    prompt = build_prompt(product, style, background, lighting)
    model = load_pipeline()

    started = time.perf_counter()
    result = model(
        prompt=prompt,
        num_inference_steps=int(steps),
        guidance_scale=float(guidance),
        width=1024,
        height=1024,
        max_sequence_length=256,
    )
    elapsed = time.perf_counter() - started

    image = result.images[0]
    metrics = f"Generation: {elapsed:.1f}s | Steps: {int(steps)} | Model: FLUX.1-schnell"
    return image, prompt, metrics

with gr.Blocks(title="AI Product Studio — Zero Cost Lab") as demo:
    gr.Markdown("# AI Product Studio — Zero Cost Lab")
    gr.Markdown("Experimental proof-of-concept for commercial product image generation.")

    with gr.Row():
        with gr.Column():
            product = gr.Textbox(
                label="Product",
                placeholder="Example: premium black wristwatch",
                value="premium black wristwatch",
            )
            style = gr.Dropdown(
                ["Luxury", "Minimal", "Editorial", "Lifestyle", "Premium ecommerce"],
                value="Luxury",
                label="Style",
            )
            background = gr.Dropdown(
                ["dark marble studio", "clean white studio", "warm wood table", "modern lifestyle scene"],
                value="dark marble studio",
                label="Background",
            )
            lighting = gr.Dropdown(
                ["softbox studio lighting", "dramatic rim lighting", "warm golden-hour lighting"],
                value="dramatic rim lighting",
                label="Lighting",
            )
            steps = gr.Slider(1, 4, value=4, step=1, label="Inference steps")
            guidance = gr.Slider(0, 10, value=0, step=0.5, label="Guidance scale")
            generate_btn = gr.Button("GENERATE", variant="primary")

        with gr.Column():
            output = gr.Image(label="Generated commercial image", type="pil")
            prompt_out = gr.Textbox(label="Resolved prompt")
            metrics = gr.Textbox(label="Measurement")

    generate_btn.click(
        generate,
        inputs=[product, style, background, lighting, steps, guidance],
        outputs=[output, prompt_out, metrics],
    )

if __name__ == "__main__":
    demo.launch()
