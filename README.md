# 🧠 Stakeholder Mind Reader

*"Know your stakeholder better than they know themselves."*

A full-stack web app that reads your stakeholder's real communication patterns from Slack, Zoom, and Google Drive — and rewrites your message in the exact style that works for them.

Built at the Intuit Hackathon 2026.

---

## What It Does

1. **Type a name** — Claude searches Slack, Zoom transcripts, and Google Drive for real data
2. **Get their profile in ~2 minutes** — communication style, what to lean into, what to avoid, real quotes from their actual messages
3. **Paste your draft** — Claude rewrites it perfectly tailored for that person, instantly
4. **View deep analysis** — full psychological profile on demand

No fake data. Everything comes from real Slack/Zoom/Drive evidence via live MCP connectors.

---

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **AI**: Claude Code CLI with Intuit enterprise OAuth
- **Data sources**: Slack, Zoom, Google Drive via MCP connectors
- **Streaming**: Server-Sent Events (SSE) with file-polling job queue

---

## How to Run

### Prerequisites
- WSL (Windows Subsystem for Linux)
- Node.js v18+ via NVM in WSL
- Claude Code CLI installed and logged in with Intuit enterprise OAuth
- MCP connectors configured for Slack, Zoom, and Google Drive

> **Note:** This app requires Intuit's internal Claude Code setup with enterprise OAuth and MCP connectors. It is not plug-and-play for external users — it runs on your own Intuit-connected machine.

### Start

```bash
git clone https://github.com/omerocak-svg/stakeholder-mindreader
cd stakeholder-mindreader
bash start.sh
```

Open **http://localhost:5173** in your browser.

`start.sh` starts the Express server, the Claude worker, and the Vite dev server together.

---

## Architecture

```
Browser (React)
    ↕ SSE streaming
Express Server (Node.js)
    ↕ writes .prompt files
Worker (bash)
    ↕ pipes to Claude CLI
Claude Code + MCP connectors (Slack, Zoom, Drive)
```

The server writes prompt files to `/tmp/mindreader-jobs/`. The bash worker picks them up, runs `claude --dangerously-skip-permissions`, and streams output back. The server polls for output every 500ms and forwards tokens to the UI via SSE.

---

## Privacy

All analysis happens locally on your machine via your own connected accounts. Profiles are saved to `.claude/profiles/` — nothing is sent to external servers.

---

*Intuit Hackathon 2026 — Omer Ocak*
