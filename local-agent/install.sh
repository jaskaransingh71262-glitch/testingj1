#!/bin/zsh
set -e

PROJECT_DIR="${1:-$HOME/Projects/testingj1}"
AGENT_DIR="$PROJECT_DIR/local-agent"

if [ ! -d "$AGENT_DIR" ]; then
  echo "Agent directory not found: $AGENT_DIR"
  echo "Clone/open the testingj1 repository first, or pass its absolute path:"
  echo "  ./local-agent/install.sh /absolute/path/to/testingj1"
  exit 1
fi

command -v node >/dev/null 2>&1 || {
  echo "Node.js is required."
  exit 1
}

cd "$AGENT_DIR"
npm install

cat <<EOF

Local agent installed.

Workspace:
  $PROJECT_DIR

Start it:
  AGENT_WORKSPACE="$PROJECT_DIR" npm start

The server uses MCP stdio and stays local; it does not open a network port.
EOF
