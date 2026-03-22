import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function ConfidencePieChart({ confidence }) {
  const data = [
    { name: 'Fake', value: confidence },
    { name: 'Real', value: 100 - confidence }
  ];
  const COLORS = ['var(--fake)', 'var(--real)'];

  return (
    <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
      <h3 style={{ color: 'white', marginBottom: '1rem', textAlign: 'center' }}>Confidence Overview</h3>
      <div style={{ height: '250px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }} itemStyle={{ color: 'white' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', background: 'var(--fake)', borderRadius: '50%' }}></div>
          <span style={{ color: 'var(--text-muted)' }}>Fake</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', background: 'var(--real)', borderRadius: '50%' }}></div>
          <span style={{ color: 'var(--text-muted)' }}>Real</span>
        </div>
      </div>
    </div>
  );
}
