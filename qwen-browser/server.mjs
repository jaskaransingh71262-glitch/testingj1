import express from "express";
import cors from "cors";
import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const PORT = Number(process.env.PORT || 8787);
const OLLAMA_URL = (process.env.OLLAMA_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
const MODEL = process.env.OLLAMA_MODEL || "qwen3-vl:2b";
const HOST = process.env.BROWSER_HOST || "127.0.0.1";

app.use(cors({ origin: true }));
app.use(express.json({ limit: "15mb" }));
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, "web")));

let browser;
let page;
let busy = false;
let lastAction = null;
let lastError = null;

async function ensureBrowser() {
  if (!browser) {
    browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    page = await context.newPage();
    await page.goto("https://www.google.com", { waitUntil: "domcontentloaded", timeout: 30000 });
  }
  return page;
}

async function screenshot() {
  const p = await ensureBrowser();
  return p.screenshot({ type: "jpeg", quality: 55 });
}

async function state() {
  const p = await ensureBrowser();
  return {
    url: p.url(),
    title: await p.title().catch(() => ""),
    busy,
    model: MODEL,
    lastAction,
    lastError
  };
}

function extractJson(text) {
  if (!text) return null;
  const cleaned = String(text).replace(/\\u001b\[[0-9;]*m/g, "");
  const fenced = cleaned.match(/\\`\\`\\`(?:json)?\\s*([\\s\\S]*?)\\`\\`\\`/i);
  const source = fenced ? fenced[1] : cleaned;
  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try { return JSON.parse(source.slice(start, end + 1)); } catch {}
  const match = source.match(/\{[\s\S]*\}/);
  if (match) try { return JSON.parse(match[0]); } catch {}
  return null;
}

async function askQwen(goal, imageBase64, context) {
  const system = [
    "You are a browser-use agent.",
    "You control a visible Playwright browser.",
    "Return ONLY one JSON object and nothing else.",
    "Allowed actions: goto, click, type, press, scroll, back, wait, done, fail.",
    "click uses x and y pixel coordinates from the screenshot.",
    "type uses text and should be used only after selecting a text field.",
    "goto uses a complete http or https URL.",
    "scroll uses dy.",
    "press uses a keyboard key such as Enter, Tab, Escape, ArrowDown.",
    "wait uses ms.",
    "done means the user's goal is complete.",
    "fail means the goal cannot be completed.",
    'Schema: {"action":"click|type|goto|press|scroll|back|wait|done|fail","x":0,"y":0,"text":"","url":"","key":"","dy":0,"ms":1000,"reason":""}',
    "Never invent a successful result. Use done only when the screenshot/state proves completion."
  ].join(" ");
  const prompt = [
    system,
    "",
    "USER GOAL:",
    goal,
    "",
    "BROWSER STATE:",
    JSON.stringify(context),
    "",
    "Choose exactly one next action."
  ].join("\n");

  const response = await fetch(OLLAMA_URL + "/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      stream: false,
      think: false,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt, images: [imageBase64] }
      ],
      options: { temperature: 0 }
    })
  });

  if (!response.ok) throw new Error("Ollama HTTP " + response.status + ": " + await response.text());
  const data = await response.json();
  const raw = data?.message?.content || data?.message?.thinking || data?.response || "";
  const action = extractJson(raw);
  if (!action) throw new Error("Qwen returned no valid JSON action. Raw output: " + String(raw).slice(-1200));
  return action;
}

async function execute(action) {
  const p = await ensureBrowser();
  switch (action.action) {
    case "goto":
      if (!/^https?:\/\//i.test(action.url || "")) throw new Error("Only http(s) URLs are allowed.");
      await p.goto(action.url, { waitUntil: "domcontentloaded", timeout: 30000 });
      break;
    case "click":
      await p.mouse.click(Number(action.x), Number(action.y));
      break;
    case "type":
      await p.keyboard.type(String(action.text || ""), { delay: 15 });
      break;
    case "press":
      await p.keyboard.press(String(action.key || "Enter"));
      break;
    case "scroll":
      await p.mouse.wheel(0, Number(action.dy || 600));
      break;
    case "back":
      await p.goBack({ waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
      break;
    case "wait":
      await new Promise(r => setTimeout(r, Math.min(Math.max(Number(action.ms || 1000), 100), 10000)));
      break;
    case "done":
    case "fail":
      break;
    default:
      throw new Error("Unsupported action: " + action.action);
  }
  await p.waitForTimeout(500);
  return state();
}

app.get("/api/health", async (_req, res) => {
  let ollama = false;
  try { ollama = (await fetch(OLLAMA_URL + "/api/tags")).ok; } catch {}
  res.json({ ok: true, browser: Boolean(page), ollama, model: MODEL });
});

app.get("/api/state", async (_req, res) => {
  try { res.json(await state()); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/screenshot", async (_req, res) => {
  try {
    const shot = await screenshot();
    res.type("image/jpeg").send(shot);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/navigate", async (req, res) => {
  try {
    const url = String(req.body?.url || "");
    if (!/^https?:\/\//i.test(url)) return res.status(400).json({ error: "Enter a complete http(s) URL." });
    const p = await ensureBrowser();
    await p.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    res.json(await state());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/action", async (req, res) => {
  try {
    const action = req.body?.action;
    if (!action?.action) return res.status(400).json({ error: "action is required" });
    lastAction = action;
    res.json(await execute(action));
  } catch (e) {
    lastError = e.message;
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/agent", async (req, res) => {
  if (busy) return res.status(409).json({ error: "Agent is already running." });
  const goal = String(req.body?.goal || "").trim();
  if (!goal) return res.status(400).json({ error: "goal is required" });

  busy = true;
  lastError = null;
  const trace = [];
  try {
    await ensureBrowser();
    for (let step = 1; step <= 12; step++) {
      const shot = await screenshot();
      const current = await state();
      const image = shot.toString("base64");
      const action = await askQwen(goal, image, current);
      trace.push({ step, action });
      lastAction = action;

      if (action.action === "done") {
        return res.json({ ok: true, status: "done", steps: trace, state: await state() });
      }
      if (action.action === "fail") {
        return res.json({ ok: false, status: "failed", reason: action.reason || "Qwen stopped.", steps: trace, state: await state() });
      }
      await execute(action);
    }
    return res.json({ ok: false, status: "limit", steps: trace, state: await state() });
  } catch (e) {
    lastError = e.message;
    return res.status(500).json({ ok: false, error: e.message, steps: trace });
  } finally {
    busy = false;
  }
});

process.on("SIGINT", async () => { if (browser) await browser.close().catch(() => {}); process.exit(0); });
process.on("SIGTERM", async () => { if (browser) await browser.close().catch(() => {}); process.exit(0); });

app.listen(PORT, HOST, () => {
  console.log("Qwen Local Browser listening on http://" + HOST + ":" + PORT);
  console.log("Ollama: " + OLLAMA_URL + " | Model: " + MODEL);
});
