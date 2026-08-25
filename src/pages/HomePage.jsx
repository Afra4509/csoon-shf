import { Link } from 'react-router-dom';
import { LogIn, ChevronDown, Star, Users, Trophy, Music } from 'lucide-react';
import Navbar from '../components/Navbar';
import ParticleBackground from '../components/ParticleBackground';
import LiveTicker from '../components/LiveTicker';
import GallerySection from '../components/GallerySection';
import SponsorMarquee from '../components/SponsorMarquee';
import { useAuthStore } from '../store/authStore';
import './HomePage.css';

const INFO_CARDS = [
  {
    icon: <Music size={22} />,
    title: 'Kategori SD',
    desc: 'Penilaian 4 aspek: Vokal, Adab & Syair, Musik, dan Penampilan dengan sistem poin Jali & Khafi.',
    color: 'var(--emerald-500)',
  },
  {
    icon: <Star size={22} />,
    title: 'Kategori SMP',
    desc: 'Penilaian 4 aspek: Vokal, Adab & Syair, Musik, dan Penampilan dengan standar yang lebih tinggi.',
    color: 'var(--gold-400)',
  },
  {
    icon: <Users size={22} />,
    title: 'Multi-Juri Realtime',
    desc: 'Nilai dari seluruh juri dirata-rata otomatis. Update langsung setelah peserta turun panggung.',
    color: 'var(--emerald-400)',
  },
  {
    icon: <Trophy size={22} />,
    title: 'Ranking Live',
    desc: 'Ranking peserta dipublikasikan setelah seluruh penilaian selesai. Tampilan proyektor-ready.',
    color: 'var(--emerald-300)',
  },
];

const STATS = [
  { value: '20+', label: 'Peserta Terdaftar' },
  { value: '3',   label: 'Dewan Juri' },
  { value: '2',   label: 'Kategori (SD & SMP)' },
  { value: '4',   label: 'Kriteria Penilaian' },
];

export default function HomePage() {
  const { user } = useAuthStore();

  const getDashboardLink = () => {
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'juri') return '/juri';
    return '/dashboard';
  };

  return (
    <div className="home">
      <Navbar />

      {/* ── Hero ── */}
      <section className="hero">
        <ParticleBackground />
        <div className="hero__gradient" />
        <div className="hero__radial" />

        <div className="container hero__content">
          {/* Badge */}
          <div className="hero__badge animate-fade-in-up" style={{ animationDelay: '0ms' }}>
            <span className="status-dot live" />
            <span>Penilaian Berlangsung — 6 September 2026</span>
          </div>

          {/* Logo mark */}
          <div className="hero__logo-mark animate-fade-in-up" style={{ animationDelay: '80ms' }}>
            <img src="/rela.jpg" alt="SMADA Hadrah Festival" />
          </div>

          {/* Heading */}
          <h1 className="hero__title animate-fade-in-up" style={{ animationDelay: '140ms' }}>
            <span className="gradient-text">SMADA</span>
            <br />
            Hadrah Festival
          </h1>

          <p className="hero__subtitle animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            Sistem Penilaian Resmi — Realtime, Transparan, dan Akurat.
            <br className="hero__br" />
            Lihat nilai Anda segera setelah turun dari panggung.
          </p>

          {/* Live ticker */}
          <div className="hero__ticker animate-fade-in-up" style={{ animationDelay: '260ms' }}>
            <LiveTicker />
          </div>

          {/* CTAs */}
          <div className="hero__ctas animate-fade-in-up" style={{ animationDelay: '320ms' }}>
            {!user ? (
              <Link to="/login" className="btn btn-primary btn-lg">
                <LogIn size={18} />
                Login Peserta
              </Link>
            ) : (
              <Link to={getDashboardLink()} className="btn btn-primary btn-lg">
                <LogIn size={18} />
                Ke Dashboard {user.role === 'peserta' ? 'Peserta' : user.role === 'juri' ? 'Juri' : 'Admin'}
              </Link>
            )}
            <Link to="/ranking" className="btn btn-outline btn-lg">
              <Trophy size={18} />
              Lihat Ranking
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <a href="#stats" className="hero__scroll-indicator animate-float">
          <ChevronDown size={22} />
        </a>
      </section>

      {/* ── Stats ── */}
      <section id="stats" className="stats-section section-sm">
        <div className="container">
          <div className="stats-grid">
            {STATS.map((s, i) => (
              <div className="stat-card glass-card" key={i}>
                <div className="stat-card__value gradient-text">{s.value}</div>
                <div className="stat-card__label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Gallery ── */}
      <GallerySection />

      {/* ── Info ── */}
      <section id="informasi" className="section info-section">
        <div className="container">
          <div className="section-header">
            <span className="text-label" style={{ color: 'var(--accent-primary)' }}>Sistem Penilaian</span>
            <h2 className="text-headline" style={{ marginTop: 8 }}>
              Transparan &amp; <span className="gradient-text">Terstruktur</span>
            </h2>
            <p className="text-body" style={{ color: 'var(--text-muted)', maxWidth: 520, margin: '16px auto 0' }}>
              Setiap aspek penampilan dinilai secara objektif oleh Dewan Juri berpengalaman
              dengan sistem yang adil dan transparan.
            </p>
          </div>

          <div className="info-grid">
            {INFO_CARDS.map((card, i) => (
              <div className="info-card glass-card" key={i}>
                <div className="info-card__icon" style={{ color: card.color, background: `${card.color}18` }}>
                  {card.icon}
                </div>
                <h3 className="info-card__title">{card.title}</h3>
                <p className="info-card__desc">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QR Section ── */}
      <section id="penilaian" className="section qr-section">
        <div className="container">
          <div className="qr-section__inner glass-card">
            <div className="qr-section__text">
              <span className="text-label" style={{ color: 'var(--accent-primary)' }}>Akses Nilai</span>
              <h2 className="text-headline" style={{ marginTop: 8 }}>
                Cek Nilai dengan<br />
                <span className="gradient-text">QR Code Pribadi</span>
              </h2>
              <p className="text-body" style={{ color: 'var(--text-muted)', marginTop: 16, maxWidth: 420 }}>
                Setiap peserta mendapatkan QR Code unik untuk mengakses nilai pribadi mereka.
                Nilai hanya dapat dilihat oleh peserta yang bersangkutan — privasi terjamin.
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
                <Link to="/login" className="btn btn-primary">
                  <LogIn size={16} />
                  Login &amp; Lihat Nilai
                </Link>
              </div>
            </div>
            <div className="qr-section__visual">
              <div className="qr-demo">
                <div className="qr-demo__screen">
                  <div className="qr-demo__dots">
                    <span /><span /><span />
                  </div>
                  <div className="qr-demo__qr-placeholder">
                    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* QR pattern visual */}
                      <rect x="8"  y="8"  width="40" height="40" rx="4" stroke="currentColor" strokeWidth="3" fill="none"/>
                      <rect x="72" y="8"  width="40" height="40" rx="4" stroke="currentColor" strokeWidth="3" fill="none"/>
                      <rect x="8"  y="72" width="40" height="40" rx="4" stroke="currentColor" strokeWidth="3" fill="none"/>
                      <rect x="18" y="18" width="20" height="20" rx="2" fill="currentColor"/>
                      <rect x="82" y="18" width="20" height="20" rx="2" fill="currentColor"/>
                      <rect x="18" y="82" width="20" height="20" rx="2" fill="currentColor"/>
                      {/* Data modules */}
                      <rect x="60" y="60" width="8" height="8" rx="1" fill="currentColor" opacity="0.7"/>
                      <rect x="72" y="60" width="8" height="8" rx="1" fill="currentColor" opacity="0.5"/>
                      <rect x="84" y="60" width="8" height="8" rx="1" fill="currentColor" opacity="0.7"/>
                      <rect x="96" y="60" width="8" height="8" rx="1" fill="currentColor" opacity="0.4"/>
                      <rect x="60" y="72" width="8" height="8" rx="1" fill="currentColor" opacity="0.4"/>
                      <rect x="84" y="72" width="8" height="8" rx="1" fill="currentColor" opacity="0.7"/>
                      <rect x="60" y="84" width="8" height="8" rx="1" fill="currentColor" opacity="0.6"/>
                      <rect x="72" y="84" width="8" height="8" rx="1" fill="currentColor" opacity="0.7"/>
                      <rect x="96" y="84" width="8" height="8" rx="1" fill="currentColor" opacity="0.5"/>
                      <rect x="60" y="96" width="8" height="8" rx="1" fill="currentColor" opacity="0.7"/>
                      <rect x="84" y="96" width="8" height="8" rx="1" fill="currentColor" opacity="0.4"/>
                      <rect x="96" y="96" width="8" height="8" rx="1" fill="currentColor" opacity="0.6"/>
                    </svg>
                  </div>
                  <p className="qr-demo__label">SHF — Peserta #001</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Sponsor Marquee ── */}
      <SponsorMarquee />

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="container footer__inner">
          <div className="footer__brand">
            <div className="footer__logo-img">
              <img src="/rela.jpg" alt="SHF Logo" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>SMADA Hadrah Festival 2026</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>6 September 2026 · Sistem Penilaian Resmi</div>
            </div>
          </div>
          <p className="footer__copy">
            &copy; 2026 SHF — SMADA Hadrah Festival. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
