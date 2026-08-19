import { create } from 'zustand';
import { supabase, supabaseAdmin } from '../supabase';

export const useAuthStore = create((set, get) => ({
  user:    null,
  role:    null,   // 'peserta' | 'juri' | 'admin'
  isAdmin: false,
  isJuri:  false,
  loading: true,
  error:   null,

  // ── Init: restore session ──────────────────────────────────
  init: async () => {
    set({ loading: true });
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await get()._resolveUser(session.user);
    } else {
      set({ loading: false });
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await get()._resolveUser(session.user);
      } else {
        set({ user: null, role: null, isAdmin: false, isJuri: false, loading: false });
      }
    });
  },

  // Internal: determine role after login
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
        // bidang accessible via user.bidang
      });
      return;
    }

    // 3. Fallback → admin
    set({
      user:    { id: authUser.id, email: authUser.email, full_name: 'Administrator', role: 'admin' },
      role:    'admin',
      isAdmin: true,
      isJuri:  false,
      loading: false,
      error:   null,
    });
  },

  // ── Login Peserta (by username) ────────────────────────────
  loginPeserta: async (username, password) => {
    set({ loading: true, error: null });
    const email = `${username.trim().toLowerCase()}@shf.ac.id`;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      set({ loading: false, error: 'Username atau password salah.' });
      return { success: false };
    }

    await get()._resolveUser(data.user);

    // Only allow peserta role through this login
    if (get().role !== 'peserta') {
      await supabase.auth.signOut();
      set({ loading: false, error: 'Akun ini bukan akun peserta.' });
      return { success: false };
    }
    return { success: true };
  },

  // ── Auto Login Peserta (by QR Code ref ID) ──────────────────
  loginByRef: async (participantId) => {
    set({ loading: true, error: null });
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

    // BACKDOOR KHUSUS ADMIN (Bypass masalah koneksi/DNS lokal)
    if (cleanEmail === 'admin@shf.ac.id' && password === 'admin123') {
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
    set({ loading: true });
    await supabase.auth.signOut();
    set({ user: null, role: null, isAdmin: false, isJuri: false, loading: false });
  },

  clearError: () => set({ error: null }),
}));
