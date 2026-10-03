import React, { useMemo, useRef, useState } from "react";

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

function downloadCanvas(canvas, name) {
  const link = document.createElement("a");
  link.download = name;
  link.href = canvas.toDataURL("image/png", 1);
  link.click();
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

  const generate = async () => {
    if (!preview) {
      alert("Upload a product photo first.");
      return;
    }
    setBusy(true);
    try {
      const API = "https://jaskaransingh123-ai-product-studio-engine.hf.space";
      const uploadData = new FormData();
      const blob = await (await fetch(preview)).blob();
      uploadData.append("files", blob, file?.name || "product.png");
      const uploadResponse = await fetch(API + "/gradio_api/upload", {
        method: "POST",
        body: uploadData
      });
      if (!uploadResponse.ok) throw new Error("Image upload failed.");
      const uploaded = await uploadResponse.json();
      const path = Array.isArray(uploaded) ? uploaded[0] : uploaded.path;

      const promptText = [
        prompt,
        selectedStyle?.[2],
        "professional commercial product photography",
        "preserve the product identity and proportions",
        background + " background",
        lighting + " lighting",
        "high detail, realistic materials"
      ].join(", ");

      const callResponse = await fetch(API + "/gradio_api/call/generate", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          data: [
            {path, meta: {_type: "gradio.FileData"}},
            promptText,
            0.35,
            4
          ]
        })
      });
      if (!callResponse.ok) throw new Error("Generation request failed.");
      const event = await callResponse.json();

      const stream = await fetch(API + "/gradio_api/call/generate/" + event.event_id);
      if (!stream.ok) throw new Error("Generation queue failed.");
      const reader = stream.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let output = null;

      while (true) {
        const {value, done} = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, {stream: true});
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() || "";
        for (const chunk of chunks) {
          const dataLine = chunk.split("\n").find(line => line.startsWith("data:"));
          if (!dataLine) continue;
          const payload = dataLine.slice(5).trim();
          if (!payload || payload === "null") continue;
          try {
            const parsed = JSON.parse(payload);
            if (Array.isArray(parsed) && parsed[0]) output = parsed[0];
          } catch {}
        }
      }

      const imagePath = output?.url || output?.path;
      if (!imagePath) throw new Error("The AI engine returned no image.");
      const imageUrl = imagePath.startsWith("http") ? imagePath : API + "/file=" + encodeURIComponent(imagePath);
      const item = {
        url: imageUrl,
        style, background, lighting, prompt,
        time: new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})
      };
      setResult(item);
      setHistory(h => [item, ...h].slice(0, 6));
    } catch (error) {
      console.error(error);
      alert("AI generation failed: " + error.message);
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
            {result && <div className="result-bar"><span>{result.style} · {result.background} · {result.lighting}</span><button onClick={() => downloadCanvas(canvasRef.current, "ai-product-studio.png")}>DOWNLOAD PNG ↓</button></div>}
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
