export default function ResultCard({ output, confidence }) {
  const isReal = output.toUpperCase() === 'REAL';
  const color = isReal ? 'var(--real)' : 'var(--fake)';
  
  return (
    <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <h3 style={{ color: 'white', marginBottom: '1rem' }}>Analysis Verdict</h3>
      <div style={{ fontSize: '3rem', fontWeight: 'bold', color: color, marginBottom: '0.5rem', letterSpacing: '2px' }}>
        {output.toUpperCase()}
      </div>
      <div style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>
        Confidence: <span style={{ color: 'white', fontWeight: 'bold' }}>{confidence.toFixed(2)}%</span>
      </div>
    </div>
  );
}
