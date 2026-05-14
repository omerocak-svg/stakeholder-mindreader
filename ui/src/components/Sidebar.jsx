import { useState } from 'react';

export default function Sidebar({ profiles, activeProfile, onLoad, onNew, onDelete, onRefresh }) {
  return (
    <aside style={{
      width: 220,
      flexShrink: 0,
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '20px 16px 12px',
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: 1,
      }}>
        Saved Profiles
      </div>

      <button
        onClick={onNew}
        style={{
          margin: '0 12px 8px',
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px dashed var(--border)',
          background: 'transparent',
          color: 'var(--accent)',
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'left',
        }}
      >
        + New analysis
      </button>

      <div style={{ flex: 1, overflow: 'auto', padding: '4px 8px' }}>
        {profiles.length === 0 && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 8px', lineHeight: 1.5 }}>
            No profiles yet. Run your first analysis.
          </p>
        )}
        {profiles.map(name => (
          <ProfileRow
            key={name}
            name={name}
            active={activeProfile === name}
            onLoad={onLoad}
            onDelete={onDelete}
            onRefresh={onRefresh}
          />
        ))}
      </div>

      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        fontSize: 11,
        color: 'var(--text-muted)',
        lineHeight: 1.5,
      }}>
        🔒 Profiles saved locally
      </div>
    </aside>
  );
}

function ProfileRow({ name, active, onLoad, onDelete, onRefresh }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          width: '100%',
          padding: '8px 10px',
          borderRadius: 8,
          background: active ? 'var(--surface2)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          transition: 'background 0.1s',
          cursor: 'pointer',
        }}
        onClick={() => onLoad(name)}
      >
        <span style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>
          {name.charAt(0).toUpperCase()}
        </span>
        <span style={{
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          fontSize: 13, color: active ? 'var(--text)' : 'var(--text-muted)', flex: 1,
        }}>
          {name}
        </span>
        <button
          onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: 16, padding: '0 2px',
            lineHeight: 1, flexShrink: 0,
          }}
        >
          ···
        </button>
      </div>

      {menuOpen && (
        <div style={{
          position: 'absolute', right: 8, top: 36, zIndex: 100,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          overflow: 'hidden', minWidth: 140,
        }}
          onMouseLeave={() => setMenuOpen(false)}
        >
          <MenuItem icon="🔄" label="Re-analyze" onClick={() => { setMenuOpen(false); onRefresh(name); }} />
          <MenuItem icon="🗑️" label="Remove" onClick={() => { setMenuOpen(false); onDelete(name); }} danger />
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', padding: '10px 14px',
        background: 'none', border: 'none',
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 13, cursor: 'pointer',
        color: danger ? 'var(--red)' : 'var(--text)',
        fontFamily: 'Inter, sans-serif',
        textAlign: 'left',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}
    >
      <span>{icon}</span> {label}
    </button>
  );
}
