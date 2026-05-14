import express from 'express';
import cors from 'cors';
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROFILES_DIR = join(__dirname, '..', '.claude', 'profiles');
// FIX: Windows Node resolves /tmp to a Git Bash path, not WSL's /tmp.
// Use the WSL UNC path when running on Windows so the server and worker.sh share the same directory.
const JOBS_DIR = '/tmp/mindreader-jobs';

if (!existsSync(PROFILES_DIR)) mkdirSync(PROFILES_DIR, { recursive: true });
if (!existsSync(JOBS_DIR)) mkdirSync(JOBS_DIR, { recursive: true });
console.log('JOBS_DIR:', JOBS_DIR, '| exists:', existsSync(JOBS_DIR));

const app = express();
app.use(cors());
app.use(express.json());

function sendEvent(res, type, data) {
  res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
}

app.post('/api/analyze', async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const jobId = Date.now().toString();
  const outputFile = join(JOBS_DIR, `${jobId}.output`);
  const doneFile = join(JOBS_DIR, `${jobId}.done`);
  const promptFile = join(JOBS_DIR, `${jobId}.prompt`);

  const prompt = `You are an executive coach at Intuit. Today is ${today}.

Search Slack for "${name}". Do ONE search only, then immediately write the profile. No more searches after that.

Output ONLY this exact format, nothing else:

ONE-LINER: [one sentence about how they operate as a stakeholder]
STYLE: [2-4 words describing their communication style]
LEAN INTO: [topic 1] | [topic 2] | [topic 3]
AVOID: [topic 1] | [topic 2]
TO GET A YES: [condition 1] | [condition 2]
THEIR WORDS: "[real quote]" / "[real quote]"

Under 80 words total. Use only real evidence from the search.`;

  // Write prompt file — worker.sh picks this up and runs claude
  try {
    writeFileSync(promptFile, prompt, 'utf8');
    console.log('✅ Wrote prompt file:', promptFile);
  } catch (e) {
    console.error('❌ Failed to write prompt file:', e.message);
    sendEvent(res, 'error', { message: 'Failed to write job: ' + e.message });
    res.end();
    return;
  }

  // Poll for output
  let lastSize = 0;
  let fullText = '';
  let done = false;
  let waitTicks = 0;

  const heartbeat = setInterval(() => {
    if (!res.writableEnded) sendEvent(res, 'heartbeat', {});
  }, 5000);

  const poll = setInterval(() => {
    try {
      // Check if worker has started (running file)
      const runningFile = join(JOBS_DIR, `${jobId}.running`);

      if (existsSync(outputFile)) {
        const content = readFileSync(outputFile, 'utf8');
        if (content.length > lastSize) {
          const newText = content.slice(lastSize);
          lastSize = content.length;
          fullText += newText;
          sendEvent(res, 'token', { text: newText });
        }
      }

      if (existsSync(doneFile)) {
        clearInterval(poll);
        clearInterval(heartbeat);
        done = true;

        try { unlinkSync(doneFile); } catch {}
        try { unlinkSync(outputFile); } catch {}

        // Strip ANSI escape codes before saving
        const cleanText = fullText.replace(/\x1B\[[0-9;]*[mGKHF]/g, '');
        // Always save profile regardless of connection state
        if (cleanText) {
          const profilePath = join(PROFILES_DIR, `${name}.md`);
          writeFileSync(profilePath, cleanText, 'utf8');
          console.log('✅ Profile saved:', profilePath);
        }
        if (!res.writableEnded) {
          sendEvent(res, 'done', { name, content: cleanText });
          res.end();
        }
      }
    } catch (e) {
      console.error('poll error:', e.message);
    }
  }, 500);

  // Timeout after 10 minutes
  setTimeout(() => {
    if (!done && !res.writableEnded) {
      clearInterval(poll);
      clearInterval(heartbeat);
      // cleanup
      try { unlinkSync(promptFile); } catch {}
      if (fullText) {
        const profilePath = join(PROFILES_DIR, `${name}.md`);
        writeFileSync(profilePath, fullText, 'utf8');
        sendEvent(res, 'done', { name });
      } else {
        sendEvent(res, 'error', { message: 'Timed out. Is worker.sh running in WSL?' });
      }
      res.end();
    }
  }, 600000);

  req.on('close', () => {
    // Don't stop polling — keep watching for done file so profile gets saved
    // even if browser disconnected. UI will poll /api/profiles/:name to pick it up.
    clearInterval(heartbeat);
  });
});

app.post('/api/deep-analyze', async (req, res) => {
  const { name, profile } = req.body;
  if (!name || !profile) return res.status(400).json({ error: 'Missing fields' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const jobId = `deep-${Date.now()}`;
  const outputFile = join(JOBS_DIR, `${jobId}.output`);
  const doneFile = join(JOBS_DIR, `${jobId}.done`);
  const promptFile = join(JOBS_DIR, `${jobId}.prompt`);

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const prompt = `You are an executive coach at Intuit. Today is ${today}.

Search Slack thoroughly for "${name}" — look at multiple threads, DMs, and channels. Also search Zoom meeting transcripts if available.

Write a DETAILED psychological and communication profile. Cover:

## Who They Are
[2-3 paragraphs on their role, personality, and how they operate]

## Communication Style
[How they write, speak, respond. What format do they prefer — bullets, narrative, data-first? How long are their messages? Do they ask questions or make statements?]

## What They Care About Most
[Their actual priorities, not their job description. What do they push back on? What gets them excited?]

## How to Get a Yes
[Specific tactics with examples from real evidence]

## What Annoys Them
[Based on evidence — what makes them short, dismissive, or resistant]

## Their Language Patterns
[Actual phrases, words, vocabulary they use repeatedly. Quote them directly.]

## Meeting With Them
[How to show up in a meeting — come prepared with what? Lead with what?]

Use real evidence from Slack/Zoom. Quote actual messages. Be specific and honest — this is for internal use.`;

  writeFileSync(promptFile, prompt, 'utf8');

  let lastSize = 0;
  let fullText = '';
  let done = false;

  const heartbeat = setInterval(() => {
    if (!res.writableEnded) sendEvent(res, 'heartbeat', {});
  }, 5000);

  const poll = setInterval(() => {
    try {
      if (existsSync(outputFile)) {
        const content = readFileSync(outputFile, 'utf8');
        if (content.length > lastSize) {
          const newText = content.slice(lastSize);
          lastSize = content.length;
          fullText += newText;
          sendEvent(res, 'token', { text: newText });
        }
      }
      if (existsSync(doneFile)) {
        clearInterval(poll);
        clearInterval(heartbeat);
        done = true;
        try { unlinkSync(doneFile); } catch {}
        try { unlinkSync(outputFile); } catch {}
        if (!res.writableEnded) {
          sendEvent(res, 'done', {});
          res.end();
        }
      }
    } catch (e) { console.error('deep poll error:', e.message); }
  }, 500);

  setTimeout(() => {
    if (!done && !res.writableEnded) {
      clearInterval(poll);
      clearInterval(heartbeat);
      sendEvent(res, fullText ? 'done' : 'error', { message: 'Timed out' });
      res.end();
    }
  }, 180000);

  req.on('close', () => {
    clearInterval(poll);
    clearInterval(heartbeat);
    try { unlinkSync(promptFile); } catch {}
  });
});

app.post('/api/tailor', async (req, res) => {
  const { name, profile, message } = req.body;
  if (!name || !profile || !message?.trim()) return res.status(400).json({ error: 'Missing fields' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const jobId = `tailor-${Date.now()}`;
  const outputFile = join(JOBS_DIR, `${jobId}.output`);
  const doneFile = join(JOBS_DIR, `${jobId}.done`);
  const promptFile = join(JOBS_DIR, `${jobId}.prompt`);

  const prompt = `Rewrite this message for ${name} based on their communication style: ${profile}

Message to rewrite: "${message}"

Output ONLY the rewritten message. No score, no explanation, no headers.`;

  writeFileSync(promptFile, prompt, 'utf8');

  let lastSize = 0, fullText = '', done = false;

  const heartbeat = setInterval(() => { if (!res.writableEnded) sendEvent(res, 'heartbeat', {}); }, 5000);

  const poll = setInterval(() => {
    try {
      if (existsSync(outputFile)) {
        const content = readFileSync(outputFile, 'utf8');
        if (content.length > lastSize) {
          const newText = content.slice(lastSize);
          lastSize = content.length;
          fullText += newText;
          sendEvent(res, 'token', { text: newText });
        }
      }
      if (existsSync(doneFile)) {
        clearInterval(poll); clearInterval(heartbeat); done = true;
        try { unlinkSync(doneFile); } catch {}
        try { unlinkSync(outputFile); } catch {}
        if (!res.writableEnded) { sendEvent(res, 'done', {}); res.end(); }
      }
    } catch (e) { console.error('tailor poll error:', e.message); }
  }, 500);

  setTimeout(() => {
    if (!done && !res.writableEnded) {
      clearInterval(poll); clearInterval(heartbeat);
      sendEvent(res, fullText ? 'done' : 'error', { message: 'Timed out' });
      res.end();
    }
  }, 120000);

  req.on('close', () => { clearInterval(heartbeat); });
});

app.get('/api/profiles', (req, res) => {
  try {
    const files = readdirSync(PROFILES_DIR).filter(f => f.endsWith('.md'));
    res.json(files.map(f => f.replace('.md', '')));
  } catch {
    res.json([]);
  }
});

app.delete('/api/profiles/:name', (req, res) => {
  const profilePath = join(PROFILES_DIR, `${req.params.name}.md`);
  try { unlinkSync(profilePath); } catch {}
  res.json({ ok: true });
});

app.get('/api/profiles/:name', (req, res) => {
  const profilePath = join(PROFILES_DIR, `${req.params.name}.md`);
  if (!existsSync(profilePath)) return res.status(404).json({ error: 'Profile not found' });
  res.json({ name: req.params.name, content: readFileSync(profilePath, 'utf8') });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🧠 Mindreader server running on http://localhost:${PORT}`));
