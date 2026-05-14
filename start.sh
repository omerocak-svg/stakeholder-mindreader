#!/bin/bash
source ~/.nvm/nvm.sh 2>/dev/null || true
export PATH="$HOME/.nvm/versions/node/v18.20.8/bin:$PATH"

APP_DIR="/mnt/c/Users/oocak/stakeholder-mindreader"

kill -9 $(lsof -ti:3001 -ti:3000 -ti:3002 -ti:3003) 2>/dev/null
sleep 1

# Clean stale jobs
rm -f /tmp/mindreader-jobs/*.prompt /tmp/mindreader-jobs/*.running /tmp/mindreader-jobs/*.done 2>/dev/null

echo "🧠 Starting..."
echo "   Node: $(which node) $(node --version)"

node "$APP_DIR/server/index.js" &
echo "✅ Server started"

bash "$APP_DIR/server/worker.sh" &
echo "✅ Worker started"

sleep 1
cd "$APP_DIR/ui" && npx vite --host
