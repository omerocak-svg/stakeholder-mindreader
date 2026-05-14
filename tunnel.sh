#!/bin/bash
# Creates a public URL for the app using serveo.net (no install needed)
# Usage: bash tunnel.sh
# Then share the printed URL

echo "🌐 Creating public tunnel..."
echo "   Your app will be available at a public URL."
echo "   Make sure start.sh is already running first."
echo ""

# Try serveo.net first (zero install, SSH-based)
if command -v ssh &> /dev/null; then
  echo "Using serveo.net (SSH tunnel)..."
  ssh -R 80:localhost:3000 serveo.net
else
  echo "SSH not found. Install ngrok: https://ngrok.com/download"
  echo "Then run: ngrok http 3000"
fi
