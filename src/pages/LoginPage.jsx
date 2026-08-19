import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import ParticleBackground from '../components/ParticleBackground';
import './LoginPage.css';

export default function LoginPage() {
  const [username, setUsername]   = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const { loginPeserta, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const result = await loginPeserta(username.trim(), password);
    if (result.success) navigate('/dashboard');
  };

  return (
    <div className="login-page">
      {/* Left visual panel */}
      <div className="login-visual">
        <ParticleBackground />
        <div className="login-visual__gradient" />
        <div className="login-visual__content">
          <Link to="/" className="login-visual__logo">
            <div className="login-visual__logo-img">
              <img src="/rela.jpg" alt="SHF Logo" />
            </div>
            <div>
              <div className="login-visual__logo-main">SHF</div>
              <div className="login-visual__logo-sub">SMADA Hadrah Festival</div>
            </div>
          </Link>

          <div className="login-visual__hero">
            <h2 className="text-headline" style={{ color: '#fff' }}>
              Selamat Datang<br />
              <span className="gradient-text">Peserta SHF 2026</span>
            </h2>
            <p style={{ color: 'rgba(167,243,208,0.7)', marginTop: 16, fontSize: '0.9375rem', lineHeight: 1.7 }}>
              Login menggunakan username dan password yang telah diberikan oleh panitia SHF. Hubungi panitia jika belum memiliki akun.
            </p>
          </div>

          <div className="login-visual__features">
            {[
              'Nilai tampil segera setelah dinilai',
              'QR Code pribadi untuk akses cepat',
              'Catatan langsung dari Dewan Juri',
            ].map((f, i) => (
              <div key={i} className="login-visual__feature">
                <div className="login-visual__feature-dot" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="login-form-panel">
        <div className="login-form-container">
          <div className="login-form-header">
            <h1 className="text-title">Login Peserta</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 8 }}>
              Masukkan username dan password yang diberikan panitia.
            </p>
          </div>

          {error && (
            <div className="login-error" role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label" htmlFor="username">Username</label>
              <div className="input-with-icon">
                <User size={16} className="input-icon" />
                <input
                  id="username"
                  type="text"
                  className="input-field"
                  placeholder="smada_hadrah_1"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="password">Password</label>
              <div className="input-with-icon" style={{ position: 'relative' }}>
                <Lock size={16} className="input-icon" />
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  className="login-pass-toggle"
                  onClick={() => setShowPass(v => !v)}
                  aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              id="btn-login-peserta"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            >
              {loading ? (
                <>
                  <span className="login-spinner" />
                  Memverifikasi...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Masuk
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <Link to="/" className="btn btn-ghost btn-sm" style={{ color: 'var(--text-muted)' }}>
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
