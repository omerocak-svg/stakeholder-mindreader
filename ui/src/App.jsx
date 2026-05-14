import { useState, useRef, useEffect } from 'react';
import SearchBar from './components/SearchBar.jsx';
import ThinkingStream from './components/ThinkingStream.jsx';
import ProfileCard from './components/ProfileCard.jsx';
import Sidebar from './components/Sidebar.jsx';

const STAGES = [
  { icon: '🔍', label: 'Scanning Slack messages & threads', duration: 30 },
  { icon: '🧠', label: 'Building communication profile', duration: 999 },
];

export default function App() {
  const [phase, setPhase] = useState('idle'); // idle | searching | done | error
  const [stakeholderName, setStakeholderName] = useState('');
  const [streamTokens, setStreamTokens] = useState('');
  const [profile, setProfile] = useState(null);
  const [savedProfiles, setSavedProfiles] = useState([]);
  const [stageIndex, setStageIndex] = useState(0);
  const [stageSeconds, setStageSeconds] = useState(0);
  const abortRef = useRef(null);
  const stageTimerRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    fetchSavedProfiles();
  }, []);

  async function fetchSavedProfiles() {
    try {
      const res = await fetch('/api/profiles');
      const names = await res.json();
      setSavedProfiles(names);
    } catch {
      // server may not be up yet
    }
  }

  function startStageTimer() {
    let idx = 0;
    let secs = 0;
    setStageIndex(0);
    setStageSeconds(0);
    if (stageTimerRef.current) clearInterval(stageTimerRef.current);
    stageTimerRef.current = setInterval(() => {
      secs++;
      setStageSeconds(secs);
      if (idx < STAGES.length - 1 && secs >= STAGES[idx].duration) {
        idx++;
        secs = 0;
        setStageIndex(idx);
        setStageSeconds(0);
      }
    }, 1000);
  }

  function stopStageTimer() {
    if (stageTimerRef.current) {
      clearInterval(stageTimerRef.current);
      stageTimerRef.current = null;
    }
  }

  async function handleAnalyze(name) {
    if (abortRef.current) abortRef.current.abort();
    if (pollRef.current) clearInterval(pollRef.current);
    const controller = new AbortController();
    abortRef.current = controller;

    setStakeholderName(name);
    setPhase('searching');
    setStreamTokens('');
    setProfile(null);
    startStageTimer();

    // Poll for profile completion — works even if SSE drops
    const pollInterval = setInterval(async () => {
      try {
        const r = await fetch(`/api/profiles/${encodeURIComponent(name)}`);
        if (r.ok) {
          const data = await r.json();
          clearInterval(pollInterval);
          pollRef.current = null;
          stopStageTimer();
          setStreamTokens(data.content);
          setProfile({ name: data.name, content: data.content });
          setPhase('done');
          fetchSavedProfiles();
        }
      } catch {}
    }, 2000);
    pollRef.current = pollInterval;

    // Also keep SSE for streaming tokens to the thinking panel
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
        signal: controller.signal,
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'token') {
              fullText += event.text;
              setStreamTokens(fullText);
            } else if (event.type === 'done') {
              clearInterval(pollInterval);
              if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
              stopStageTimer();
              const finalContent = fullText || event.content || '';
              setStreamTokens(finalContent);
              setProfile({ name: event.name || name, content: finalContent });
              setPhase('done');
              fetchSavedProfiles();
            } else if (event.type === 'error') {
              clearInterval(pollInterval);
              stopStageTimer();
              setPhase('error');
            }
          } catch {}
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') clearInterval(pollInterval);
    }
  }

  async function handleDeleteProfile(name) {
    await fetch(`/api/profiles/${encodeURIComponent(name)}`, { method: 'DELETE' });
    fetchSavedProfiles();
    if (stakeholderName === name) handleReset();
  }

  async function handleLoadProfile(name) {
    const res = await fetch(`/api/profiles/${encodeURIComponent(name)}`);
    const data = await res.json();
    setStakeholderName(data.name);
    setProfile({ name: data.name, content: data.content });
    setStreamTokens(data.content);
    setPhase('done');
  }

  function handleReset() {
    if (abortRef.current) abortRef.current.abort();
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    stopStageTimer();
    setPhase('idle');
    setStakeholderName('');
    setStreamTokens('');
    setProfile(null);
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        profiles={savedProfiles}
        activeProfile={stakeholderName}
        onLoad={handleLoadProfile}
        onNew={handleReset}
        onDelete={handleDeleteProfile}
        onRefresh={(name) => handleAnalyze(name)}
      />

      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--bg)',
      }}>
        {/* Header */}
        <header style={{
          padding: '20px 32px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 24 }}>🧠</span>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
              Stakeholder Mind Reader
            </h1>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Know your stakeholder better than they know themselves
            </p>
          </div>
          {phase !== 'idle' && (
            <button onClick={handleReset} style={btnStyle('ghost')}>
              ← New search
            </button>
          )}
        </header>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {phase === 'idle' && (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 40,
              gap: 32,
            }}>
              <div style={{ textAlign: 'center', maxWidth: 520 }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🧠</div>
                <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
                  Who are you meeting with?
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.6 }}>
                  Enter a stakeholder's name. Claude will hunt through Slack, Gmail, Zoom, and Drive
                  to build their complete psychological profile.
                </p>
              </div>
              <SearchBar onAnalyze={handleAnalyze} />
              <div style={{ display: 'flex', gap: 24, color: 'var(--text-muted)', fontSize: 13 }}>
                {['🔍 Slack', '🎙️ Zoom', '📁 Drive'].map(s => (
                  <span key={s}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {phase === 'searching' && !streamTokens && (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', padding: 40,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 24,
              }}>
                {stakeholderName.charAt(0).toUpperCase()}
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
                Analyzing {stakeholderName}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 40 }}>
                Searching across all your connected sources
              </p>
              <BigStageProgress stageIndex={stageIndex} stageSeconds={stageSeconds} />
            </div>
          )}

          {(phase === 'searching' && streamTokens || phase === 'done') && (
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Name banner */}
              <div style={{
                padding: '16px 32px',
                background: 'var(--surface)',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexShrink: 0,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, color: '#fff',
                }}>
                  {stakeholderName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{stakeholderName}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {phase === 'searching' ? 'Analyzing...' : 'Profile complete'}
                  </div>
                </div>
                {phase === 'done' && (
                  <div style={{ marginLeft: 'auto', color: 'var(--green)', fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span>✅</span> Profile ready
                  </div>
                )}
              </div>

              {/* Main view */}
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
                {phase === 'done' && profile ? (
                  <ProfileCard profile={profile} analysisLog={streamTokens} />
                ) : (
                  <ThinkingStream tokens={streamTokens} isLive={phase === 'searching'} />
                )}
              </div>
            </div>
          )}

          {phase === 'error' && (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 16,
            }}>
              <div style={{ fontSize: 48 }}>⚠️</div>
              <p style={{ color: 'var(--red)', fontSize: 16 }}>Analysis failed. Check your API key and server.</p>
              <button onClick={handleReset} style={btnStyle('primary')}>Try again</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function BigStageProgress({ stageIndex, stageSeconds }) {
  const stage = STAGES[stageIndex];
  const pct = Math.min(99, (stageSeconds / stage.duration) * 100);

  return (
    <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Steps list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {STAGES.map((s, i) => {
          const done = i < stageIndex;
          const active = i === stageIndex;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              opacity: done || active ? 1 : 0.35,
              transition: 'opacity 0.4s',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
                background: done ? 'var(--green)' : active ? 'var(--accent)' : 'var(--surface2)',
                transition: 'background 0.4s',
              }}>
                {done ? '✓' : s.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 14, fontWeight: active ? 600 : 400,
                  color: active ? 'var(--text)' : done ? 'var(--green)' : 'var(--text-muted)',
                }}>
                  {s.label}
                </div>
                {active && (
                  <div style={{ marginTop: 6, height: 4, background: 'var(--surface2)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: 'linear-gradient(90deg, var(--accent), var(--accent2))',
                      borderRadius: 2,
                      transition: 'width 0.9s ease',
                    }} />
                  </div>
                )}
              </div>
              {active && (
                <span style={{ fontSize: 12, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                  {stageSeconds}s
                </span>
              )}
              {done && (
                <span style={{ fontSize: 12, color: 'var(--green)', flexShrink: 0 }}>done</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PulsingDot({ color }) {
  return (
    <span style={{
      width: 8, height: 8, borderRadius: '50%',
      background: color,
      display: 'inline-block',
      animation: 'pulse 1.4s ease-in-out infinite',
    }} />
  );
}

function btnStyle(variant) {
  const base = {
    border: 'none', borderRadius: 8, cursor: 'pointer',
    fontSize: 13, fontWeight: 500, padding: '8px 16px',
    fontFamily: 'Inter, sans-serif', marginLeft: 'auto',
    transition: 'opacity 0.15s',
  };
  if (variant === 'primary') return { ...base, background: 'var(--accent)', color: '#fff' };
  if (variant === 'ghost') return { ...base, background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)' };
  return base;
}
