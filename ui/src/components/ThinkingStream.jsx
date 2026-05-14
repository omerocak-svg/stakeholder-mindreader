import { useEffect, useRef } from 'react';

const SOURCE_COLORS = {
  'Slack': '#4A154B',
  'Gmail': '#EA4335',
  'Zoom': '#2D8CFF',
  'Drive': '#34A853',
};

function colorize(text) {
  // Highlight source badges
  return text
    .replace(/🔍[^\n]*/g, m => `<span style="color:#a78bfa">${m}</span>`)
    .replace(/📧[^\n]*/g, m => `<span style="color:#f87171">${m}</span>`)
    .replace(/🎙️[^\n]*/g, m => `<span style="color:#60a5fa">${m}</span>`)
    .replace(/📁[^\n]*/g, m => `<span style="color:#4ade80">${m}</span>`)
    .replace(/╔[═╗╚╝║─━]+[^\n]*/g, m => `<span style="color:#7c6af7;font-weight:600">${m}</span>`)
    .replace(/━{3,}/g, m => `<span style="color:#2a2a3e">${m}</span>`)
    .replace(/(🎯|🔑|🗣️|🔥|❄️|✅|🚩|📝|🎭|📊)[^\n]*/g, m => `<span style="color:#f6c90e;font-weight:600">${m}</span>`)
    .replace(/✓[^\n]*/g, m => `<span style="color:#56cfb2">${m}</span>`)
    .replace(/✗[^\n]*/g, m => `<span style="color:#f56565">${m}</span>`)
    .replace(/⚠[^\n]*/g, m => `<span style="color:#f6c90e">${m}</span>`)
    .replace(/Evidence: "([^"]+)"/g, (_, q) => `Evidence: <span style="color:#e2e8f0;font-style:italic">"${q}"</span>`);
}

export default function ThinkingStream({ tokens, isLive }) {
  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const userScrolledRef = useRef(false);

  useEffect(() => {
    if (!userScrolledRef.current && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [tokens]);

  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    userScrolledRef.current = !atBottom;
  }

  const html = colorize(tokens.replace(/</g, '&lt;').replace(/>/g, '&gt;'));

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        flex: 1,
        overflow: 'auto',
        padding: '24px 32px',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 16, color: 'var(--text-muted)', fontSize: 12,
        textTransform: 'uppercase', letterSpacing: 1,
      }}>
        {isLive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'pulse 1.4s ease infinite' }} />}
        {isLive ? 'Thinking out loud...' : 'Analysis log'}
      </div>

      <pre
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 13,
          lineHeight: 1.7,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          color: 'var(--text)',
        }}
        dangerouslySetInnerHTML={{ __html: html || ' ' }}
      />

      {isLive && (
        <span style={{
          display: 'inline-block', width: 8, height: 16,
          background: 'var(--accent)', marginLeft: 2,
          animation: 'blink 1s step-end infinite',
          verticalAlign: 'text-bottom',
        }} />
      )}

      <div ref={bottomRef} />

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
}
