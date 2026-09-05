import { create } from 'zustand';
import { supabase, supabaseAdmin } from '../supabase';

// ── Kunci localStorage untuk sesi non-Supabase ────────────
// Admin backdoor dan QR-code peserta tidak membuat sesi Supabase nyata,
// sehingga kita simpan sendiri di localStorage agar tetap ada setelah refresh.
const LS_ADMIN = 'shf_admin_session';
const LS_REF   = 'shf_ref_session';

export const useAuthStore = create((set, get) => ({
  user:    null,
  role:    null,   // 'peserta' | 'juri' | 'admin'
  isAdmin: false,
  isJuri:  false,
  loading: true,
  error:   null,

  // ── Init: restore session on page load/refresh ─────────────
  init: async () => {
    set({ loading: true });

    // 1. Coba pulihkan sesi Supabase nyata (Juri dan Peserta biasa)
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await get()._resolveUser(session.user);
      _attachAuthListener();
      return;
    }

    // 2. Cek sesi admin backdoor di localStorage
    const adminRaw = localStorage.getItem(LS_ADMIN);
    if (adminRaw) {
      try {
        const { email } = JSON.parse(adminRaw);
        if (email === 'admin@shf.ac.id') {
          set({
            user:    { id: 'admin-hardcode-id', email, full_name: 'Administrator', role: 'admin' },
            role:    'admin',
            isAdmin: true,
            isJuri:  false,
            loading: false,
            error:   null,
          });
          _attachAuthListener();
          return;
        }
      } catch (_) {
        localStorage.removeItem(LS_ADMIN);
      }
    }

    // 3. Cek sesi QR-code peserta di localStorage
    const refRaw = localStorage.getItem(LS_REF);
    if (refRaw) {
      try {
        const { participantId } = JSON.parse(refRaw);
        const { data: participant } = await supabaseAdmin
          .from('participants')
          .select('*')
          .eq('id', participantId)
          .single();

        if (participant) {
          set({
            user:    { ...participant, role: 'peserta' },
            role:    'peserta',
            isAdmin: false,
            isJuri:  false,
            loading: false,
            error:   null,
          });
          _attachAuthListener();
          return;
        } else {
          localStorage.removeItem(LS_REF);
        }
      } catch (_) {
        localStorage.removeItem(LS_REF);
      }
    }

    // Tidak ada sesi sama sekali
    set({ loading: false });
    _attachAuthListener();
  },

  // Internal: determine role after real Supabase login
  _resolveUser: async (authUser) => {
    // 1. Check if peserta
    const { data: participant } = await supabaseAdmin
      .from('participants')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (participant) {
      set({
        user:    { ...participant, role: 'peserta' },
        role:    'peserta',
        isAdmin: false,
        isJuri:  false,
        loading: false,
        error:   null,
      });
      return;
    }

    // 2. Check if juri
    const { data: judge } = await supabaseAdmin
      .from('judges')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (judge) {
      set({
        user:    { ...judge, email: authUser.email, role: 'juri' },
        role:    'juri',
        isAdmin: false,
        isJuri:  true,
        loading: false,
        error:   null,
      });
      return;
    }

    // 3. Fallback → admin (akun Supabase yang bukan peserta dan bukan juri)
    set({
      user:    { id: authUser.id, email: authUser.email, full_name: 'Administrator', role: 'admin' },
      role:    'admin',
      isAdmin: true,
      isJuri:  false,
      loading: false,
      error:   null,
    });
  },

  // ── Login Peserta (by username or email) ───────────────────
  loginPeserta: async (username, password) => {
    set({ loading: true, error: null });
    const cleanUser = username.trim().toLowerCase();
    let email = cleanUser.includes('@') ? cleanUser : `${cleanUser}@shf.ac.id`;

    let { data, error } = await supabase.auth.signInWithPassword({ email, password });

    // Fallback: jika login gagal, cari participant di DB berdasarkan username dan gunakan auth ID-nya
    if (error) {
      const { data: part } = await supabaseAdmin
        .from('participants')
        .select('id, username')
        .ilike('username', cleanUser)
        .maybeSingle();

      if (part) {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(part.id);
        if (authUser?.user?.email) {
          const res = await supabase.auth.signInWithPassword({ email: authUser.user.email, password });
          if (!res.error) {
            data = res.data;
            error = null;
          }
        }
      }
    }

    if (error) {
      set({ loading: false, error: 'Username atau password salah.' });
      return { success: false };
    }

    await get()._resolveUser(data.user);

    if (get().role !== 'peserta') {
      await supabase.auth.signOut();
      set({ loading: false, error: 'Akun ini bukan akun peserta.' });
      return { success: false };
    }
    return { success: true };
  },

  // ── Auto Login Peserta (by QR Code ref ID) ─────────────────
  // Sesi ini tidak berbasis Supabase, disimpan di localStorage agar tahan refresh.
  loginByRef: async (participantId) => {
    set({ loading: true, error: null });
    const { data: participant } = await supabaseAdmin
      .from('participants')
      .select('*')
      .eq('id', participantId)
      .single();

    if (participant) {
      // Simpan ke localStorage agar sesi bertahan setelah refresh
      localStorage.setItem(LS_REF, JSON.stringify({ participantId }));
      set({
        user:    { ...participant, role: 'peserta' },
        role:    'peserta',
        isAdmin: false,
        isJuri:  false,
        loading: false,
        error:   null,
      });
      return { success: true };
    }
    
    set({ loading: false, error: 'Peserta tidak ditemukan.' });
    return { success: false };
  },

  // ── Login Juri (by username) ───────────────────────────────
  loginJuri: async (username, password) => {
    set({ loading: true, error: null });
    const email = `${username.trim().toLowerCase()}@shf-juri.ac.id`;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      set({ loading: false, error: 'Username atau password juri salah.' });
      return { success: false };
    }

    await get()._resolveUser(data.user);

    if (get().role !== 'juri') {
      await supabase.auth.signOut();
      set({ loading: false, error: 'Akun ini bukan akun juri.' });
      return { success: false };
    }

    return { success: true };
  },

  // ── Login Admin (by email) ─────────────────────────────────
  loginAdmin: async (email, password) => {
    set({ loading: true, error: null });
    const cleanEmail = email.trim().toLowerCase();

    // BACKDOOR KHUSUS ADMIN — simpan ke localStorage agar tahan refresh
    if (cleanEmail === 'admin@shf.ac.id' && password === 'admin123') {
      localStorage.setItem(LS_ADMIN, JSON.stringify({ email: cleanEmail }));
      set({
        user:    { id: 'admin-hardcode-id', email: cleanEmail, full_name: 'Administrator', role: 'admin' },
        role:    'admin',
        isAdmin: true,
        isJuri:  false,
        loading: false,
        error:   null,
      });
      return { success: true };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      set({ loading: false, error: 'Email atau password salah.' });
      return { success: false };
    }

    await get()._resolveUser(data.user);

    if (get().role !== 'admin') {
      await supabase.auth.signOut();
      set({ loading: false, error: 'Akun ini bukan administrator.' });
      return { success: false };
    }

    return { success: true };
  },

  // ── Logout ──────────────────────────────────────────────────
  logout: async () => {
    // Hapus semua sesi non-Supabase dari localStorage
    localStorage.removeItem(LS_ADMIN);
    localStorage.removeItem(LS_REF);
    set({ loading: true });
    await supabase.auth.signOut();
    set({ user: null, role: null, isAdmin: false, isJuri: false, loading: false });
  },

  clearError: () => set({ error: null }),
}));

// ── Listener Supabase auth state change ───────────────────
// Dipisahkan agar hanya dipasang sekali. Jika ada sesi non-Supabase
// aktif (admin backdoor atau QR ref), jangan hapus state saat Supabase
// mengirim event session null.
let _listenerAttached = false;
function _attachAuthListener() {
  if (_listenerAttached) return;
  _listenerAttached = true;

  supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      await useAuthStore.getState()._resolveUser(session.user);
    } else {
      // Hanya logout jika tidak ada sesi non-Supabase aktif
      const hasAdminSession = !!localStorage.getItem(LS_ADMIN);
      const hasRefSession   = !!localStorage.getItem(LS_REF);
      if (!hasAdminSession && !hasRefSession) {
        useAuthStore.setState({
          user: null, role: null, isAdmin: false, isJuri: false, loading: false,
        });
      }
    }
  });
}
