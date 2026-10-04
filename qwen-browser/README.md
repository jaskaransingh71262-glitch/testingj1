# Qwen Local Browser Agent

A local browser agent powered by your local Ollama model.

## Architecture

Hosted UI (optional Render static site)
        |
        | HTTP from your browser
        v
127.0.0.1:8787
        |
        +-- Playwright -> visible Chromium
        |
        +-- Ollama -> qwen3-vl:2b

The model and browser stay on your Mac. No paid model API is required.

## Local run

Requirements:
- Node.js 20+
- Ollama
- qwen3-vl:2b
- Playwright Chromium

From the repo:

```bash
cd qwen-browser
npm install
npx playwright install chromium
ollama serve
ollama run qwen3-vl:2b
npm start
```

Then open the UI from the Render static site if deployed, or use the local UI files in this folder.

Default local agent endpoint:
`http://127.0.0.1:8787`

Environment variables:
- `OLLAMA_URL` default `http://127.0.0.1:11434`
- `OLLAMA_MODEL` default `qwen3-vl:2b`
- `PORT` default `8787`

## What it can do

- Open URLs
- Inspect a screenshot with Qwen Vision
- Click by screenshot coordinates
- Type and press keys
- Scroll and go back
- Run a bounded multi-step agent loop
- Verify completion from a new screenshot/state

The agent intentionally has no arbitrary shell, filesystem, or credential-access tool.

## Important

The Render UI does NOT host the model. It is only a control surface. The browser calls your Mac's loopback agent directly, so Ollama remains local.

For an HTTPS-hosted UI, modern browsers generally treat loopback addresses as local resources, but if a browser blocks the request, use the local UI instead.

Do not expose port 8787 publicly without adding authentication and TLS.
