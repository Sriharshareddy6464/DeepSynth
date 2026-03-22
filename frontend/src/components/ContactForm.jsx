export default function ContactForm() {
  return (
    <section style={{ background: 'var(--bg-primary)', padding: '6rem 2rem', textAlign: 'center' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ color: 'var(--accent)', fontSize: '2.5rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          CONTACT US
        </h2>
        <div style={{ width: '80px', height: '3px', background: 'var(--accent)', margin: '0 auto 2rem auto' }}></div>
        <p style={{ color: 'var(--text-muted)', marginBottom: '3rem', fontSize: '1.05rem' }}>
          Have questions or feedback? We'd love to hear from you. Get in touch with our team using the form below.
        </p>
        
        <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <input type="text" placeholder="Your Name" style={{
            width: '100%', padding: '1.2rem', borderRadius: '8px', border: 'none', background: 'white', color: 'black', fontSize: '1rem'
          }} />
          <input type="email" placeholder="Your Email" style={{
            width: '100%', padding: '1.2rem', borderRadius: '8px', border: 'none', background: 'white', color: 'black', fontSize: '1rem'
          }} />
          <textarea placeholder="Your Message" rows="6" style={{
            width: '100%', padding: '1.2rem', borderRadius: '8px', border: 'none', background: 'white', color: 'black', resize: 'vertical', fontSize: '1rem'
          }}></textarea>
          
          <button type="button" style={{
            background: 'var(--accent)', color: 'var(--bg-primary)', padding: '1.2rem 2.5rem',
            borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer',
            alignSelf: 'flex-start', marginTop: '1rem', letterSpacing: '1px'
          }}>
            SEND MESSAGE
          </button>
        </form>
      </div>
    </section>
  );
}
