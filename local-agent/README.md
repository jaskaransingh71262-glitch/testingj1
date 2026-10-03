# Jaskaran Local Agent

A local MCP server for the Mac that gives an MCP host controlled access to one development workspace.

## What it provides

- workspace_info
- list_files
- read_file
- write_file
- delete_file
- run_command
- git_status

The server is intentionally workspace-scoped.

Default workspace:

`~/Projects/testingj1`

Override it with:

`AGENT_WORKSPACE=/absolute/path/to/project`

## Install

```bash
cd ~/Projects/testingj1/local-agent
npm install
```

## Run

```npm start
```

The server uses MCP stdio transport. The MCP TypeScript SDK currently documents stdio as the local process transport, and v2 is the current stable SDK line.

## First test

```bash
AGENT_WORKSPACE="$HOME/Projects/testingj1" npm start
```

The MCP host should launch this process and communicate over stdin/stdout.

## Security model

The server cannot read or write paths outside AGENT_WORKSPACE through its file tools.

Commands run with:

- cwd = AGENT_WORKSPACE
- shell = false
- system-level commands such as sudo, diskutil, launchctl, shutdown and reboot blocked
- destructive command names require explicit allow_destructive=true

Do not treat this as a full OS sandbox. A developer command such as npm can execute project scripts, so only point the agent at a workspace you trust.

## Connecting to ChatGPT

ChatGPT does not directly connect to a local MCP process. OpenAI documents local MCP through supported desktop/local-plugin and Secure MCP Tunnel paths. The exact connection surface depends on the ChatGPT plan and product surface.

For the current personal Free account, full MCP write/modify support is not the same as Business/Enterprise/Edu. Do not expose this server publicly just to work around that limitation.

For now, the local server can be used by a compatible local MCP host such as Codex, and the same server can later be connected through a supported ChatGPT local-plugin/tunnel path.

## Never commit secrets

Do not put API keys, GitHub tokens, SSH private keys, or passwords into this repository.
