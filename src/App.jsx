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
    await new Promise(r => setTimeout(r, 650));

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const W = 1200, H = 1200;
    canvas.width = W; canvas.height = H;

    const bg = selectedBg[2];
    const gradient = ctx.createLinearGradient(0, 0, W, H);
    gradient.addColorStop(0, bg);
    gradient.addColorStop(1, lighting === "Neon" ? "#24143a" : "#08090b");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    if (lighting === "Softbox") {
      const glow = ctx.createRadialGradient(600, 430, 40, 600, 430, 620);
      glow.addColorStop(0, "rgba(255,255,255,.72)");
      glow.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    }
    if (lighting === "Daylight") {
      const glow = ctx.createRadialGradient(250, 200, 30, 250, 200, 650);
      glow.addColorStop(0, "rgba(255,238,194,.8)");
      glow.addColorStop(1, "rgba(255,238,194,0)");
      ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    }
    if (lighting === "Neon") {
      const glow = ctx.createRadialGradient(900, 300, 10, 900, 300, 500);
      glow.addColorStop(0, "rgba(110,72,255,.65)");
      glow.addColorStop(1, "rgba(110,72,255,0)");
      ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    }

    const img = new Image();
    img.onload = () => {
      const maxW = 780, maxH = 720;
      const scale = Math.min(maxW / img.width, maxH / img.height, 1);
      const w = img.width * scale, h = img.height * scale;
      const x = (W - w) / 2, y = 220 + (maxH - h) / 2;

      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,.48)";
      ctx.shadowBlur = 45;
      ctx.shadowOffsetY = 30;
      ctx.drawImage(img, x, y, w, h);
      ctx.restore();

      ctx.fillStyle = "rgba(255,255,255,.82)";
      ctx.font = "600 18px Inter, Arial";
      ctx.fillText(style.toUpperCase() + " / " + lighting.toUpperCase(), 58, 62);
      ctx.fillStyle = "rgba(255,255,255,.46)";
      ctx.font = "400 15px Inter, Arial";
      ctx.fillText("AI PRODUCT STUDIO", 58, 91);
      ctx.fillText(prompt.slice(0, 90), 58, 114);

      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const item = { url, style, background, lighting, prompt, time: new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}) };
        setResult(item);
        setHistory(h => [item, ...h].slice(0, 6));
        setBusy(false);
      }, "image/png", 1);
    };
    img.src = preview;
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
