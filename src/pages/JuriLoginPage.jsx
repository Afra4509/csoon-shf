import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import './JuriLoginPage.css';

export default function JuriLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { loginJuri, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const result = await loginJuri(username, password);
    if (result.success) navigate('/juri');
  };

  return (
    <div className="juri-login-page">
      <div className="juri-login-bg" />

      <div className="juri-login-card glass-card-strong animate-scale-in">
        <div className="juri-login-icon">
          <ShieldCheck size={32} />
        </div>

        <div className="juri-login-header">
          <h1 className="text-title">Panel Juri</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 6 }}>
            Masuk menggunakan akun juri yang telah dibuat oleh admin.
          </p>
        </div>

        {error && (
          <div className="login-error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="input-group">
            <label className="input-label" htmlFor="juri-username">Username Juri</label>
            <div className="input-with-icon">
              <User size={16} className="input-icon" />
              <input
                id="juri-username"
                type="text"
                className="input-field"
                placeholder="contoh: juri1"
                value={username}
                onChange={e => setUsername(e.target.value.replace(/\s+/g, ''))}
                autoFocus
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="juri-password">Password</label>
            <div className="input-with-icon">
              <Lock size={16} className="input-icon" />
              <input
                id="juri-password"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            id="btn-juri-login"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {loading ? (
              <><span className="login-spinner" />Memverifikasi...</>
            ) : (
              <>Masuk sebagai Juri</>
            )}
          </button>
        </form>

        <div className="juri-login-links">
          <Link to="/login" className="btn btn-ghost btn-sm">Login Peserta</Link>
          <span style={{ color: 'var(--border-default)' }}>·</span>
          <Link to="/" className="btn btn-ghost btn-sm">Beranda</Link>
        </div>
      </div>
    </div>
  );
}
