import { useState } from 'react';
import { adminLogin, setAdminToken } from '../api';

export default function AdminLogin({ onSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState(null);
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await adminLogin(username, password);
      setAdminToken(data.token);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ width: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 700 }}>law-as-code</div>
          <div style={{ color: 'var(--red)', fontFamily: 'var(--mono)', fontSize: 13, marginTop: 2 }}>
            admin portal
          </div>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Username</label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            {error && <p className="error">{error}</p>}
            <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className="text-muted" style={{ fontSize: 11, marginTop: 12, textAlign: 'center' }}>
            Demo credentials: <code style={{ fontFamily: 'var(--mono)' }}>admin / admin123</code>
          </p>
        </div>
      </div>
    </div>
  );
}
