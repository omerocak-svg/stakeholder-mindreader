#!/bin/bash
# Wrapper that runs claude -p with a prompt file, used by the server
# Usage: run-claude.sh <prompt-file>
source ~/.nvm/nvm.sh 2>/dev/null || true
export PATH="/home/oocak/.nvm/versions/node/v18.20.8/bin:$PATH"
claude -p "$(cat "$1")" --dangerously-skip-permissions
