export default function AnalysisDetails({ framesCount, time, confidence }) {
  const details = [
    { label: 'FRAMES ANALYZED', value: framesCount },
    { label: 'PROCESSING TIME', value: `${time}s` },
    { label: 'MODEL CONFIDENCE', value: `${confidence.toFixed(2)}%` }
  ];

  return (
    <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
      <h3 style={{ color: 'white', marginBottom: '1.5rem', textAlign: 'center' }}>Analysis Details</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        {details.map((d, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ color: 'var(--accent)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 'bold', letterSpacing: '1px' }}>{d.label}</div>
            <div style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>{d.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
