export default function Footer() {
  return (
    <footer
      style={{
        background: '#111111',
        padding: '3rem 2rem',
        textAlign: 'center',
        borderTop: '1px solid var(--border)',
      }}
    >
      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
        Bharat Dynamics Limited 2025. All rights reserved.
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--accent)', fontSize: '0.95rem' }}>Legacy legal pages archived</span>
        <span style={{ color: 'var(--text-muted)' }}>|</span>
        <span style={{ color: 'var(--accent)', fontSize: '0.95rem' }}>React UI is now the active frontend</span>
      </div>
    </footer>
  );
}
