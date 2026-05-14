# 🧠 Stakeholder Mind Reader

*"Know your stakeholder better than they know themselves."*

A tool that autonomously hunts across **Slack, Zoom, and Google Drive** to build a deep psychological and professional profile of any stakeholder — then rewrites your message in a version perfectly tailored for them.

## Prerequisites

- Claude Code installed (`npm install -g @anthropic-ai/claude-code`)
- Connected MCP servers: Slack, Google Drive, Zoom
- Intuit enterprise OAuth (Claude Code)

## Setup

```bash
git clone https://github.com/omerocak-svg/stakeholder-mindreader
cd stakeholder-mindreader
bash start.sh
```

Open http://localhost:5173

## How It Works

1. **Type a stakeholder's name** — Claude searches Slack, Zoom, Drive for real data
2. **Get their profile** — communication style, what to lean into, what to avoid, real quotes
3. **Paste your draft** — Claude rewrites it perfectly tailored for that person

## Output Structure

```
.claude/
  profiles/
    [Name].md     ← saved stakeholder profile
```

## Privacy Note

This tool only accesses communications through **your own connected accounts**. All analysis happens locally via Claude Code — nothing is stored externally. Profiles are saved only to your local `.claude/profiles/` directory.

---

*Built for the Intuit Hackathon 2026*
