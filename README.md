# 🧠 Stakeholder Mind Reader

*"Know your stakeholder better than they know themselves."*

A Claude Code tool that autonomously hunts across **Slack, Gmail, Zoom, and Google Drive** to build a deep psychological and professional profile of any stakeholder — then rewrites your documents in a version perfectly tailored for them.

## Prerequisites

- Claude Code installed (`npm install -g @anthropic-ai/claude-code`)
- Connected MCP servers: Slack, Gmail, Google Drive, Zoom
- A Claude Max or Pro subscription

## Setup (30 seconds)

```bash
# Clone this project
git clone <repo> stakeholder-mindreader
cd stakeholder-mindreader

# Launch Claude Code
claude
```

That's it. The MCP connections and slash commands are pre-configured.

## Usage

### Step 1: Build the profile

```
/mindreader "Sarabjeet Chugh"
```

Watch Claude Code **think out loud** as it:

- 🔍 Searches Slack for Sarabjeet's messages and threads
- 📧 Pulls Gmail threads he's written or responded to
- 🎙️ Scans Zoom transcripts from meetings he attended
- 📁 Finds Google Drive docs he authored or commented on

Then synthesizes everything into a **full stakeholder profile**.

### Step 2: Tailor any document

```
/tailor-for "Sarabjeet Chugh" my-prd.md
```

Claude reads your PRD, loads Sarabjeet's profile, and returns:

1. **Coaching notes** — what you did well, what changed and why, predicted reaction
2. **Rewritten document** — same facts, completely restructured for Sarabjeet

## Output Structure

```
.claude/
  profiles/
    Sarabjeet Chugh.md     ← saved stakeholder profile
  commands/
    mindreader.md          ← /mindreader command
    tailor-for.md          ← /tailor-for command
  settings.json            ← MCP server config
CLAUDE.md                  ← project context
```

## What's in a Profile

| Section | What it tells you |
|:-------:|:-----------------:|
| 🎯 One-Liner | Their essence as a stakeholder in one sentence |
| 🔑 Core Values | What they actually care about, with evidence |
| 🗣️ Communication Style | Format, tone, length preferences |
| 🔥 Hot Buttons | Topics that make them lean in |
| ❄️ Cold Buttons | Topics that make them disengage |
| ✅ Decision Triggers | What conditions unlock a "yes" |
| 🚩 Silent Red Flags | What they hate but won't say |
| 📝 How to Write for Them | Specific DOs and DON'Ts |
| 🎭 Pre-Meeting Briefing | What to expect in your next meeting |

## Privacy Note

This tool only accesses communications through **your own connected accounts**. All analysis happens locally via Claude Code — nothing is stored externally. Profiles are saved only to your local `.claude/profiles/` directory.

---

*Built for the Intuit Hackathon 2026*
