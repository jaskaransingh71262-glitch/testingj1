# Jaskaran Local Agent

A local MCP server for your Mac that gives an MCP host controlled access to one development workspace.

## Current scope

Tools:

- `workspace_info`
- `list_files`
- `read_file`
- `write_file`
- `delete_file`
- `run_command`
- `git_status`

The server is workspace-scoped.

Default workspace:

`~/Projects/testingj1`

Override it with:

`AGENT_WORKSPACE=/absolute/path/to/project`

## Install on your Mac

If the repository is already cloned at `~/Projects/testingj1`:

```bash
cd ~/Projects/testingj1/local-agent
npm install
```

If you do not have the repository locally yet:

```mkdir -p ~/Projects
cd ~/Projects
git clone https://github.com/jaskaransingh71262-glitch/testingj1.git
cd testingj1/local-agent
npm install
```

Node.js 20+ is required by the current MCP TypeScript SDK. citeturn0search11

## Point it at your project

For the first setup, use only your `testingj1` workspace:

```bash
export AGENT_WORKSPACE="$HOME/Projects/testingj1"
```

You can verify the path:

```bash
npm start
```

The MCP server communicates over stdio. Leave it running when a compatible MCP host is using it.

## Security boundary

File tools reject paths outside `AGENT_WORKSPACE`.

Command execution:

- runs with cwd = `AGENT_WORKSPACE`
- uses `shell=false`
- blocks `sudo`, `diskutil`, `launchctl`, `shutdown`, and `reboot`
- destructive command names require an explicit `allow_destructive=true`
- directories cannot be deleted through `delete_file`

This is **not** a complete OS sandbox. A project command such as `npm run` can execute scripts defined by that project. Only point the agent at code you trust.

## Test before connecting ChatGPT

Run the server through MCP Inspector:

```bash
cd ~/Projects/testingj1/local-agent
npx @modelcontextprotocol/inspector npm start
```

The Inspector lets you confirm that the server initializes and exposes the expected tools before connecting an AI host. The MCP documentation recommends Inspector for local MCP testing. citeturn0search11

## Codex local testing

Codex supports MCP servers and can launch a local stdio MCP process. OpenAI's current MCP documentation shows local MCP configuration through Codex. citeturn1search0

A typical Codex configuration entry is:

```toml
[mcp_servers.jaskaran_local]
command = "node"
args = ["/Users/YOUR_USERNAME/Projects/testingj1/local-agent/server.mjs"]
```

Use your real macOS username/path rather than copying `YOUR_USERNAME`.

Then verify with:

```bash
codex mcp list
```

## Connecting the same private server to ChatGPT

For ChatGPT itself, do **not** expose this server directly to the public Internet.

OpenAI now provides Secure MCP Tunnel specifically for private MCP servers running on developer machines. The tunnel client makes the outbound connection and forwards MCP requests to the private local server. citeturn1search6turn1search7

The tunnel flow is:

```
ChatGPT
   |
OpenAI-hosted MCP tunnel
   |
outbound HTTPS from your Mac
   |
tunnel-client
   |
local MCP server
   |
~/Projects/testingj1
```

The exact tunnel identity and connection setup must be created in the OpenAI surface that supports Secure MCP Tunnel. Do not put an API key, GitHub token, or tunnel credential into this repository.

## Never commit secrets

Do not put any of these into GitHub:

- OpenAI API keys
- GitHub tokens
- SSH private keys
- passwords
- Hugging Face tokens
- tunnel credentials

