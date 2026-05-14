import { useState } from 'react';

export default function SearchBar({ onAnalyze }) {
  const [value, setValue] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const name = value.trim();
    if (name) onAnalyze(name);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 520 }}>
      <input
        autoFocus
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="e.g. John Doe"
        style={{
          flex: 1,
          padding: '14px 20px',
          borderRadius: 12,
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          color: 'var(--text)',
          fontSize: 16,
          fontFamily: 'Inter, sans-serif',
          outline: 'none',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
      <button
        type="submit"
        disabled={!value.trim()}
        style={{
          padding: '14px 28px',
          borderRadius: 12,
          border: 'none',
          background: value.trim() ? 'var(--accent)' : 'var(--surface2)',
          color: value.trim() ? '#fff' : 'var(--text-muted)',
          fontSize: 15,
          fontWeight: 600,
          cursor: value.trim() ? 'pointer' : 'not-allowed',
          fontFamily: 'Inter, sans-serif',
          transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        Read their mind →
      </button>
    </form>
  );
}
