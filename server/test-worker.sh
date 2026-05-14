#!/bin/bash
# Quick test: drops a test job and watches for output
JOBS_DIR="/tmp/mindreader-jobs"
mkdir -p "$JOBS_DIR"

jobId="test-$(date +%s)"
promptFile="$JOBS_DIR/${jobId}.prompt"
outputFile="$JOBS_DIR/${jobId}.output"
doneFile="$JOBS_DIR/${jobId}.done"

echo "Say hello in exactly 3 words." > "$promptFile"
echo "Test job written: $jobId"
echo "Waiting for worker to process..."

for i in $(seq 1 60); do
  sleep 1
  if [ -f "$outputFile" ]; then
    echo "Output so far:"
    cat "$outputFile"
  fi
  if [ -f "$doneFile" ]; then
    echo ""
    echo "✓ Done! Worker is working correctly."
    exit 0
  fi
done

echo "✗ Timeout — is worker.sh running?"
