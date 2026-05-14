#!/bin/bash
# Stakeholder Mind Reader — Worker
# Run this ONCE in your WSL terminal. Keep it running.
# It watches for analysis jobs and runs claude with your real MCP tools.

source ~/.nvm/nvm.sh 2>/dev/null || true
export PATH="/home/oocak/.nvm/versions/node/v18.20.8/bin:$PATH"

JOBS_DIR="/tmp/mindreader-jobs"
mkdir -p "$JOBS_DIR"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  🧠 Stakeholder Mind Reader — Worker Ready               ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo "   Watching: $JOBS_DIR"
echo "   Keep this terminal open while using the app."
echo ""

# Clean up any stale jobs from previous sessions
echo "🧹 Cleaning stale jobs..."
rm -f "$JOBS_DIR"/*.prompt "$JOBS_DIR"/*.running "$JOBS_DIR"/*.done 2>/dev/null
echo "   Ready."
echo ""

while true; do
  # Debug: show directory contents every 5 seconds
  echo "$(date '+%H:%M:%S') scanning... $(ls $JOBS_DIR/*.prompt 2>/dev/null | wc -l) prompt files"

  for promptFile in "$JOBS_DIR"/*.prompt; do
    [ -f "$promptFile" ] || continue

    jobId=$(basename "$promptFile" .prompt)
    outputFile="$JOBS_DIR/${jobId}.output"
    doneFile="$JOBS_DIR/${jobId}.done"
    runningFile="$JOBS_DIR/${jobId}.running"

    # Skip if already being processed
    [ -f "$runningFile" ] && continue

    touch "$runningFile"
    echo "▶  Job $jobId — running claude..."

    echo "   $(date '+%H:%M:%S') Starting claude..."
    timeout 120 claude --dangerously-skip-permissions < "$promptFile" 2>&1 | tee "$outputFile"
    exitCode=${PIPESTATUS[0]}
    echo "   $(date '+%H:%M:%S') Claude finished (exit: $exitCode)"

    echo ""
    echo "✓  Job $jobId done (claude exit: $exitCode)"

    rm -f "$runningFile" "$promptFile"
    touch "$doneFile"
  done

  sleep 0.5
done
