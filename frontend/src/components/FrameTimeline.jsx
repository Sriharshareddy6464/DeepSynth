import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

export default function FrameTimeline({ frameScores }) {
  const data = frameScores.map((score, idx) => ({
    frame: `Frame ${idx + 1}`,
    score: score * 100 
  }));

  return (
    <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', gridColumn: '1 / -1' }}>
      <h3 style={{ color: 'white', marginBottom: '1rem', textAlign: 'center' }}>Frame-by-Frame Analysis</h3>
      <div style={{ height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="frame" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} />
            <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} domain={[0, 100]} />
            <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
            <Bar dataKey="score">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.score > 50 ? 'var(--real)' : 'var(--fake)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
