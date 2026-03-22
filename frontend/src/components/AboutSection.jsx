export default function AboutSection() {
  return (
    <section style={{
      background: 'linear-gradient(to bottom, #0f172a, #1e3a8a)', 
      padding: '6rem 2rem', textAlign: 'center'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ color: 'var(--accent)', fontSize: '2.5rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          ABOUT OUR TECHNOLOGY
        </h2>
        <div style={{ width: '80px', height: '3px', background: 'var(--accent)', margin: '0 auto 3rem auto' }}></div>
        
        <p style={{ color: 'var(--text-primary)', fontSize: '1.05rem', lineHeight: '1.8', marginBottom: '2rem' }}>
          Our DeepFake Detection system utilizes state-of-the-art deep learning algorithms to analyze videos and identify potential manipulations. We combine advanced facial recognition with temporal analysis to detect inconsistencies that are typical in deepfake videos.
        </p>
        <p style={{ color: 'var(--text-primary)', fontSize: '1.05rem', lineHeight: '1.8' }}>
          Built with privacy and security in mind, our system processes videos locally and provides detailed analysis with confidence scores and visual explanations. We're committed to helping combat the spread of manipulated media by making detection technology accessible to everyone.
        </p>
      </div>
    </section>
  );
}
