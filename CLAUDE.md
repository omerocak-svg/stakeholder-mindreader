# Stakeholder Mind Reader

## What this project does

This tool analyzes a real person's communication patterns across Slack, Gmail, Zoom meeting transcripts, and Google Drive to build a deep stakeholder profile. It then uses that profile to rewrite any document (PRD, exec update, proposal) in a version tailored specifically for that stakeholder.

## MCP Servers Available

- **Slack** → search messages, threads, DMs involving the stakeholder
- **Gmail** → pull email threads to/from/mentioning the stakeholder
- **Zoom** → retrieve meeting transcripts where stakeholder participated
- **Google Drive** → find docs authored or commented on by the stakeholder

## How to run

```
# Analyze a stakeholder
/mindreader "Omer Ocak"

# After profile is built, tailor a document
/tailor-for "Omer Ocak" path/to/your-doc.md
```

## Output format

All profiles are saved to `.claude/profiles/<name>.md` after analysis.

## Behavioral rules

- Always think out loud as you search — explain which source you're querying and why
- Be specific about evidence: quote actual phrases the person has used
- Never fabricate data — only synthesize what you actually find
- If a source returns no results, say so explicitly and move on
- The profile should feel like something written by someone who has worked closely with this person for years
