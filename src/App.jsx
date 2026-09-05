import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import HomePage        from './pages/HomePage';
import LoginPage       from './pages/LoginPage';
import DashboardPage   from './pages/DashboardPage';
import AdminLoginPage  from './pages/AdminLoginPage';
import AdminPanel      from './pages/AdminPanel';
import JuriLoginPage   from './pages/JuriLoginPage';
import JuriPanel       from './pages/JuriPanel';
import RankingPage     from './pages/RankingPage';

/* ── Quick Redirect for QR / Barcode Scan Links ── */
function QuickRefRedirect() {
  const { id } = useParams();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const ref = id || query.get('ref') || query.get('id') || query.get('p') || query.get('peserta');
  return <Navigate to={`/dashboard${ref ? `?ref=${encodeURIComponent(ref)}` : ''}`} replace />;
}

/* ── Route Guards ── */
function ProtectedPeserta({ children }) {
  const { user, loading, loginByRef } = useAuthStore();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const ref = query.get('ref') || query.get('id') || query.get('p') || query.get('peserta');
  
  const needRefLogin = !!ref && (!user || (user.id !== ref && user.username !== ref) || user.role !== 'peserta');
  const [checkingRef, setCheckingRef] = useState(needRefLogin);

  useEffect(() => {
    if (needRefLogin) {
      setCheckingRef(true);
      loginByRef(ref).finally(() => setCheckingRef(false));
    } else {
      setCheckingRef(false);
    }
  }, [needRefLogin, ref, loginByRef]);

  if (loading || checkingRef) return <FullScreenLoader />;
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

function ProtectedInternal({ children }) {
  const { user, isAdmin, isJuri, loading } = useAuthStore();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin && !isJuri) return <Navigate to="/dashboard" replace />;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { init(); }, []);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/"             element={<HomePage />} />

          {/* Internal: Admin & Juri Only */}
          <Route path="/ranking"      element={<ProtectedInternal><RankingPage /></ProtectedInternal>} />

          {/* Peserta */}
          <Route path="/login"        element={<LoginPage />} />
          <Route path="/dashboard"    element={<ProtectedPeserta><DashboardPage /></ProtectedPeserta>} />

          {/* Quick QR / Barcode Scan Links */}
          <Route path="/p/:id"        element={<QuickRefRedirect />} />
          <Route path="/peserta/:id"  element={<QuickRefRedirect />} />
          <Route path="/qr/:id"       element={<QuickRefRedirect />} />
          <Route path="/scan/:id"     element={<QuickRefRedirect />} />
          <Route path="/scan"         element={<QuickRefRedirect />} />

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
