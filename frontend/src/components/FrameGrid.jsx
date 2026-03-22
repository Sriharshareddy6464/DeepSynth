export default function FrameGrid({ frames }) {
  return (
    <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
      <h3 style={{ color: 'white', marginBottom: '1rem', textAlign: 'center' }}>Analyzed Frames</h3>
      <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem' }}>Key frames extracted and analyzed for manipulation patterns</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        {frames.map((frame, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', transition: 'transform 0.3s', cursor: 'pointer' }}
               onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
               onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>
            <img src={`/api/static/frames/${frame}`} alt={`Frame ${i+1}`} style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block' }} />
            <div style={{ padding: '0.75rem', textAlign: 'center', background: 'var(--bg-card)' }}>
              <span style={{ color: 'var(--accent)', fontSize: '0.9rem', fontWeight: 'bold' }}>Frame {i + 1}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
