import Navbar from '../components/Navbar';
import FeatureCards from '../components/FeatureCards';
import AboutSection from '../components/AboutSection';
import ContactForm from '../components/ContactForm';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ paddingTop: '90px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      
      {/* Hero Section */}
      <section style={{
        minHeight: '60vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        padding: '2rem', background: 'var(--bg-primary)'
      }}>
        <h1 style={{ color: 'var(--accent)', fontSize: '3.5rem', marginBottom: '1.5rem', fontWeight: 'bold', letterSpacing: '-0.5px', textShadow: '0 0 20px rgba(100,255,218,0.2)' }}>
          DeepSynth - DeepFake Detection
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem', maxWidth: '700px', marginBottom: '3rem', lineHeight: '1.6' }}>
          Protect yourself from digital deception with our state-of-the-art deepfake detection technology. Upload your files and get instant analysis powered by advanced AI.
        </p>
        <button onClick={() => navigate('/detect')} style={{
          background: 'var(--accent)', color: 'var(--bg-primary)', padding: '1.2rem 3rem',
          borderRadius: '9999px', border: 'none', fontWeight: 'bold', fontSize: '1.1rem',
          cursor: 'pointer', letterSpacing: '1px', boxShadow: '0 4px 14px 0 rgba(100,255,218,0.39)',
          transition: 'transform 0.2s, box-shadow 0.2s'
        }}>
          GET STARTED
        </button>
      </section>

      <FeatureCards />
      <AboutSection />
      <ContactForm />
      <Footer />
    </div>
  );
}
