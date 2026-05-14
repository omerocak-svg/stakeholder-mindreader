---
description: Rewrite a document tailored specifically for a stakeholder based on their Mind Reader profile
argument-hint: "[stakeholder name] [path/to/document.md]"
allowed-tools: Read, Write, Bash
---

# Tailor Document for Stakeholder

Parse the arguments: the first part (before the last space-separated path) is the stakeholder name, and the last part is the document path.

Stakeholder + document: $ARGUMENTS

## Step 1: Load the Profile

Say: "📂 Loading Mind Reader profile for [stakeholder name]..."

Read the profile from `.claude/profiles/[stakeholder name].md`

If the profile doesn't exist, say: "❌ No profile found for [name]. Run `/mindreader "[name]"` first to build their profile." And stop.

## Step 2: Read the Original Document

Say: "📄 Reading your original document..."

Read the document at the provided path. Understand its purpose, key messages, and structure.

## Step 3: Analyze the Gap

Think out loud: "🧠 Now comparing what this doc says vs. what [stakeholder] needs to hear..."

Identify:

- What sections will resonate with them (based on their hot buttons)
- What sections will make them disengage (based on their cold buttons)
- What's missing that they'll immediately ask for
- What's included that wastes their time
- Whether the opening hook matches how they like to receive information

## Step 4: Rewrite

Produce TWO outputs:

### OUTPUT A: COACHING NOTES

A short advisory to the author before they read the rewrite:

```
╔══════════════════════════════════════════════════════════════╗
║   🎯 TAILORING NOTES FOR [STAKEHOLDER NAME]                  ║
╚══════════════════════════════════════════════════════════════╝

WHAT YOU DID WELL (keep these):
✓ [observation]
✓ [observation]

WHAT NEEDED TO CHANGE (and why):
⚠ [change made] → Because [stakeholder] [evidence from profile]
⚠ [change made] → Because [stakeholder] [evidence from profile]
⚠ [change made] → Because [stakeholder] [evidence from profile]

THE ONE THING THAT WILL MAKE OR BREAK THIS:
→ [Most critical insight from their profile]

PREDICTED REACTION IF YOU SEND THIS VERSION:
"[Simulate how stakeholder will respond — what they'll say or do]"
```

### OUTPUT B: THE REWRITTEN DOCUMENT

The full document rewritten for this stakeholder. Maintain all the original facts and decisions, but:

- Restructure the opening to match their preferred entry point
- Adjust vocabulary to match their signature phrases
- Lead with what they care about most (from their core values)
- Remove or de-emphasize what triggers their cold buttons
- Add the specific evidence type they need to say yes (data? customer quotes? competitive intel?)
- Match their preferred format (bullets vs. narrative, short vs. detailed)
- End with a call to action framed in language they respond to

Mark every change with a subtle inline note like: `[← reframed for [name]: reason]`

## Step 5: Save

Save the tailored version to `[original-filename]-for-[stakeholder].md`

Tell the user: "✅ Done! Tailored version saved as [filename]. The coaching notes above explain every change and the reasoning behind it."
