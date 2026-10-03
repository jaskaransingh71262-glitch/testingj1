import React, { useMemo, useRef, useState } from "react";
import { Client } from "@gradio/client";

const STYLES = [
  ["Luxury", "Luxury editorial", "soft shadows, premium materials, high-end campaign"],
  ["Ecommerce", "Clean ecommerce", "clean studio lighting, white seamless background"],
  ["Lifestyle", "Lifestyle scene", "natural environment, realistic context, premium advertising"],
  ["Minimal", "Minimal product", "simple composition, subtle gradient, precise lighting"],
];
const BACKGROUNDS = [
  ["Studio", "Studio White", "#f4f1eb"],
  ["Slate", "Slate", "#17191d"],
  ["Sand", "Warm Sand", "#d9c3a5"],
  ["Midnight", "Midnight", "#090d18"],
];
const LIGHTING = ["Softbox", "Dramatic", "Daylight", "Neon"];

async function downloadImage(url, name) {
  const response = await fetch(url);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = name;
  link.href = objectUrl;
  link.click();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export default function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [style, setStyle] = useState("Luxury");
  const [background, setBackground] = useState("Studio");
  const [lighting, setLighting] = useState("Softbox");
  const [prompt, setPrompt] = useState("Premium commercial product photography");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const canvasRef = useRef(null);

  const selectedStyle = useMemo(() => STYLES.find(x => x[0] === style), [style]);
  const selectedBg = useMemo(() => BACKGROUNDS.find(x => x[0] === background), [background]);

  const onFile = (next) => {
    const f = next?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) return;
    if (f.size > 12 * 1024 * 1024) {
      alert("Please choose an image smaller than 12 MB.");
      return;
    }
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = e => setPreview(String(e.target.result));
    reader.readAsDataURL(f);
  };


  const readGradioStream = async (response) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let latest = null;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() || "";

      for (const event of events) {
        const eventName = event.split("\n").find(line => line.startsWith("event:"))?.slice(6).trim();
        const dataLine = event.split("\n").find(line => line.startsWith("data:"))?.slice(5).trim();
        if (!dataLine) continue;

        if (eventName === "error") {
          throw new Error(dataLine);
        }

        if (eventName === "complete") {
          latest = JSON.parse(dataLine);
        }
      }
    }

    if (!latest) throw new Error("Qwen stream ended without a completed result.");
    return latest;
  };
  const generate = async () => {
    if (!file) {
      alert("Upload a product photo first.");
      return;
    }

    setBusy(true);
    try {
      const apiBase = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
      if (!apiBase) {
        throw new Error("AI backend is not connected yet. Set VITE_API_BASE_URL to the Render backend.");
      }

      const creativePrompt = [
        prompt,
        selectedStyle?.[2],
        "professional commercial product photography",
        "preserve product identity, proportions, shape and key details",
        "no text, logos or watermarks",
        background + " background",
        lighting + " lighting",
        "premium advertising image, realistic materials, controlled composition"
      ].join(", ");

      console.log("Submitting image job to AI Product Studio backend...");

      const form = new FormData();
      form.append("image", file, file.name);
      form.append("prompt", creativePrompt);
      form.append("style", style);
      form.append("background", background);
      form.append("lighting", lighting);

      const response = await fetch(apiBase + "/api/jobs", {
        method: "POST",
        body: form
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "AI backend rejected the request (" + response.status + ").");
      }

      const jobId = payload.jobId;
      if (!jobId) throw new Error("AI backend returned no job ID.");

      let job = payload;
      for (let attempt = 0; attempt < 120; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 2000));

        const statusResponse = await fetch(apiBase + "/api/jobs/" + encodeURIComponent(jobId));
        const statusPayload = await statusResponse.json().catch(() => ({}));

        if (!statusResponse.ok) {
          throw new Error(statusPayload.error || "Could not read generation status.");
        }

        job = statusPayload;
        if (job.status === "completed") break;
        if (job.status === "failed") {
          throw new Error(job.error || "The AI worker failed to generate the image.");
        }
      }

      if (job.status !== "completed" || !job.imageUrl) {
        throw new Error("Generation timed out. The worker may still be processing the job.");
      }

      const imageUrl = job.imageUrl.startsWith("http")
        ? job.imageUrl
        : apiBase + job.imageUrl;

      const item = {
        url: imageUrl,
        style,
        background,
        lighting,
        prompt,
        time: new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})
      };

      setResult(item);
      setHistory(h => [item, ...h].slice(0, 6));
      console.log("AI generation complete:", imageUrl);
    } catch (error) {
      console.error("AI generation error:", error);
      alert("AI generation failed: " + (error?.message || String(error) || "Unknown error"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="studio-app">
      <header className="nav">
        <div className="brand"><span className="brand-mark">AI</span><span>PRODUCT STUDIO</span></div>
        <nav><a href="#create">CREATE</a><a href="#workflow">WORKFLOW</a><a href="#history">HISTORY</a></nav>
        <span className="status"><i /> FREE MODE</span>
      </header>

      <main>
        <section className="hero">
          <div>
            <p className="eyebrow">AI PRODUCT PHOTOGRAPHY / 001</p>
            <h1>Turn ordinary<br /><em>product photos</em><br />into campaigns.</h1>
            <p className="hero-copy">Upload one product image. Choose a visual direction. Build a polished commercial composition in seconds.</p>
            <a className="hero-cta" href="#create">START CREATING ↓</a>
          </div>
          <div className="hero-art">
            <div className="orb" />
            <div className="floating-card"><small>LIVE PREVIEW</small><strong>PRODUCT<br />CAMPAIGN</strong><span>LIGHT / COMPOSITION / STYLE</span></div>
          </div>
        </section>

        <section className="workspace" id="create">
          <aside className="panel">
            <div className="panel-head"><span>01 / INPUT</span><b>LOCAL</b></div>
            <label className="upload" onDragOver={e => e.preventDefault()} onDrop={e => {e.preventDefault(); onFile(e.dataTransfer.files)}} >
              <input type="file" accept="image/*" onChange={e => onFile(e.target.files)} />
              {preview ? <img src={preview} alt="Product preview" /> : <><strong>DROP PRODUCT PHOTO</strong><span>or click to browse · JPG / PNG / WEBP · 12 MB</span></>}
            </label>

            <div className="field"><label>CAMPAIGN DIRECTION</label><div className="choice-grid">{STYLES.map(x => <button key={x[0]} className={style === x[0] ? "selected" : ""} onClick={() => setStyle(x[0])}><b>{x[0]}</b><span>{x[1]}</span></button>)}</div></div>

            <div className="field"><label>BACKGROUND</label><div className="chips">{BACKGROUNDS.map(x => <button key={x[0]} className={background === x[0] ? "chip selected" : "chip"} onClick={() => setBackground(x[0])}><i style={{background:x[2]}} />{x[1]}</button>)}</div></div>

            <div className="field"><label>LIGHTING</label><div className="chips">{LIGHTING.map(x => <button key={x} className={lighting === x ? "chip selected" : "chip"} onClick={() => setLighting(x)}>{x}</button>)}</div></div>

            <div className="field"><label>CREATIVE DIRECTION</label><textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows="3" placeholder="Describe the campaign..." /></div>

            <button className="generate" onClick={generate} disabled={busy}>{busy ? "COMPOSING..." : "CREATE PRODUCT IMAGE"} <span>→</span></button>
            <p className="engine-note">Free browser composer · no API key required · your source image stays in this browser.</p>
          </aside>

          <section className="preview-panel">
            <div className="panel-head"><span>02 / CANVAS</span><b>{result ? "READY" : "WAITING FOR INPUT"}</b></div>
            <div className="canvas-wrap">
              {result ? <img className="result-image" src={result.url} alt="Generated product campaign" /> : <div className="empty"><div className="empty-icon">✦</div><h2>Your campaign<br /><em>appears here.</em></h2><p>Upload a product and create your first composition.</p></div>}
            </div>
            {result && <div className="result-bar"><span>{result.style} · {result.background} · {result.lighting}</span><button onClick={() => downloadImage(result.url, "ai-product-studio.png")}>DOWNLOAD PNG ↓</button></div>}
            <canvas ref={canvasRef} className="hidden-canvas" />
          </section>
        </section>

        <section className="workflow" id="workflow">
          <p className="eyebrow">03 / WORKFLOW</p>
          <h2>One photo.<br /><em>Many campaigns.</em></h2>
          <div className="steps"><article><b>01</b><h3>UPLOAD</h3><p>Start with the product photo you already have.</p></article><article><b>02</b><h3>DIRECT</h3><p>Pick the mood, background, lighting and creative direction.</p></article><article><b>03</b><h3>CREATE</h3><p>Export a polished campaign image ready for iteration.</p></article></div>
        </section>

        <section className="history" id="history">
          <div className="panel-head"><span>04 / RECENT OUTPUTS</span><b>{history.length} CREATED</b></div>
          {history.length === 0 ? <p className="history-empty">Your generated campaigns will appear here during this session.</p> : <div className="history-grid">{history.map((x,i) => <button key={i} onClick={() => setResult(x)}><img src={x.url} alt="" /><span>{x.style} / {x.lighting}</span></button>)}</div>}
        </section>
      </main>

      <footer><span>AI PRODUCT STUDIO</span><span>BUILD 001 / FREE MODE</span></footer>
    </div>
  );
}
