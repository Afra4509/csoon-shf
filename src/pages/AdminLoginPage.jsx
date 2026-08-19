import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import './AdminLoginPage.css';

export default function AdminLoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const { loginAdmin, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const result = await loginAdmin(email, password);
    if (result.success) navigate('/admin');
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-bg" />

      <div className="admin-login-card glass-card-strong animate-scale-in">
        <div className="admin-login-icon">
          <img src="/rela.jpg" alt="SHF Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit', display: 'block' }} />
        </div>

        <div className="admin-login-header">
          <h1 className="text-title">Panel Administrator</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 6 }}>
            Akses terbatas — hanya untuk operator resmi SHF.
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
            <label className="input-label" htmlFor="admin-email">Email Admin</label>
            <div className="input-with-icon">
              <Mail size={16} className="input-icon" />
              <input
                id="admin-email"
                type="email"
                className="input-field"
                placeholder="admin@shf.ac.id"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="admin-password">Password</label>
            <div className="input-with-icon">
              <Lock size={16} className="input-icon" />
              <input
                id="admin-password"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            id="btn-admin-login"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {loading ? (
              <><span className="login-spinner" />Memverifikasi...</>
            ) : (
              <>Masuk sebagai Admin</>
            )}
          </button>
        </form>

        <Link to="/" className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 24, color: 'var(--text-muted)' }}>
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
