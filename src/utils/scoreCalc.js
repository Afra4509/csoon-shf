// scoreCalc.js — SHF v4: REVISED Scoring System
// ══════════════════════════════════════════════════════════════
// SISTEM BARU (JALI & KHAFI sebagai PENGURANGAN):
//
//   Adab & Syair  → 4 kriteria, masing-masing maks 7.5 (30/4)
//   Vokal         → 4 kriteria, masing-masing maks 10  (40/4)
//   Banjari       → 3 kriteria, nilai langsung (maks 10/kriteria)
//   Jingle        → 4 kriteria, nilai langsung (maks 7.5/kriteria), TERPISAH
//
//   Subtotal (adab/vokal) = maksiKriteria - JALI - KHAFI   ≥ 0
//   Total bidang (adab/vokal) = sum(subtotal kriteria)
//
//   Banjari: subtotal = maksiKriteria - JALI - KHAFI (sama)
//   (jika panitia memutuskan berbeda, ubah di BIDANG_CRITERIA_MAX)
//
//   Nilai Utama = Adab + Vokal + Banjari  (maks 100)
//   Jingle terpisah, tidak masuk nilai_utama
//   Tie-breaker: nilai_vokal DESC → jika masih sama → SERI
// ══════════════════════════════════════════════════════════════

/**
 * Nilai maksimal per kriteria untuk tiap bidang.
 * Digunakan untuk rumus: subtotal = maks - JALI - KHAFI
 */
export const BIDANG_CRITERIA_MAX = {
  adab:    7.5,   // 30 / 4 kriteria
  vokal:   10,    // 40 / 4 kriteria
  banjari: 10,    // 30 / 3 kriteria
  jingle:  7.5,   // 30 / 4 kriteria (terpisah)
};

/**
 * Hitung subtotal satu kriteria dengan sistem PENGURANGAN
 * Subtotal = maksiKriteria - JALI - KHAFI   (min 0)
 *
 * @param {number|string} jali   - Nilai pengurangan JALI
 * @param {number|string} khafi  - Nilai pengurangan KHAFI
 * @param {number}        maks   - Nilai maksimal kriteria (default 10)
 * @returns {number} Subtotal ≥ 0
 */
export function calcSubtotalKriteria(jali, khafi, maks = 10) {
  const j   = parseFloat(jali)  || 0;
  const k   = parseFloat(khafi) || 0;
  const sub = maks - j - k;
  return parseFloat(Math.max(0, sub).toFixed(2));
}

/**
 * Hitung subtotal dengan maks per bidang otomatis
 * @param {string}        fieldId - 'adab' | 'vokal' | 'banjari' | 'jingle'
 * @param {number|string} jali
 * @param {number|string} khafi
 */
export function calcSubtotalByField(fieldId, jali, khafi) {
  const maks = BIDANG_CRITERIA_MAX[fieldId] ?? 10;
  return calcSubtotalKriteria(jali, khafi, maks);
}

/**
 * Hitung total satu bidang dari array kriteria scores
 * Jika scores punya field_id, gunakan BIDANG_CRITERIA_MAX otomatis.
 *
 * @param {Array}  criteriaScores - [{nilai_jali, nilai_khafi, subtotal, field_id?}]
 * @param {number} pengurangan    - Pengurangan tambahan (catatan juri, default 0)
 * @param {string} fieldId        - Opsional: override maks per kriteria
 * @returns {{ raw, pengurangan, total, isEmpty }}
 */
export function calcBidangTotal(criteriaScores, pengurangan = 0, fieldId = null) {
  if (!criteriaScores || criteriaScores.length === 0) {
    return { raw: 0, pengurangan: 0, total: 0, isEmpty: true };
  }

  const maks = fieldId
    ? (BIDANG_CRITERIA_MAX[fieldId] ?? 10)
    : null; // akan ambil dari field_id per baris

  const raw = criteriaScores.reduce((sum, s) => {
    // Jika subtotal sudah dihitung dan disimpan, pakai langsung
    // tapi hanya jika sistem yang menyimpan sudah menggunakan rumus baru.
    // Untuk aman, hitung ulang dari jali/khafi jika ada.
    const rowField = fieldId || s.field_id;
    const rowMaks  = BIDANG_CRITERIA_MAX[rowField] ?? maks ?? 10;

    let sub;
    if (s.nilai_jali != null && s.nilai_khafi != null) {
      // Hitung ulang dari nilai mentah (lebih akurat, pakai rumus baru)
      sub = calcSubtotalKriteria(s.nilai_jali, s.nilai_khafi, rowMaks);
    } else if (s.subtotal != null) {
      sub = parseFloat(s.subtotal);
    } else {
      sub = 0;
    }
    return sum + sub;
  }, 0);

  const deduct = parseFloat(pengurangan) || 0;
  const total  = Math.max(0, parseFloat((raw - deduct).toFixed(2)));

  return {
    raw:        parseFloat(raw.toFixed(2)),
    pengurangan: deduct,
    total,
    isEmpty:    false,
  };
}

/**
 * Hitung nilai utama peserta
 * nilai_utama = nilai_adab + nilai_vokal + nilai_banjari (maks 100)
 * Jingle terpisah, tidak masuk nilai_utama
 */
export function calcNilaiUtama({ nilai_adab, nilai_vokal, nilai_banjari }) {
  const a = parseFloat(nilai_adab)    || 0;
  const v = parseFloat(nilai_vokal)   || 0;
  const b = parseFloat(nilai_banjari) || 0;
  return parseFloat((a + v + b).toFixed(2));
}

/**
 * Compare dua peserta untuk ranking
 * Return: negatif (a lebih tinggi), positif (b lebih tinggi), 0 (SERI)
 */
export function compareRanking(a, b) {
  const totalA = parseFloat(a.nilai_utama) || 0;
  const totalB = parseFloat(b.nilai_utama) || 0;

  if (totalA !== totalB) return totalB - totalA; // DESC

  // Tie-breaker 1: nilai vokal
  const vokalA = parseFloat(a.nilai_vokal) || 0;
  const vokalB = parseFloat(b.nilai_vokal) || 0;
  if (vokalA !== vokalB) return vokalB - vokalA; // DESC

  // SERI — jangan tentukan pemenang otomatis
  return 0;
}

/**
 * Tentukan status penilaian peserta
 */
export function getStatusPenilaian(fs = {}) {
  const mainDone  = [fs.adab_done, fs.vokal_done, fs.banjari_done];
  const doneCount = mainDone.filter(Boolean).length;

  if (doneCount === 0) return { label: 'Belum Dinilai', color: 'var(--text-muted)', code: 'none' };
  if (doneCount < 3)   return { label: `${doneCount}/3 Bidang`, color: 'var(--gold-400)', code: 'partial' };
  if (!fs.jingle_done) return { label: 'Utama Selesai', color: 'var(--emerald-400)', code: 'main_done' };
  return                      { label: 'Semua Selesai', color: '#818cf8',            code: 'complete' };
}

/**
 * Format angka desimal
 */
export function formatScore(val, decimals = 2) {
  if (val == null || val === '') return '—';
  const n = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(n)) return '—';
  return n.toFixed(decimals);
}

/**
 * Grade berdasarkan nilai (skala 0–100)
 */
export function getScoreGrade(score) {
  const s = parseFloat(score) || 0;
  if (s >= 90) return { label: 'Istimewa',       color: 'var(--gold-400)',    emoji: '🏆' };
  if (s >= 80) return { label: 'Sangat Baik',    color: 'var(--emerald-400)', emoji: '⭐' };
  if (s >= 70) return { label: 'Baik',           color: 'var(--emerald-500)', emoji: '✅' };
  if (s >= 60) return { label: 'Cukup',          color: '#60a5fa',            emoji: '📋' };
  return              { label: 'Perlu Perbaikan', color: 'var(--text-muted)',  emoji: '📝' };
}

// ── Legacy aliases (backward compat) ──────────────────────────
export const calcScoreFromRow     = () => null; // deprecated
export const calcAverageFromJuries = () => null; // deprecated
export const calcScoreTotal        = calcBidangTotal;
export const calcUmumTotal         = calcBidangTotal;
export const calcJingleTotal       = calcBidangTotal;
