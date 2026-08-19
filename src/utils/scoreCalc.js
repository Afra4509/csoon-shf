// scoreCalc.js — SHF v3: Official Scoring System
// Rumus resmi:
//   subtotal per kriteria = (nilai_jali + nilai_khafi) / 2
//   total bidang (sebelum pengurangan) = sum(subtotal semua kriteria)
//   total bidang (akhir) = total - pengurangan
//   nilai utama = adab + vokal + banjari (maks 100)
//   jingle terpisah, tidak masuk ranking utama
//   tie-breaker: nilai_vokal DESC, jika sama → "SERI"

/**
 * Hitung subtotal satu kriteria
 * @param {number} jali - Nilai JALI
 * @param {number} khafi - Nilai KHAFI
 * @returns {number} Subtotal = (jali + khafi) / 2
 */
export function calcSubtotalKriteria(jali, khafi) {
  const j = parseFloat(jali) || 0;
  const k = parseFloat(khafi) || 0;
  return parseFloat(((j + k) / 2).toFixed(2));
}

/**
 * Hitung total satu bidang dari array kriteria scores
 * @param {Array} criteriaScores - [{nilai_jali, nilai_khafi, subtotal}]
 * @param {number} pengurangan - Nilai pengurangan (default 0)
 * @returns {{ raw, pengurangan, total }}
 */
export function calcBidangTotal(criteriaScores, pengurangan = 0) {
  if (!criteriaScores || criteriaScores.length === 0) {
    return { raw: 0, pengurangan: 0, total: 0, isEmpty: true };
  }

  const raw = criteriaScores.reduce((sum, s) => {
    const sub = s.subtotal != null
      ? parseFloat(s.subtotal)
      : calcSubtotalKriteria(s.nilai_jali, s.nilai_khafi);
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
 * Return: -1 (a lebih tinggi), 1 (b lebih tinggi), 0 (SERI)
 */
export function compareRanking(a, b) {
  const totalA = parseFloat(a.nilai_utama) || 0;
  const totalB = parseFloat(b.nilai_utama) || 0;

  if (totalA !== totalB) return totalB - totalA; // DESC

  // Tie-breaker: nilai vokal
  const vokalA = parseFloat(a.nilai_vokal) || 0;
  const vokalB = parseFloat(b.nilai_vokal) || 0;
  if (vokalA !== vokalB) return vokalB - vokalA; // DESC

  // SERI
  return 0;
}

/**
 * Tentukan status penilaian peserta
 */
export function getStatusPenilaian({ adab_done, vokal_done, banjari_done, jingle_done }) {
  const mainDone = [adab_done, vokal_done, banjari_done];
  const doneCount = mainDone.filter(Boolean).length;

  if (doneCount === 0)  return { label: 'Belum Dinilai', color: 'var(--text-muted)', code: 'none' };
  if (doneCount < 3)    return { label: `${doneCount}/3 Bidang`, color: 'var(--gold-400)', code: 'partial' };
  if (!jingle_done)     return { label: 'Utama Selesai', color: 'var(--emerald-400)', code: 'main_done' };
  return                       { label: 'Semua Selesai',  color: '#818cf8',            code: 'complete' };
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
  return              { label: 'Perlu Perbaikan',color: 'var(--text-muted)',  emoji: '📝' };
}

// ── Legacy aliases (backward compat) ──────────────────────
export const calcScoreFromRow     = () => null; // deprecated
export const calcAverageFromJuries = () => null; // deprecated
export const calcScoreTotal        = calcBidangTotal;
export const calcUmumTotal         = calcBidangTotal;
export const calcJingleTotal       = calcBidangTotal;
