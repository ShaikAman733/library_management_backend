import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../auth';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const { logout, user } = useAuth();
  const isLibrarian = user?.role === 'librarian';

  useEffect(() => {
    setError('');
    axios.get(`${BASE_URL}/dashboard/`).then((resp) => setStats(resp.data)).catch(() => setError('Unable to load dashboard'));
  }, []);

  if (error) return <div style={{ padding: 24 }}><p>{error}</p></div>;
  if (!stats) return <div style={{ padding: 24 }}>Loading dashboard…</div>;

  return (
    <div style={{ padding: 24 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Dashboard</h1>
          <p>Library overview and issuance summary.</p>
        </div>
        <button onClick={logout} style={{ padding: '10px 16px', background: '#ef4444', border: 'none', color: '#fff', borderRadius: 8 }}>Logout</button>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: 24 }}>
        {[
          { title: 'Total books', value: stats.total_books },
          { title: 'Available books', value: stats.available_books },
          { title: 'Issued books', value: stats.issued_books },
          ...(isLibrarian ? [{ title: 'Members', value: stats.total_members }] : []),
        ].map((item) => (
          <div key={item.title} style={{ padding: 20, background: '#fff', borderRadius: 16, boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }}>
            <p style={{ margin: 0, color: '#6b7280' }}>{item.title}</p>
            <h2 style={{ margin: '10px 0 0' }}>{item.value}</h2>
          </div>
        ))}
      </div>
    </div>
  );
}
