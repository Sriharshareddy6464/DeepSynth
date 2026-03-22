export default function FeatureCards() {
  const cards = [
    { title: 'HIGH ACCURACY', desc: 'Our advanced AI model achieves industry-leading accuracy in detecting manipulated images and videos.' },
    { title: 'REAL-TIME ANALYSIS', desc: 'Get instant results with our efficient processing system and detailed confidence scores.' },
    { title: 'USER-FRIENDLY', desc: 'Simple upload process and clear visualization of results make detection accessible to everyone.' }
  ];

  return (
    <section style={{ background: '#111111', padding: '4rem 2rem' }}>
      <h2 style={{ textAlign: 'center', color: 'var(--accent)', fontSize: '2rem', marginBottom: '3rem', fontWeight: 'bold' }}>
        KEY FEATURES
      </h2>
      <div style={{ display: 'flex', gap: '2rem', maxWidth: '1200px', margin: '0 auto', flexWrap: 'wrap' }}>
        {cards.map((c, i) => (
          <div key={i} style={{
            flex: 1, minWidth: '300px', background: '#1a2332', borderRadius: '12px', padding: '2.5rem 2rem',
            border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}>
            <h3 style={{ color: 'var(--accent)', marginBottom: '1.5rem', fontSize: '1.25rem', letterSpacing: '0.5px' }}>{c.title}</h3>
            <p style={{ color: 'var(--text-primary)', lineHeight: '1.6', fontSize: '0.95rem' }}>{c.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
