import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

const roleCredentials = {
  librarian: { username: 'libuser', password: 'Pass1234!' },
  member: { username: 'memberuser', password: 'Pass1234!' },
};

export default function Login() {
  const [selectedRole, setSelectedRole] = useState('librarian');
  const [username, setUsername] = useState(roleCredentials.librarian.username);
  const [password, setPassword] = useState(roleCredentials.librarian.password);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const credentials = roleCredentials[selectedRole];
    setUsername(credentials.username);
    setPassword(credentials.password);
    setError('');
  }, [selectedRole]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const user = await login(username, password);
      navigate(user?.role === 'librarian' ? '/' : '/issues');
    } catch (err) {
      setError('Invalid credentials, please try again.');
    }
  };

  return (
    <div style={{ maxWidth: 460, margin: '4rem auto', padding: 24, background: '#fff', borderRadius: 12, boxShadow: '0 10px 30px rgba(15,23,42,0.08)' }}>
      <h1 style={{ marginBottom: 8 }}>Library Management</h1>
      <p style={{ marginTop: 0, marginBottom: 16, color: '#4b5563' }}>Choose how you want to sign in.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <button
          type="button"
          onClick={() => setSelectedRole('librarian')}
          style={{
            padding: 14,
            borderRadius: 10,
            border: selectedRole === 'librarian' ? '2px solid #2563eb' : '1px solid #d1d5db',
            background: selectedRole === 'librarian' ? '#eff6ff' : '#fff',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <strong>Login as Librarian</strong>
          <div style={{ fontSize: 13, color: '#4b5563', marginTop: 4 }}>Manage books, members, and resolve issues</div>
        </button>
        <button
          type="button"
          onClick={() => setSelectedRole('member')}
          style={{
            padding: 14,
            borderRadius: 10,
            border: selectedRole === 'member' ? '2px solid #2563eb' : '1px solid #d1d5db',
            background: selectedRole === 'member' ? '#eff6ff' : '#fff',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <strong>Login as Member</strong>
          <div style={{ fontSize: 13, color: '#4b5563', marginTop: 4 }}>Raise and track your issue requests</div>
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: 12 }}>
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ width: '100%', padding: 10, marginTop: 6, borderRadius: 8, border: '1px solid #d1d5db' }}
          />
        </label>
        <label style={{ display: 'block', marginBottom: 12 }}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: 10, marginTop: 6, borderRadius: 8, border: '1px solid #d1d5db' }}
          />
        </label>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
          Demo credentials: {selectedRole === 'librarian' ? 'libuser / Pass1234!' : 'memberuser / Pass1234!'}
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" style={{ width: '100%', padding: 12, border: 'none', background: '#2563eb', color: '#fff', borderRadius: 8, fontSize: 16 }}>Sign in</button>
      </form>
    </div>
  );
}
