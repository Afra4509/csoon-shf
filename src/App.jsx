import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import HomePage        from './pages/HomePage';
import LoginPage       from './pages/LoginPage';
import DashboardPage   from './pages/DashboardPage';
import AdminLoginPage  from './pages/AdminLoginPage';
import AdminPanel      from './pages/AdminPanel';
import JuriLoginPage   from './pages/JuriLoginPage';
import JuriPanel       from './pages/JuriPanel';
import RankingPage     from './pages/RankingPage';

/* ── Route Guards ── */
function ProtectedPeserta({ children }) {
  const { user, loading } = useAuthStore();
  if (loading) return <FullScreenLoader />;
  if (!user || user.role !== 'peserta') return <Navigate to="/login" replace />;
  return children;
}

function ProtectedAdmin({ children }) {
  const { user, isAdmin, loading } = useAuthStore();
  if (loading) return <FullScreenLoader />;
  if (!user || !isAdmin) return <Navigate to="/admin/login" replace />;
  return children;
}

function ProtectedJuri({ children }) {
  const { user, isJuri, loading } = useAuthStore();
  if (loading) return <FullScreenLoader />;
  if (!user || !isJuri) return <Navigate to="/juri/login" replace />;
  return children;
}

function FullScreenLoader() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg-base)',
      flexDirection: 'column', gap: 16,
    }}>
      <div style={{
        width: 40, height: 40,
        border: '3px solid var(--border-default)',
        borderTopColor: 'var(--accent-primary)',
        borderRadius: '50%',
        animation: 'spin-slow 0.8s linear infinite',
      }} />
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Memuat sesi...</p>
    </div>
  );
}

function ThemeProvider({ children }) {
  useEffect(() => {
    const saved = localStorage.getItem('shf_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
  }, []);
  return children;
}

export default function App() {
  const init = useAuthStore(s => s.init);
  useEffect(() => { init(); }, []);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/"             element={<HomePage />} />
          <Route path="/ranking"      element={<RankingPage />} />

          {/* Peserta */}
          <Route path="/login"        element={<LoginPage />} />
          <Route path="/dashboard"    element={<ProtectedPeserta><DashboardPage /></ProtectedPeserta>} />

          {/* Juri */}
          <Route path="/juri/login"   element={<JuriLoginPage />} />
          <Route path="/juri"         element={<ProtectedJuri><JuriPanel /></ProtectedJuri>} />

          {/* Admin */}
          <Route path="/admin/login"  element={<AdminLoginPage />} />
          <Route path="/admin"        element={<ProtectedAdmin><AdminPanel /></ProtectedAdmin>} />

          {/* Fallback */}
          <Route path="*"             element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
