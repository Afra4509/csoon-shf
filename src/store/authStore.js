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

    // 0. Prioritaskan parameter ref/id/p dari URL saat scanning QR / barcode
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const urlRef = searchParams.get('ref') || searchParams.get('id') || searchParams.get('p') || searchParams.get('peserta');
      if (urlRef) {
        const res = await get().loginByRef(urlRef);
        if (res.success) {
          _attachAuthListener();
          return;
        }
      }
    } catch {
      // ignore URL parsing error
    }

    // 1. Coba pulihkan sesi Supabase nyata (Juri dan Peserta biasa)
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await get()._resolveUser(session.user);
      _attachAuthListener();
      return;
    }

    // 2. Cek sesi QR-code peserta di localStorage TERLEBIH DAHULU
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
      } catch {
        localStorage.removeItem(LS_REF);
      }
    }

    // 3. Cek sesi admin backdoor di localStorage
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
      } catch {
        localStorage.removeItem(LS_ADMIN);
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

    // Fallback: jika login gagal, cari participant di DB berdasarkan username, alias, atau kemiripan nama
    if (error) {
      let { data: part } = await supabaseAdmin
        .from('participants')
        .select('*')
        .ilike('username', cleanUser)
        .maybeSingle();

      if (!part) {
        const aliasMap = {
          'nurqolbi_sd1': 'grupnurqolbi_sd1',
          'alfatih_sd2': 'sdntrajeng2_sd2',
          'nurulmusthofa_sd3': 'grupnurulmustof_sd3',
          'tabassam_sd4': 'miroudotulbanat_sd4',
          'junioralhikmah_smp1': 'banjarismpbayta_smp1',
          'junioralhikmah_smp15': 'banjarismpbayta_smp1',
          'nurulmusthofa_smp2': 'smpn2gondangwet_smp2',
          'nurulmusthofa_smp9': 'smpn2gondangwet_smp2',
          'arroudhoh_smp5': 'mtsroudotulbana_smp5',
          'arroudhoh_smp14': 'mtsroudotulbana_smp5',
          'alimanputra_smp13': 'alimanputra_smp3',
          'alimanputri_smp10': 'alimanputri_smp4',
        };
        const mappedTarget = aliasMap[cleanUser];
        if (mappedTarget) {
          const { data: pAlias } = await supabaseAdmin
            .from('participants')
            .select('*')
            .eq('username', mappedTarget)
            .maybeSingle();
          part = pAlias;
        }
      }

      // Stem matching: contoh almurtadho_sd3 -> almurtadho -> cocok dengan almurtadho_sd7 / Al-Murtadho
      if (!part) {
        const baseStem = cleanUser.replace(/_(sd|smp)\d+$/i, '').replace(/[^a-z0-9]/g, '');
        if (baseStem.length >= 3) {
          const { data: pStem } = await supabaseAdmin
            .from('participants')
            .select('*')
            .or(`username.ilike.%${baseStem}%,group_name.ilike.%${baseStem}%`)
            .limit(1)
            .maybeSingle();
          part = pStem;
        }
      }

      if (part) {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(part.id);
        if (authUser?.user?.email) {
          let res = await supabase.auth.signInWithPassword({ email: authUser.user.email, password });
          if (res.error) {
            // Toleransi jika password yang dimasukkan mengikuti format shf...2026
            if (/^shf\d+2026$/i.test(password)) {
              await supabaseAdmin.auth.admin.updateUserById(part.id, { password });
              res = await supabase.auth.signInWithPassword({ email: authUser.user.email, password });
            }
          }
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

  // ── Auto Login Peserta (by QR Code ref ID / barcode) ────────
  // Sesi ini disimpan di localStorage agar tahan refresh.
  loginByRef: async (refIdentifier) => {
    if (!refIdentifier) return { success: false };
    const clean = String(refIdentifier).trim();
    set({ loading: true, error: null });

    let participant = null;

    // 1. Cek apakah format UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);
    if (isUUID) {
      const { data } = await supabaseAdmin
        .from('participants')
        .select('*')
        .eq('id', clean)
        .maybeSingle();
      participant = data;
    }

    // 2. Cek berdasarkan username
    if (!participant) {
      const cleanUser = clean.toLowerCase();
      const { data } = await supabaseAdmin
        .from('participants')
        .select('*')
        .ilike('username', cleanUser)
        .maybeSingle();
      participant = data;
    }

    // 3. Cek berdasarkan nomor urut & kategori (e.g. 'SD-9', 'SMP-11', 'SD 9', 'SD9', atau angka '9')
    if (!participant) {
      const matchKatNo = clean.match(/^(sd|smp)[-_\s]*(\d+)$/i);
      if (matchKatNo) {
        const kat = matchKatNo[1].toLowerCase();
        const num = parseInt(matchKatNo[2], 10);
        const { data } = await supabaseAdmin
          .from('participants')
          .select('*')
          .eq('kategori', kat)
          .eq('no_urut', num)
          .maybeSingle();
        participant = data;
      } else if (/^\d+$/.test(clean)) {
        const num = parseInt(clean, 10);
        const { data } = await supabaseAdmin
          .from('participants')
          .select('*')
          .eq('no_urut', num)
          .limit(1)
          .maybeSingle();
        participant = data;
      }
    }

    // 4. Stem matching: hapus _sd... atau _smp... jika ada dan cocokkan ke username atau group_name
    if (!participant) {
      const stem = clean.replace(/_(sd|smp)\d+$/i, '').replace(/[^a-z0-9]/g, '');
      if (stem.length >= 3) {
        const { data } = await supabaseAdmin
          .from('participants')
          .select('*')
          .or(`username.ilike.%${stem}%,group_name.ilike.%${stem}%`)
          .limit(1)
          .maybeSingle();
        participant = data;
      }
    }

    if (participant) {
      // Hapus sesi admin lama agar tidak konflik saat scan QR peserta
      localStorage.removeItem(LS_ADMIN);
      // Simpan ke localStorage agar sesi bertahan setelah refresh
      localStorage.setItem(LS_REF, JSON.stringify({ participantId: participant.id }));
      set({
        user:    { ...participant, role: 'peserta' },
        role:    'peserta',
        isAdmin: false,
        isJuri:  false,
        loading: false,
        error:   null,
      });
      return { success: true, participant };
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
    const hasRefSession = !!localStorage.getItem(LS_REF);
    const urlHasRef = typeof window !== 'undefined' && (
      new URLSearchParams(window.location.search).has('ref') ||
      new URLSearchParams(window.location.search).has('id') ||
      new URLSearchParams(window.location.search).has('p') ||
      new URLSearchParams(window.location.search).has('peserta')
    );

    if (session?.user) {
      if (!hasRefSession && !urlHasRef) {
        await useAuthStore.getState()._resolveUser(session.user);
      }
    } else {
      // Hanya logout jika tidak ada sesi non-Supabase aktif
      const hasAdminSession = !!localStorage.getItem(LS_ADMIN);
      if (!hasAdminSession && !hasRefSession && !urlHasRef) {
        useAuthStore.setState({
          user: null, role: null, isAdmin: false, isJuri: false, loading: false,
        });
      }
    }
  });
}
