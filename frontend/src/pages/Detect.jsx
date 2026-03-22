import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyzeVideo } from '../api/detect';
import { logout } from '../api/auth';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Detect() {
  const [state, setState] = useState('upload'); // 'upload' | 'analyzing' | 'results'
  const [file, setFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.size > 100 * 1024 * 1024) {
        alert('File size exceeds 100MB limit');
        return;
      }
      setFile(selected);
      setVideoUrl(URL.createObjectURL(selected));
      setState('upload');
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setState('analyzing');
    try {
      const data = await analyzeVideo(file);
      if (data.success) {
        setResult(data);
        setState('results');
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (err) {
      setState('upload');
      alert('Analysis failed. Try again.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Custom Detect Navbar */}
      <nav style={{ background: 'rgba(26, 26, 26, 0.95)', backdropFilter: 'blur(10px)', width: '100%', position: 'fixed', top: 0, height: '90px', zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ color: '#64ffda', fontSize: '1.5rem', fontWeight: 'bold' }}>DeepFake Detection</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <button style={{ background: 'rgba(100, 255, 218, 0.1)', color: '#64ffda', border: '1px solid #64ffda', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Detect</button>
          <button onClick={handleLogout} style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>Logout</button>
        </div>
      </nav>

      <main style={{ flex: 1, paddingTop: '130px', paddingBottom: '4rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ color: '#64ffda', fontSize: '3rem', marginBottom: '1rem', fontWeight: 'bold' }}>Detect DeepFakes</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Upload your file for AI-powered analysis to detect potential manipulation.</p>
        </div>

        {/* Upload Card */}
        <div style={{ background: '#0d1b2a', padding: '3rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
          <label style={{ border: '2px dashed #64ffda', borderRadius: '12px', padding: '2rem 3rem', cursor: 'pointer', textAlign: 'center', background: 'transparent', color: '#64ffda', fontSize: '1.2rem', width: '100%', maxWidth: '500px', transition: 'all 0.3s' }}>
            {file ? file.name : 'Choose your file'}
            <input type="file" accept=".mp4,.avi,.mov,.png,.jpg,.jpeg" onChange={handleFileChange} style={{ display: 'none' }} />
          </label>

          {videoUrl && (
            <div style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
              <video src={videoUrl} controls style={{ width: '100%', display: 'block', maxHeight: '400px' }} />
            </div>
          )}

          {state === 'analyzing' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ width: '40px', height: '40px', border: '4px solid rgba(100,255,218,0.2)', borderTopColor: '#64ffda', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <p style={{ color: '#64ffda', fontWeight: '600', fontSize: '1.1rem' }}>Analyzing video...</p>
              <button disabled style={{ background: '#334155', color: '#94a3b8', padding: '1rem 3rem', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'not-allowed' }}>Analyze</button>
              <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
            <button onClick={handleAnalyze} disabled={!file} style={{ background: file ? '#64ffda' : '#334155', color: file ? '#0d1b2a' : '#94a3b8', padding: '1rem 3rem', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '1.1rem', cursor: file ? 'pointer' : 'not-allowed', marginTop: '1rem' }}>
              Analyze
            </button>
          )}

          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '1rem' }}>Supported formats: MP4, AVI, MOV, PNG, JPEG (Max size: 100MB)</p>
        </div>

        {/* RESULTS SECTION */}
        {state === 'results' && result && (
          <div style={{ marginTop: '5rem', display: 'flex', flexDirection: 'column', gap: '4rem' }}>

            {/* Section 1: Verdict & Pie Chart */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div style={{ background: '#0d1b2a', padding: '2.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                <h3 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 'normal' }}>Analysis Result</h3>
                <div style={{ fontSize: '4rem', fontWeight: 'bold', color: result.output === 'REAL' ? '#64ffda' : '#ef4444', marginBottom: '0.5rem', letterSpacing: '2px' }}>
                  {result.output}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>
                  Confidence: <span style={{ color: 'white', fontWeight: '600' }}>{result.confidence.toFixed(2)}%</span>
                </div>
              </div>

              <div style={{ background: '#0d1b2a', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ color: 'white', marginBottom: '1rem', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'normal' }}>Confidence Distribution</h3>
                <div style={{ height: '200px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[{ name: 'Fake', value: result.output === 'FAKE' ? result.confidence : 100 - result.confidence }, { name: 'Real', value: result.output === 'REAL' ? result.confidence : 100 - result.confidence }]}
                        cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" stroke="none">
                        <Cell key="fake" fill="#ef4444" />
                        <Cell key="real" fill="#64ffda" />
                      </Pie>
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} itemStyle={{ color: 'white' }} />
                      <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Section 2: Frame Timeline */}
            <div style={{ background: '#0d1b2a', padding: '2.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <h3 style={{ color: '#64ffda', fontSize: '1.8rem', marginBottom: '0.5rem' }}>Frame-by-Frame Analysis</h3>
                <p style={{ color: 'var(--text-muted)' }}>Confidence score for each analyzed frame</p>
              </div>

              {result.frame_scores && result.frame_scores.length > 0 ? (
                <div style={{ height: '350px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={result.frame_scores.map((score, i) => ({ frame: `Frame ${i + 1}`, value: score > 1 ? score : score * 100 }))} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="frame" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                      <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} domain={[0, 100]} label={{ value: 'Confidence (%)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)' }} />
                      <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: 'white' }} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {result.frame_scores.map((score, index) => {
                          const val = score > 1 ? score : score * 100;
                          return <Cell key={`cell-${index}`} fill={val > 50 ? '#64ffda' : '#ef4444'} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Frame analysis coming soon</div>
              )}
            </div>

            {/* Section 3: Analysis Details */}
            <div>
              <h3 style={{ color: 'white', marginBottom: '1.5rem', fontSize: '1.5rem' }}>Analysis Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                <div style={{ background: '#0d1b2a', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ color: '#64ffda', fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '0.5rem' }}>FRAMES ANALYZED</div>
                  <div style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold' }}>{result.frames ? result.frames.length : 20}</div>
                </div>
                <div style={{ background: '#0d1b2a', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ color: '#64ffda', fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '0.5rem' }}>PROCESSING TIME</div>
                  <div style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold' }}>{result.processing_time}s</div>
                </div>
                <div style={{ background: '#0d1b2a', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ color: '#64ffda', fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '0.5rem' }}>MODEL CONFIDENCE</div>
                  <div style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold' }}>{result.confidence.toFixed(2)}%</div>
                </div>
              </div>
            </div>

            {/* Section 4: Analyzed Frames */}
            {result.frames && result.frames.length > 0 && (
              <div style={{ background: '#0d1b2a', padding: '3rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                  <h3 style={{ color: '#64ffda', fontSize: '2rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Analyzed Frames</h3>
                  <p style={{ color: 'var(--text-muted)' }}>Key frames extracted and analyzed for manipulation patterns</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', padding: '16px' }}>
                  {result.frames.map((frame, index) => (
                    <img
                      key={index}
                      src={`http://localhost:10000/static/frames/${frame}`}
                      alt={`Frame ${index + 1}`}
                      style={{
                        width: '100%',
                        borderRadius: '8px',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </main>

      {/* Footer Matching Image 3 */}
      <footer style={{ background: '#0d1b2a', padding: '4rem 2rem', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 'auto' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4rem' }}>
          <div>
            <h4 style={{ color: '#64ffda', fontSize: '1.2rem', marginBottom: '1.5rem' }}>About Us</h4>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>We are dedicated to detecting and preventing deepfakes using advanced AI technology.</p>
          </div>
          <div>
            <h4 style={{ color: '#64ffda', fontSize: '1.2rem', marginBottom: '1.5rem' }}>Contact</h4>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>22835a0502@gniindia.org</p>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>22831a0503@gniindia.org</p>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>22831a0541@gniindia.org</p>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Guru Nanak Institute of Technology, Ibrahimpatnam</p>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Hyderabad, Telangana, India</p>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Bharat Dynamic Limited , Hyderabad ,Telangana, India </p>
            <a href="https://github.com/Sriharshareddy6464/DeepSynth" style={{ color: '#64ffda', textDecoration: 'none' }}> GitHub </a>
          </div>
          <div>
            <h4 style={{ color: '#64ffda', fontSize: '1.2rem', marginBottom: '1.5rem' }}>Legal</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy Policy</a>
              <a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms of Service</a>
              <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>© 2025 Bharat Dynamic Limited</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
