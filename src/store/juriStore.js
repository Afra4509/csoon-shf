import { create } from 'zustand';
import { supabaseAdmin } from '../supabase';

export const useJuriStore = create((set, get) => ({
  judges:  [],
  loading: false,
  error:   null,

  // ── Fetch all judges ────────────────────────────────────
  fetchJudges: async () => {
    set({ loading: true });
    const { data, error } = await supabaseAdmin
      .from('judges')
      .select('*')
      .order('created_at', { ascending: true });
    if (!error && data) set({ judges: data });
    set({ loading: false });
  },

  // ── Create judge + auth user ────────────────────────────
  createJudge: async ({ username, password, fullName, bidang }) => {
    set({ loading: true, error: null });
    const email = `${username.trim().toLowerCase()}@shf-juri.ac.id`;

    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true,
    });

    if (authErr) {
      set({ loading: false, error: authErr.message });
      return { success: false, error: authErr.message };
    }

    const { error: dbErr } = await supabaseAdmin.from('judges').insert({
      id:        authData.user.id,
      username:  username.trim().toLowerCase(),
      full_name: fullName.trim(),
      bidang:    bidang || null,
      is_active: true,
    });

    if (dbErr) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      set({ loading: false, error: dbErr.message });
      return { success: false, error: dbErr.message };
    }

    await get().fetchJudges();
    set({ loading: false });
    return { success: true };
  },

  // ── Update judge (nama, bidang, status) ─────────────────
  updateJudge: async (judgeId, { fullName, bidang, isActive }) => {
    const { error } = await supabaseAdmin
      .from('judges')
      .update({ full_name: fullName, bidang: bidang || null, is_active: isActive })
      .eq('id', judgeId);

    if (!error) {
      set(s => ({
        judges: s.judges.map(j =>
          j.id === judgeId ? { ...j, full_name: fullName, bidang, is_active: isActive } : j
        ),
      }));
    }
    return { success: !error, error: error?.message };
  },

  // ── Delete judge ────────────────────────────────────────
  deleteJudge: async (judgeId) => {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(judgeId);
    if (error) return { success: false, error: error.message };
    set(s => ({ judges: s.judges.filter(j => j.id !== judgeId) }));
    return { success: true };
  },

  // ── Reset password ──────────────────────────────────────
  resetJudgePassword: async (judgeId, newPassword) => {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(judgeId, {
      password: newPassword,
    });
    return { success: !error, error: error?.message };
  },

  // ── Get judge by bidang ─────────────────────────────────
  getJudgeByBidang: (bidang) => {
    return get().judges.find(j => j.bidang === bidang && j.is_active);
  },

  // ── Progress per juri (berapa peserta sudah dinilai) ────
  getJudgeProgress: (allScores, participants, fieldId) => {
    const { judges } = get();
    return judges.map(j => {
      const judgeScores = allScores.filter(
        s => s.judge_id === j.id && (!fieldId || s.field_id === fieldId)
      );
      const scoredParticipants = new Set(judgeScores.map(s => s.participant_id));
      return {
        ...j,
        scored: scoredParticipants.size,
        total:  participants.length,
        pct:    participants.length ? Math.round((scoredParticipants.size / participants.length) * 100) : 0,
        isDone: scoredParticipants.size >= participants.length,
      };
    });
  },

  // ── Bidang label ────────────────────────────────────────
  getBidangLabel: (bidang) => ({
    adab:    'Adab dan Syair',
    vokal:   'Bidang Suara/Vokal',
    banjari: 'Musik Banjari',
    jingle:  'Jingle',
    null:    '—',
  }[bidang] || '—'),
}));
