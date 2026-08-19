import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Moon, Sun, Shield, LogIn } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import './Navbar.css';

export default function Navbar() {
  const [scrolled,   setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme,      setTheme]      = useState(
    () => localStorage.getItem('shf_theme') || 'dark'
  );

  const { user, isAdmin, logout } = useAuthStore();
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('shf_theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const navLinks = [
    { label: 'Beranda', to: '/' },
    { label: 'Penilaian', to: '/#penilaian' },
    { label: 'Galeri', to: '/#galeri' },
    { label: 'Informasi', to: '/#informasi' },
  ];

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''} ${!isHome ? 'navbar--opaque' : ''}`}>
      <div className="navbar__inner">
        {/* Logo */}
        <Link to="/" className="navbar__logo">
          <div className="navbar__logo-icon">
            <img src="/rela.jpg" alt="SMADA Hadrah Festival Logo" />
          </div>
          <div className="navbar__logo-text">
            <span className="navbar__logo-main">SHF</span>
            <span className="navbar__logo-sub">SMADA Hadrah Festival</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="navbar__links">
          {navLinks.map(link => (
            <a key={link.to} href={link.to} className="navbar__link">
              {link.label}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="navbar__actions">
          <button
            className="btn btn-ghost btn-icon navbar__theme-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          >
            {theme === 'dark'
              ? <Sun size={18} />
              : <Moon size={18} />
            }
          </button>

          {user ? (
            <>
              {isAdmin ? (
                <Link to="/admin" className="btn btn-outline btn-sm">
                  <Shield size={15} />
                  Admin Panel
                </Link>
              ) : (
                <Link to="/dashboard" className="btn btn-outline btn-sm">
                  Dashboard
                </Link>
              )}
              <button onClick={logout} className="btn btn-ghost btn-sm">Keluar</button>
            </>
          ) : (
            <>
              <Link to="/admin/login" className="btn btn-ghost btn-sm">
                <Shield size={15} />
                Admin
              </Link>
              <Link to="/login" className="btn btn-primary btn-sm">
                <LogIn size={15} />
                Login Peserta
              </Link>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            className="btn btn-ghost btn-icon navbar__mobile-toggle"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`navbar__mobile ${mobileOpen ? 'navbar__mobile--open' : ''}`}>
        <div className="navbar__mobile-inner">
          {navLinks.map(link => (
            <a key={link.to} href={link.to} className="navbar__mobile-link">
              {link.label}
            </a>
          ))}
          <hr className="divider" style={{ margin: '8px 0' }} />
          {user ? (
            <>
              {isAdmin
                ? <Link to="/admin" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>Admin Panel</Link>
                : <Link to="/dashboard" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>Dashboard</Link>
              }
              <button onClick={logout} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>Keluar</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                <LogIn size={16} /> Login Peserta
              </Link>
              <Link to="/admin/login" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
                <Shield size={16} /> Admin
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
