import { create } from 'zustand';
import { supabase, supabaseAdmin } from '../supabase';
import { calcSubtotalKriteria, calcBidangTotal, calcNilaiUtama, compareRanking, BIDANG_CRITERIA_MAX } from '../utils/scoreCalc';

// ── Score Store v3 — SHF Official Scoring System ──────────
export const useScoreStore = create((set, get) => ({
  participants:   [],
  scoringFields:  [],   // master bidang penilaian
  scoringCriteria:[],   // master kriteria per bidang
  allScores:      [],   // semua nilai (per kriteria)
  allNotes:       [],   // semua catatan juri
  finalScores:    [],   // nilai akhir per peserta
  loading:        false,

  // ── Master: fetch bidang + kriteria ──────────────────────
  fetchScoringMaster: async () => {
    const [{ data: fields }, { data: criteria }] = await Promise.all([
      supabaseAdmin.from('scoring_fields').select('*').order('sort_order'),
      supabaseAdmin.from('scoring_criteria').select('*').order('sort_order'),
    ]);
    if (fields)   set({ scoringFields:   fields });
    if (criteria) set({ scoringCriteria: criteria });
  },

  // ── Fetch all participants ────────────────────────────────
  fetchAllParticipants: async () => {
    set({ loading: true });
    const { data, error } = await supabaseAdmin
      .from('participants')
      .select('*')
      .order('no_urut', { ascending: true });
    if (!error && data) set({ participants: data });
    set({ loading: false });
  },

  // ── Fetch all scores (admin/juri) ─────────────────────────
  fetchAllScores: async () => {
    const { data } = await supabaseAdmin
      .from('scores')
      .select('*, judges(full_name, username, bidang), scoring_criteria(label, sort_order, field_id)');
    if (data) set({ allScores: data });
    return data || [];
  },

  // ── Fetch all judge notes ─────────────────────────────────
  fetchAllNotes: async () => {
    const { data } = await supabaseAdmin
      .from('judge_notes')
      .select('*, judges(full_name, bidang)');
    if (data) set({ allNotes: data });
    return data || [];
  },

  // ── Fetch final scores ────────────────────────────────────
  fetchFinalScores: async () => {
    const { data } = await supabaseAdmin.from('final_scores').select('*');
    if (data) set({ finalScores: data });
    return data || [];
  },

  // ── Juri: save scores for one bidang for one participant ──
  // criteriaScores: { [criteriaId]: { jali, khafi } }
  // Sistem BARU: subtotal = maksiKriteria - JALI - KHAFI  (min 0)
  saveFieldScores: async (participantId, judgeId, fieldId, criteriaScores, catatan, _penguranganLegacy) => {
    const maks = BIDANG_CRITERIA_MAX[fieldId] ?? 10;
    const rows = Object.entries(criteriaScores).map(([criteriaId, vals]) => {
      const jali  = parseFloat(vals.jali)  || 0;
      const khafi = parseFloat(vals.khafi) || 0;
      // Rumus baru: maks - jali - khafi, minimum 0
      const subtot = parseFloat(Math.max(0, maks - jali - khafi).toFixed(2));
      return {
        participant_id: participantId,
        judge_id:       judgeId,
        field_id:       fieldId,
        criteria_id:    criteriaId,
        nilai_jali:     jali,
        nilai_khafi:    khafi,
        subtotal:       subtot,
        updated_at:     new Date().toISOString(),
      };
    });

    const { error: scoreErr } = await supabaseAdmin
      .from('scores')
      .upsert(rows, { onConflict: 'participant_id,judge_id,criteria_id' });

    if (scoreErr) return { success: false, error: scoreErr.message };

    // Upsert catatan (pengurangan per bidang sudah tidak dipakai, tapi tetap simpan 0 untuk kompatibilitas)
    const { error: noteErr } = await supabaseAdmin
      .from('judge_notes')
      .upsert({
        participant_id: participantId,
        judge_id:       judgeId,
        field_id:       fieldId,
        catatan:        catatan || null,
        pengurangan:    0, // pengurangan di-handle per kriteria (maks - jali - khafi)
        updated_at:     new Date().toISOString(),
      }, { onConflict: 'participant_id,judge_id,field_id' });

    if (noteErr) return { success: false, error: noteErr.message };

    // Refresh local state
    await get().fetchAllScores();
    await get().fetchAllNotes();

    return { success: true };
  },

  // ── Admin: recalculate final scores ───────────────────────
  recalculateFinalScores: async () => {
    const { participants, allScores, allNotes } = get();
    if (!participants.length) return;

    const upserts = participants.map(p => {
      // Nilai per bidang
      const calc = (fId) => {
        const fieldScores = allScores.filter(
          s => s.participant_id === p.id && s.field_id === fId
        );
        // Recalculate menggunakan rumus baru (maks - jali - khafi) per fieldId
        const result = calcBidangTotal(fieldScores, 0, fId);
        return {
          raw:    result.raw,
          total:  result.total,
          deduct: 0,
          done:   fieldScores.length > 0,
        };
      };

      const adab    = calc('adab');
      const vokal   = calc('vokal');
      const banjari = calc('banjari');
      const jingle  = calc('jingle');

      const nilai_utama = calcNilaiUtama({
        nilai_adab:    adab.total,
        nilai_vokal:   vokal.total,
        nilai_banjari: banjari.total,
      });

      return {
        participant_id:      p.id,
        raw_adab:            adab.raw,
        raw_vokal:           vokal.raw,
        raw_banjari:         banjari.raw,
        raw_jingle:          jingle.raw,
        nilai_adab:          adab.total,
        nilai_vokal:         vokal.total,
        nilai_banjari:       banjari.total,
        nilai_jingle:        jingle.total,
        pengurangan_adab:    adab.deduct,
        pengurangan_vokal:   vokal.deduct,
        pengurangan_banjari: banjari.deduct,
        pengurangan_jingle:  jingle.deduct,
        nilai_utama,
        adab_done:    adab.done,
        vokal_done:   vokal.done,
        banjari_done: banjari.done,
        jingle_done:  jingle.done,
        is_complete:  adab.done && vokal.done && banjari.done,
        updated_at:   new Date().toISOString(),
        calculated_at: new Date().toISOString(),
      };
    });

    // Detect ties
    const sorted = [...upserts].sort(compareRanking);
    const withTie = upserts.map(u => {
      const tied = sorted.filter(s =>
        parseFloat(s.nilai_utama) === parseFloat(u.nilai_utama) &&
        parseFloat(s.nilai_vokal) === parseFloat(u.nilai_vokal) &&
        s.participant_id !== u.participant_id
      );
      return { ...u, is_tied: tied.length > 0 };
    });

    await supabaseAdmin
      .from('final_scores')
      .upsert(withTie, { onConflict: 'participant_id' });

    await get().fetchFinalScores();
  },

  // ── Scores for one participant ────────────────────────────
  getScoresForParticipant: (participantId) => {
    return get().allScores.filter(s => s.participant_id === participantId);
  },

  getNotesForParticipant: (participantId) => {
    return get().allNotes.filter(n => n.participant_id === participantId);
  },

  // ── Breakdown per bidang for a participant ────────────────
  getBreakdownForParticipant: (participantId) => {
    const scores = get().getScoresForParticipant(participantId);
    const notes  = get().getNotesForParticipant(participantId);

    const calc = (fieldId) => {
      const fs = scores.filter(s => s.field_id === fieldId);
      const n  = notes.find(n => n.field_id === fieldId);
      return {
        scores:     fs,
        note:       n,
        ...calcBidangTotal(fs, n?.pengurangan || 0),
        done:       fs.length > 0,
      };
    };

    return {
      adab:    calc('adab'),
      vokal:   calc('vokal'),
      banjari: calc('banjari'),
      jingle:  calc('jingle'),
    };
  },

  // ── Peserta: fetch own scores ─────────────────────────────
  fetchMyScores: async (participantId) => {
    const [{ data: scores }, { data: notes }] = await Promise.all([
      supabase.from('scores').select('*, scoring_criteria(label, sort_order, field_id), judges(full_name)').eq('participant_id', participantId),
      supabase.from('judge_notes').select('*').eq('participant_id', participantId).eq('is_published', true),
    ]);
    return { scores: scores || [], notes: notes || [] };
  },

  // ── Status penilaian per peserta ─────────────────────────
  getParticipantScoringStatus: (participantId) => {
    const fs = get().finalScores.find(f => f.participant_id === participantId);
    if (!fs) return { adab: false, vokal: false, banjari: false, jingle: false };
    return {
      adab:    fs.adab_done,
      vokal:   fs.vokal_done,
      banjari: fs.banjari_done,
      jingle:  fs.jingle_done,
    };
  },

  // ── Admin: reset semua nilai satu peserta (atau per bidang) ─
  // fieldId: null = reset semua bidang, string = reset bidang tertentu saja
  resetParticipantScores: async (participantId, fieldId = null) => {
    try {
      // Delete scores
      let scoresQ = supabaseAdmin.from('scores').delete().eq('participant_id', participantId);
      if (fieldId) scoresQ = scoresQ.eq('field_id', fieldId);
      const { error: e1 } = await scoresQ;
      if (e1) return { success: false, error: e1.message };

      // Delete judge_notes
      let notesQ = supabaseAdmin.from('judge_notes').delete().eq('participant_id', participantId);
      if (fieldId) notesQ = notesQ.eq('field_id', fieldId);
      const { error: e2 } = await notesQ;
      if (e2) return { success: false, error: e2.message };

      // Full reset: juga hapus final_scores
      if (!fieldId) {
        const { error: e3 } = await supabaseAdmin
          .from('final_scores').delete().eq('participant_id', participantId);
        if (e3) return { success: false, error: e3.message };
      }

      await Promise.all([
        get().fetchAllScores(),
        get().fetchAllNotes(),
        get().fetchFinalScores(),
      ]);

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // ── Stats dashboard ───────────────────────────────────────

  getStats: () => {
    const { participants, finalScores } = get();
    const done = finalScores.filter(f => f.is_complete).length;
    const partial = finalScores.filter(f =>
      (f.adab_done || f.vokal_done || f.banjari_done) && !f.is_complete
    ).length;
    return {
      total:        participants.length,
      selesai:      participants.filter(p => p.status === 'selesai').length,
      tampil:       participants.filter(p => p.status === 'tampil').length,
      menunggu:     participants.filter(p => p.status === 'menunggu').length,
      sd:           participants.filter(p => p.kategori === 'sd').length,
      smp:          participants.filter(p => p.kategori === 'smp').length,
      sudahDinilai: done,
      sebagian:     partial,
      belumDinilai: participants.length - done - partial,
    };
  },

  // ── Admin: create participant + auth user ─────────────────
  createParticipant: async ({ username, password, groupName, schoolName, noUrut, kategori, tingkatPelajar }) => {
    const email = `${username.trim().toLowerCase()}@shf.ac.id`;
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true,
    });
    if (authErr) return { success: false, error: authErr.message };

    const { error: dbErr } = await supabaseAdmin.from('participants').insert({
      id:              authData.user.id,
      username:        username.trim().toLowerCase(),
      group_name:      groupName.trim(),
      school_name:     schoolName?.trim() || null,
      no_urut:         parseInt(noUrut) || null,
      kategori,
      tingkat_pelajar: tingkatPelajar?.trim() || null,
      status:          'menunggu',
    });

    if (dbErr) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return { success: false, error: dbErr.message };
    }

    await get().fetchAllParticipants();
    return { success: true };
  },

  // ── Admin: update participant ─────────────────────────────
  updateParticipant: async (participantId, data) => {
    const { error } = await supabaseAdmin
      .from('participants')
      .update({
        group_name:      data.groupName.trim(),
        school_name:     data.schoolName?.trim() || null,
        no_urut:         parseInt(data.noUrut) || null,
        kategori:        data.kategori,
        tingkat_pelajar: data.tingkatPelajar?.trim() || null,
      })
      .eq('id', participantId);

    if (!error) await get().fetchAllParticipants();
    return { success: !error, error: error?.message };
  },

  // ── Admin: delete participant ─────────────────────────────
  deleteParticipant: async (participantId) => {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(participantId);
    if (error) return { success: false, error: error.message };
    set(s => ({
      participants: s.participants.filter(p => p.id !== participantId),
    }));
    return { success: true };
  },

  // ── Admin: update participant status ──────────────────────
  updateParticipantStatus: async (participantId, status) => {
    await supabaseAdmin.from('participants').update({ status }).eq('id', participantId);
    set(s => ({
      participants: s.participants.map(p =>
        p.id === participantId ? { ...p, status } : p
      ),
    }));
  },

  // ── Admin: update scoring_fields config ───────────────────
  updateFieldConfig: async (fieldId, { maxScore, isActive, label }) => {
    const { error } = await supabaseAdmin
      .from('scoring_fields')
      .update({ max_score: maxScore, is_active: isActive, label })
      .eq('id', fieldId);
    if (!error) await get().fetchScoringMaster();
    return { success: !error, error: error?.message };
  },

  // ── Export CSV ────────────────────────────────────────────
  exportCSV: () => {
    const { participants, finalScores } = get();
    // Escape CSV values (wrap in quotes if contains semicolon, quote, or newline)
    const esc = (v) => {
      const s = v == null ? '' : String(v);
      return s.includes(';') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const rows = [
      ['No Urut', 'Nama Grup', 'Sekolah', 'Kategori', 'Status', 'Adab (30)', 'Vokal (40)', 'Banjari (30)', 'Nilai Utama (100)', 'Jingle', 'Selesai'],
    ];

    participants.forEach(p => {
      const fs = finalScores.find(f => f.participant_id === p.id);
      rows.push([
        p.no_urut, p.group_name, p.school_name || '—',
        p.kategori.toUpperCase(), p.status,
        fs?.nilai_adab    ?? '—',
        fs?.nilai_vokal   ?? '—',
        fs?.nilai_banjari ?? '—',
        fs?.nilai_utama   ?? '—',
        fs?.nilai_jingle  ?? '—',
        fs?.is_complete ? 'Ya' : 'Tidak',
      ]);
    });

    return rows.map(r => r.map(esc).join(';')).join('\n');
  },
}));
