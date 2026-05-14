import { useState } from 'react';

export default function ProfileCard({ profile, analysisLog }) {
  const [message, setMessage] = useState('');
  const [tailored, setTailored] = useState(null);
  const [tailoring, setTailoring] = useState(false);
  const [showDeep, setShowDeep] = useState(false);
  const [deepContent, setDeepContent] = useState('');
  const [deepLoading, setDeepLoading] = useState(false);

  const lines = profile.content.replace(/\r/g, '').split('\n').filter(l => l.trim());
  const get = (key) => {
    const line = lines.find(l => l.toUpperCase().startsWith(key + ':'));
    if (!line) return null;
    const colonIdx = line.indexOf(':');
    return colonIdx >= 0 ? line.slice(colonIdx + 1).trim() : null;
  };
  const oneLiner = get('ONE-LINER');
  const style = get('STYLE');
  const leanInto = get('LEAN INTO')?.split('|').map(s => s.trim()).filter(Boolean);
  const avoid = get('AVOID')?.split('|').map(s => s.trim()).filter(Boolean);
  const toGetYes = get('TO GET A YES')?.split('|').map(s => s.trim()).filter(Boolean);
  const theirWords = get('THEIR WORDS');
  const hasStructuredData = oneLiner || style || leanInto?.length || avoid?.length;

  async function handleDeepAnalysis() {
    setShowDeep(true);
    if (deepContent) return; // already generated
    setDeepLoading(true);
    setDeepContent('');
    try {
      const res = await fetch('/api/deep-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profile.name, profile: profile.content }),
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n');
        buffer = parts.pop();
        for (const line of parts) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'token') { fullText += event.text; setDeepContent(fullText); }
            else if (event.type === 'done') setDeepLoading(false);
          } catch {}
        }
      }
      setDeepLoading(false);
    } catch { setDeepLoading(false); }
  }

  async function handleTailor() {
    if (!message.trim()) return;
    setTailoring(true);
    setTailored(null);
    try {
      const res = await fetch('/api/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profile.name, profile: profile.content, message }),
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
            if (event.type === 'token') { fullText += event.text; setTailored(fullText); }
            else if (event.type === 'done') setTailoring(false);
          } catch {}
        }
      }
      setTailoring(false);
    } catch { setTailoring(false); }
  }

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

      {/* Deep analysis full-screen overlay */}
      {showDeep && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 200,
          background: 'var(--bg)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Overlay header */}
          <div style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 12,
            flexShrink: 0, background: 'var(--surface)',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                🔍 Detailed Profile Analysis — {profile.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {deepLoading ? 'Generating deep analysis from Slack data...' : 'Full psychological & communication profile'}
              </div>
            </div>
            <button
              onClick={() => setShowDeep(false)}
              style={{
                padding: '8px 16px', borderRadius: 8,
                border: '1px solid var(--border)', background: 'transparent',
                color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontWeight: 600,
              }}
            >
              ✕ Close
            </button>
          </div>

          {/* Overlay content */}
          <div style={{ flex: 1, overflow: 'auto', padding: '28px 36px' }}>
            {deepLoading && !deepContent && (
              <div style={{ color: 'var(--text-muted)', fontSize: 14, fontStyle: 'italic' }}>
                ⏳ Analyzing {profile.name}'s communication patterns...
              </div>
            )}
            {deepContent ? (
              <div style={{
                fontSize: 14, lineHeight: 1.9, color: 'var(--text)',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                maxWidth: 800,
              }}>
                {deepContent}
                {deepLoading && <span style={{ opacity: 0.4 }}>▌</span>}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Left — quick profile */}
      <div style={{
        width: 280, flexShrink: 0,
        borderRight: '1px solid var(--border)',
        overflow: 'auto', padding: '24px 16px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {/* Deep analysis button — top */}
        <button
          onClick={handleDeepAnalysis}
          style={{
            padding: '10px 14px', borderRadius: 8,
            border: '1px solid var(--accent)', background: 'transparent',
            color: 'var(--accent)', fontSize: 12, cursor: 'pointer',
            fontFamily: 'Inter, sans-serif', textAlign: 'center',
            fontWeight: 600, transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--accent)'; }}
        >
          🔍 View detailed profile analysis
        </button>

        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginTop: 4 }}>
          ⚡ Quick profile summary
        </div>

        {oneLiner && (
          <div style={{
            fontSize: 13, fontWeight: 600, lineHeight: 1.6,
            color: 'var(--text)', padding: '12px 14px',
            background: 'var(--surface)', borderRadius: 10,
            borderLeft: '3px solid var(--accent)',
          }}>
            {oneLiner}
          </div>
        )}

        {hasStructuredData ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {style && <Chip label="Style" value={style} />}
            {leanInto?.length > 0 && <Chip label="🔥 Lean into" value={leanInto.join('\n')} color="var(--green)" />}
            {avoid?.length > 0 && <Chip label="❄️ Avoid" value={avoid.join('\n')} color="var(--red)" />}
            {toGetYes?.length > 0 && <Chip label="✅ To get a yes" value={toGetYes.join('\n')} />}
            {theirWords && (
              <div style={{
                fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic',
                lineHeight: 1.6, padding: '8px 12px',
                background: 'var(--surface)', borderRadius: 8,
              }}>
                {theirWords}
              </div>
            )}
          </div>
        ) : (
          <div style={{
            fontSize: 12, lineHeight: 1.7, color: 'var(--text)',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            background: 'var(--surface)', borderRadius: 8, padding: '12px',
          }}>
            {profile.content}
          </div>
        )}
      </div>

      {/* Right — split: top input, bottom output */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top — compact input area */}
        <div style={{
          flexShrink: 0, padding: '16px 24px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
            ✉️ What do you want to say to {profile.name}?
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Paste your draft or key points..."
              rows={3}
              style={{
                flex: 1, padding: '10px 14px',
                borderRadius: 8, border: '2px solid var(--border)',
                background: 'var(--bg)', color: 'var(--text)',
                fontSize: 13, fontFamily: 'Inter, sans-serif',
                lineHeight: 1.6, resize: 'none', outline: 'none',
                boxSizing: 'border-box', transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button
              onClick={handleTailor}
              disabled={!message.trim() || tailoring}
              style={{
                padding: '10px 18px', borderRadius: 8, border: 'none',
                background: message.trim() && !tailoring ? 'var(--accent)' : 'var(--surface2)',
                color: message.trim() && !tailoring ? '#fff' : 'var(--text-muted)',
                fontSize: 13, fontWeight: 700,
                cursor: message.trim() && !tailoring ? 'pointer' : 'not-allowed',
                fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
                whiteSpace: 'nowrap', alignSelf: 'stretch',
              }}
            >
              {tailoring ? '✍️ Tailoring...' : `✨ Tailor for ${profile.name}`}
            </button>
          </div>
        </div>

        {/* Bottom — tailored output takes all remaining space */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          {!tailored && !tailoring && (
            <div style={{
              height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 12, color: 'var(--text-muted)',
            }}>
              <div style={{ fontSize: 40 }}>✨</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Your tailored message will appear here</div>
              <div style={{ fontSize: 13 }}>Type your draft above and click Tailor</div>
            </div>
          )}

          {tailoring && !tailored && (
            <div style={{
              height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)', fontSize: 14, gap: 10,
            }}>
              <span style={{ fontSize: 20 }}>✍️</span> Tailoring your message for {profile.name}...
            </div>
          )}

          {tailored && (
            <div style={{
              background: 'var(--surface)', borderRadius: 12,
              border: '2px solid var(--green)', overflow: 'hidden',
            }}>
              <div style={{
                padding: '12px 20px', background: 'var(--green)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                  ✨ Tailored for {profile.name}
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(tailored)}
                  style={{
                    padding: '4px 12px', borderRadius: 6,
                    border: '1px solid rgba(255,255,255,0.5)', background: 'transparent',
                    color: '#fff', fontSize: 12, cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif', fontWeight: 600,
                  }}
                >
                  📋 Copy
                </button>
              </div>
              <div style={{
                padding: '20px 24px', fontSize: 14, lineHeight: 1.9,
                color: 'var(--text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {tailored}
                {tailoring && <span style={{ opacity: 0.4 }}>▌</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({ label, value, color }) {
  return (
    <div style={{
      padding: '8px 12px', background: 'var(--surface)',
      borderRadius: 8, fontSize: 12,
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ color: color || 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
        {value}
      </div>
    </div>
  );
}
