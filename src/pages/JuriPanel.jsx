import { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, Edit3, History, LogOut, Save,
  CheckCircle, Clock, Search, AlertCircle, Menu,
  RefreshCw, ChevronRight, Award, Minus, Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useScoreStore } from '../store/scoreStore';
import { calcSubtotalByField, BIDANG_CRITERIA_MAX, calcBidangTotal, formatScore } from '../utils/scoreCalc';
import './JuriPanel.css';

/* ── Konfigurasi bidang ─────────────────────────────────── */
const BIDANG_CONFIG = {
  adab:    { label: 'Adab dan Syair',     maxScore: 30, color: 'var(--gold-400)',     desc: 'Juri: Gus Dawud Zahiruddin' },
  vokal:   { label: 'Bidang Suara/Vokal', maxScore: 40, color: 'var(--emerald-400)', desc: 'Juri: Gus Munawwirul Mukin' },
  banjari: { label: 'Musik Banjari',      maxScore: 30, color: '#818cf8',             desc: 'Juri: Gus Muhsin' },
  jingle:  { label: 'Jingle',             maxScore: 30, color: '#f472b6',             desc: 'Juri: (dalam konfirmasi)' },
};

/* ── Komponen: baris kriteria dalam tabel (sistem PENGURANGAN) ── */
function KriteriaRow({ no, label, jali, khafi, onChange, maxKriteria = 10 }) {
  const j   = parseFloat(jali)  || 0;
  const k   = parseFloat(khafi) || 0;
  const sub = parseFloat(Math.max(0, maxKriteria - j - k).toFixed(2));
  const hasVal = jali !== '' || khafi !== '';
  const isFull = hasVal && sub === maxKriteria;
  const isZero = hasVal && sub === 0;

  return (
    <tr className={`kriteria-row ${hasVal ? 'kriteria-row--filled' : ''}`}>
      <td className="td-no">{no}</td>
      <td className="td-label">{label}</td>
      <td className="td-maks" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: 600 }}>
        {maxKriteria}
      </td>
      <td className="td-score">
        <input
          type="number" min={0} max={maxKriteria} step={0.5}
          className={`score-input ${jali !== '' && parseFloat(jali) > 0 ? 'score-input--deduct' : ''}`}
          placeholder="0"
          value={jali}
          onChange={e => onChange('jali', e.target.value)}
        />
      </td>
      <td className="td-score">
        <input
          type="number" min={0} max={maxKriteria} step={0.5}
          className={`score-input ${khafi !== '' && parseFloat(khafi) > 0 ? 'score-input--deduct' : ''}`}
          placeholder="0"
          value={khafi}
          onChange={e => onChange('khafi', e.target.value)}
        />
      </td>
      <td className="td-subtotal">
        <span
          className={hasVal ? (isZero ? 'subtotal-zero' : isFull ? 'subtotal-full' : 'subtotal-value') : 'subtotal-empty'}
          title={hasVal ? `${maxKriteria} - ${j} - ${k} = ${sub}` : undefined}
        >
          {hasVal ? sub.toFixed(2) : '—'}
        </span>
      </td>
    </tr>
  );
}

/* ── Tab: Dashboard Juri ────────────────────────────────── */
function DashboardJuriTab({ user, participants, allScores }) {
  const bidang   = user?.bidang;
  const bidangCfg = BIDANG_CONFIG[bidang] || {};

  // Hitung berapa peserta sudah dinilai di bidang ini
  const myFieldScores = allScores.filter(
    s => s.judge_id === user?.id && s.field_id === bidang
  );
  const scoredIds = new Set(myFieldScores.map(s => s.participant_id));
  const notDone   = participants.filter(p => !scoredIds.has(p.id));
  const pct       = participants.length
    ? Math.round((scoredIds.size / participants.length) * 100)
    : 0;

  return (
    <div className="juri-tab">
      <div className="juri-tab-header">
        <div>
          <h2 className="text-title">Selamat datang, {user?.full_name}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
            Panel Juri — SMADA Hadrah Festival · 6 September 2026
          </p>
        </div>
      </div>

      {/* Bidang badge */}
      {bidang && (
        <div className="juri-card juri-bidang-badge" style={{ borderLeft: `3px solid ${bidangCfg.color}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: bidangCfg.color, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{bidangCfg.label}</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Maks. {bidangCfg.maxScore} poin · {bidangCfg.desc}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress card */}
      <div className="juri-card juri-progress-card">
        <div className="juri-progress-header">
          <div>
            <div className="juri-progress-title">Progress Penilaian Anda</div>
            <div className="juri-progress-sub">
              {scoredIds.size} dari {participants.length} peserta sudah dinilai
            </div>
          </div>
          <div className="juri-progress-pct" style={{ color: pct === 100 ? 'var(--emerald-400)' : bidangCfg.color || 'var(--gold-400)' }}>
            {pct}%
          </div>
        </div>
        <div className="juri-progress-bar-wrap">
          <div className="juri-progress-bar">
            <div
              className="juri-progress-fill"
              style={{
                width: `${pct}%`,
                background: pct === 100
                  ? 'linear-gradient(90deg, var(--emerald-500), var(--emerald-400))'
                  : `linear-gradient(90deg, ${bidangCfg.color || 'var(--gold-500)'}, ${bidangCfg.color || 'var(--gold-400)'})`,
              }}
            />
          </div>
        </div>
        {pct === 100 && (
          <div className="juri-done-badge">
            <CheckCircle size={16} /> Semua peserta sudah dinilai! Terima kasih.
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="juri-stats-row">
        <div className="juri-card juri-stat">
          <div className="juri-stat-value" style={{ color: 'var(--emerald-400)' }}>{participants.length}</div>
          <div className="juri-stat-label">Total Peserta</div>
        </div>
        <div className="juri-card juri-stat">
          <div className="juri-stat-value" style={{ color: bidangCfg.color || 'var(--gold-400)' }}>{scoredIds.size}</div>
          <div className="juri-stat-label">Sudah Dinilai</div>
        </div>
        <div className="juri-card juri-stat">
          <div className="juri-stat-value" style={{ color: 'var(--red-400)' }}>{notDone.length}</div>
          <div className="juri-stat-label">Belum Dinilai</div>
        </div>
      </div>

      {/* Belum dinilai */}
      {notDone.length > 0 && (
        <div className="juri-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} style={{ color: 'var(--gold-400)' }} />
            <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Peserta Belum Dinilai</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>No.</th><th>Nama Grup</th><th>Sekolah</th><th>Kategori</th></tr>
              </thead>
              <tbody>
                {notDone.map(p => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--text-muted)', fontWeight: 700 }}>#{p.no_urut}</td>
                    <td style={{ fontWeight: 600 }}>{p.group_name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{p.school_name || '—'}</td>
                    <td>
                      <span className={`badge ${p.kategori === 'smp' ? 'badge-gold' : 'badge-green'}`}>
                        {p.kategori.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Tab: Input Nilai ────────────────────────────────────── */
function InputNilaiTab({ user, participants, allScores, allNotes, scoringCriteria, saveFieldScores }) {
  const bidang     = user?.bidang;
  const bidangCfg  = BIDANG_CONFIG[bidang] || {};
  const criteria   = scoringCriteria.filter(c => c.field_id === bidang);

  const [selected,  setSelected]  = useState('');
  const [search,    setSearch]    = useState('');
  const [isSaving,  setIsSaving]  = useState(false);
  const [savedAt,   setSavedAt]   = useState(null);
  const [allDone,   setAllDone]   = useState(false);

  // Form state: { [criteriaId]: { jali: '', khafi: '' } }
  const emptyForm = () => {
    const f = {};
    criteria.forEach(c => { f[c.id] = { jali: '', khafi: '' }; });
    return { scores: f, catatan: '', pengurangan: '' };
  };

  const [form, setForm] = useState(emptyForm());

  // Peserta yang sudah dinilai oleh juri ini di bidang ini
  const myScores  = allScores.filter(s => s.judge_id === user?.id && s.field_id === bidang);
  const scoredIds = new Set(myScores.map(s => s.participant_id));

  // Hanya tampilkan yang BELUM dinilai di daftar kiri
  const unscoredList = participants
    .filter(p => !scoredIds.has(p.id))
    .sort((a, b) => a.no_urut - b.no_urut);

  const peserta = participants.find(p => p.id === selected);

  // Saat mount atau setelah data berubah: pilih peserta pertama yang belum dinilai
  useEffect(() => {
    if (!bidang) return;
    // Jika selected masih valid (belum dinilai), biarkan
    if (selected && !scoredIds.has(selected)) return;
    // Jika selected sudah dinilai atau kosong, pilih peserta berikutnya
    const first = participants
      .filter(p => !scoredIds.has(p.id))
      .sort((a, b) => a.no_urut - b.no_urut)[0];
    if (first) {
      setSelected(first.id);
    } else {
      setSelected('');
      setAllDone(true);
    }
  }, [allScores.length, bidang]);

  // Load existing scores when switching participant
  useEffect(() => {
    if (!selected || !bidang) return;
    const existing = myScores.filter(s => s.participant_id === selected);
    const existingNote = allNotes.find(
      n => n.participant_id === selected && n.field_id === bidang && n.judge_id === user?.id
    );
    setSavedAt(null);

    if (existing.length > 0) {
      const scores = {};
      existing.forEach(s => {
        scores[s.criteria_id] = {
          jali:  s.nilai_jali  != null ? String(s.nilai_jali)  : '',
          khafi: s.nilai_khafi != null ? String(s.nilai_khafi) : '',
        };
      });
      criteria.forEach(c => { if (!scores[c.id]) scores[c.id] = { jali: '', khafi: '' }; });
      setForm({
        scores,
        catatan:     existingNote?.catatan || '',
        pengurangan: existingNote?.pengurangan != null ? String(existingNote.pengurangan) : '',
      });
    } else {
      setForm(emptyForm());
    }
  }, [selected, allScores.length, allNotes.length, bidang, user?.id]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return unscoredList.filter(p =>
      p.group_name?.toLowerCase().includes(q) ||
      String(p.no_urut).includes(q) ||
      p.school_name?.toLowerCase().includes(q)
    );
  }, [unscoredList, search]);

  // Nilai maksimal per kriteria untuk bidang ini
  const maxKriteria = BIDANG_CRITERIA_MAX[bidang] ?? 10;

  // Live preview total bidang (sistem PENGURANGAN: maks - jali - khafi)
  const preview = useMemo(() => {
    const subs = criteria.map(c => {
      const v = form.scores[c.id] || {};
      const j = parseFloat(v.jali)  || 0;
      const k = parseFloat(v.khafi) || 0;
      return Math.max(0, parseFloat((maxKriteria - j - k).toFixed(2)));
    });
    const raw   = parseFloat(subs.reduce((a, b) => a + b, 0).toFixed(2));
    const total = raw;
    return { raw, total, maxBidang: bidangCfg.maxScore };
  }, [form, criteria, maxKriteria, bidangCfg.maxScore]);

  const setScore = (criteriaId, type, val) => {
    setForm(prev => ({
      ...prev,
      scores: {
        ...prev.scores,
        [criteriaId]: { ...(prev.scores[criteriaId] || {}), [type]: val },
      },
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selected || !user?.id || !bidang) return;

    // Validate: semua kriteria harus diisi (nilai 0 valid, string kosong tidak)
    const missing = criteria.filter(c => {
      const v = form.scores[c.id] || {};
      return v.jali === '' || v.khafi === '';
    });
    if (missing.length > 0) {
      toast.error(`Isi kolom JALI dan KHAFI untuk semua ${criteria.length} kriteria. (Isi 0 jika tidak ada pengurangan)`);
      return;
    }

    setIsSaving(true);
    const res = await saveFieldScores(
      selected,
      user.id,
      bidang,
      form.scores,
      form.catatan,
      form.pengurangan,
    );
    setIsSaving(false);

    if (res.success) {
      setSavedAt(new Date());
      toast.success(`✅ Nilai ${peserta?.group_name} berhasil disimpan!`);

      // Auto-advance ke peserta berikutnya yang belum dinilai
      // scoredIds belum include yang baru saja disimpan (state belum update),
      // jadi kita tambahkan secara manual untuk mencari next
      const currentId = selected;
      const currentNoUrut = peserta?.no_urut ?? 0;

      // Tunggu state refresh dari fetchAllScores (dipanggil di saveFieldScores)
      // lalu pilih next unscored
      setTimeout(() => {
        // Setelah store refresh, scoredIds akan include currentId
        const nextUnscored = participants
          .filter(p => p.id !== currentId && !scoredIds.has(p.id))
          .sort((a, b) => {
            // Prioritaskan no_urut yang lebih besar dari peserta saat ini
            const aAfter = a.no_urut > currentNoUrut ? 0 : 1;
            const bAfter = b.no_urut > currentNoUrut ? 0 : 1;
            if (aAfter !== bAfter) return aAfter - bAfter;
            return a.no_urut - b.no_urut;
          })[0];

        if (nextUnscored) {
          setSelected(nextUnscored.id);
          setForm(emptyForm());
          setSavedAt(null);
        } else {
          // Cek apakah memang semua sudah dinilai
          setSelected('');
          setAllDone(true);
        }
      }, 1200);
    } else {
      toast.error(res.error || 'Gagal menyimpan nilai.');
    }
  };

  if (!bidang) {
    return (
      <div className="juri-tab">
        <div className="juri-card" style={{ padding: 40, textAlign: 'center' }}>
          <AlertCircle size={40} style={{ color: 'var(--gold-400)', margin: '0 auto 16px' }} />
          <h3 className="text-title">Bidang Belum Ditetapkan</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
            Admin belum menetapkan bidang penilaian untuk akun Anda. Hubungi admin.
          </p>
        </div>
      </div>
    );
  }

  const totalPeserta  = participants.length;
  const sudahCount    = scoredIds.size;
  const belumCount    = totalPeserta - sudahCount;

  return (
    <div className="juri-tab">
      <div className="juri-tab-header">
        <h2 className="text-title">Input Nilai — {bidangCfg.label}</h2>
      </div>

      <div className="juri-input-layout">
        {/* Daftar peserta (hanya yang BELUM dinilai) */}
        <div className="juri-picker juri-card">
          {/* Progress mini */}
          <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', gap: 12, fontSize: '0.8rem', fontWeight: 600 }}>
              <span style={{ color: 'var(--red-400)' }}>BELUM: {belumCount}</span>
              <span style={{ color: 'var(--emerald-400)' }}>SUDAH: {sudahCount}</span>
            </div>
          </div>
          <div className="juri-picker-search">
            <div className="input-with-icon">
              <Search size={14} className="input-icon" />
              <input
                type="search"
                className="input-field"
                placeholder="Cari peserta..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ fontSize: '0.8125rem' }}
              />
            </div>
          </div>
          <div className="juri-picker-list">
            {filtered.length === 0 && belumCount === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <CheckCircle size={32} style={{ color: 'var(--emerald-400)', margin: '0 auto 10px', display: 'block' }} />
                <div style={{ color: 'var(--emerald-400)', fontWeight: 700, fontSize: '0.9rem' }}>Semua Selesai!</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 4 }}>Semua peserta telah dinilai</div>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Tidak ada peserta ditemukan
              </div>
            ) : (
              filtered.map(p => (
                <button
                  key={p.id}
                  className={`juri-picker-item ${selected === p.id ? 'juri-picker-item--active' : ''}`}
                  onClick={() => { setSelected(p.id); setSavedAt(null); }}
                >
                  <div className="juri-picker-item-info">
                    <div className="juri-picker-item-name">{p.group_name}</div>
                    <div className="juri-picker-item-meta">
                      <span className="juri-picker-item-no">#{p.no_urut}</span>
                      <span className={`badge badge-xs ${p.kategori === 'smp' ? 'badge-gold' : 'badge-green'}`}>{p.kategori.toUpperCase()}</span>
                    </div>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Form penilaian */}
        <div className="juri-form-wrap">
          {allDone || (!selected && belumCount === 0) ? (
            <div className="juri-card" style={{ padding: 48, textAlign: 'center' }}>
              <CheckCircle size={52} style={{ color: 'var(--emerald-400)', margin: '0 auto 16px', display: 'block' }} />
              <h3 className="text-title" style={{ color: 'var(--emerald-400)' }}>🎉 Semua Peserta Selesai Dinilai!</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
                Anda telah menyelesaikan penilaian untuk seluruh {totalPeserta} peserta bidang {bidangCfg.label}.
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 16 }}>
                Buka tab <strong>Riwayat</strong> untuk melihat semua nilai yang telah diinput.
              </p>
            </div>
          ) : peserta ? (
            <>
              {/* Header peserta */}
              <div className="form-penilaian-header juri-card">
                <div className="form-penilaian-meta">
                  <div className="form-penilaian-label">FORM PENILAIAN</div>
                  <div className="form-penilaian-info">
                    <span>No. Tampil: <strong>{peserta.no_urut}</strong></span>
                    <span>Nama Group: <strong>{peserta.group_name}</strong></span>
                    <span>Tingkat Pelajar: <strong>{peserta.tingkat_pelajar || peserta.kategori?.toUpperCase()}</strong></span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSave}>
                {/* Tabel penilaian — sesuai form resmi */}
                <div className="tabel-penilaian-wrap juri-card">
                  <table className="tabel-penilaian">
                    <thead>
                      <tr>
                        <th className="th-no">No.</th>
                        <th className="th-kriteria" style={{ textAlign: 'left' }}>{bidangCfg.label.toUpperCase()}</th>
                        <th className="th-maks" title="Nilai maksimal per kriteria">Maks.</th>
                        <th className="th-jali"><span style={{ color: '#f87171' }}>JALI</span><br/><span style={{ fontSize: '0.65rem', fontWeight: 400, color: 'var(--text-muted)', letterSpacing: 0 }}>(pengurangan)</span></th>
                        <th className="th-khafi"><span style={{ color: '#fb923c' }}>KHAFI</span><br/><span style={{ fontSize: '0.65rem', fontWeight: 400, color: 'var(--text-muted)', letterSpacing: 0 }}>(pengurangan)</span></th>
                        <th className="th-total">SUBTOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {criteria.map((c, idx) => (
                        <KriteriaRow
                          key={c.id}
                          no={idx + 1}
                          label={c.label}
                          jali={form.scores[c.id]?.jali ?? ''}
                          khafi={form.scores[c.id]?.khafi ?? ''}
                          onChange={(type, val) => setScore(c.id, type, val)}
                          maxKriteria={maxKriteria}
                        />
                      ))}
                    </tbody>
                  </table>

                  {/* Summary bawah tabel */}
                  <div className="tabel-summary">
                    <div className="tabel-summary-row" style={{ fontSize: '0.8125rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Nilai Maksimal Bidang</span>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{bidangCfg.maxScore} poin ({criteria.length} kriteria × {maxKriteria} poin)</span>
                    </div>
                    <div className="tabel-summary-row">
                      <span>Total Pengurangan (JALI + KHAFI)</span>
                      <strong style={{ color: preview.maxBidang - preview.total > 0 ? '#f87171' : 'var(--text-muted)' }}>
                        -{formatScore(preview.maxBidang - preview.total)}
                      </strong>
                    </div>
                    <div className="tabel-summary-row tabel-summary-total">
                      <span>TOTAL NILAI {bidangCfg.label.toUpperCase()}:</span>
                      <strong style={{ color: bidangCfg.color, fontSize: '1.375rem' }}>
                        {formatScore(preview.total)}
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginLeft: 6 }}>/ {bidangCfg.maxScore}</span>
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Catatan Dewan Juri */}
                <div className="juri-card catatan-wrap">
                  <label className="catatan-label">Catatan Dewan Juri:</label>
                  <textarea
                    className="input-field catatan-input"
                    rows={4}
                    placeholder="Tuliskan catatan, komentar, atau masukan untuk peserta..."
                    value={form.catatan}
                    onChange={e => setForm(prev => ({ ...prev, catatan: e.target.value }))}
                  />
                </div>

                {/* Tombol simpan + indikator */}
                <div className="form-actions">
                  {savedAt && (
                    <div className="saved-indicator">
                      <CheckCircle size={16} />
                      Disimpan pada {savedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  )}
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={isSaving}
                  >
                    {isSaving
                      ? <><span className="login-spinner" />Menyimpan...</>
                      : <><Save size={17} />Simpan & Lanjut</>}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="juri-form-empty juri-card">
              <Edit3 size={40} style={{ color: 'var(--text-muted)' }} />
              <p>Pilih peserta dari daftar untuk mulai menilai</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Tab: Riwayat Penilaian ─────────────────────────────── */
function RiwayatTab({ user, participants, allScores, allNotes, scoringCriteria }) {
  const bidang  = user?.bidang;
  const bidangCfg = BIDANG_CONFIG[bidang] || {};
  const criteria = scoringCriteria.filter(c => c.field_id === bidang);

  const myScores = allScores.filter(s => s.judge_id === user?.id && s.field_id === bidang);
  const scoredParticipantIds = [...new Set(myScores.map(s => s.participant_id))];

  return (
    <div className="juri-tab">
      <div className="juri-tab-header">
        <h2 className="text-title">Riwayat Penilaian — {bidangCfg.label}</h2>
        <span className="badge badge-green">{scoredParticipantIds.length} peserta dinilai</span>
      </div>

      <div className="juri-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Nama Grup</th>
                {criteria.map(c => (
                  <th key={c.id} style={{ whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                    {c.label}
                  </th>
                ))}
                <th>Pengurangan</th>
                <th>Total Akhir</th>
                <th>Waktu</th>
              </tr>
            </thead>
            <tbody>
              {scoredParticipantIds.length === 0 ? (
                <tr>
                  <td colSpan={criteria.length + 5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                    Belum ada nilai yang diinput
                  </td>
                </tr>
              ) : scoredParticipantIds.map(pid => {
                const p       = participants.find(x => x.id === pid);
                const pScores = myScores.filter(s => s.participant_id === pid);
                const note    = allNotes.find(n => n.participant_id === pid && n.field_id === bidang && n.judge_id === user?.id);
                const maks    = BIDANG_CRITERIA_MAX[bidang] ?? 10;
                const result  = calcBidangTotal(pScores, 0, bidang);
                const latestScore = pScores.reduce((a, b) =>
                  new Date(a.updated_at) > new Date(b.updated_at) ? a : b, pScores[0]);

                return (
                  <tr key={pid}>
                    <td style={{ color: 'var(--text-muted)', fontWeight: 700 }}>#{p?.no_urut || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{p?.group_name || '—'}</td>
                    {criteria.map(c => {
                      const s   = pScores.find(sc => sc.criteria_id === c.id);
                      // Hitung subtotal dengan rumus baru: maks - jali - khafi
                      const sub = s ? parseFloat(Math.max(0, maks - (s.nilai_jali || 0) - (s.nilai_khafi || 0)).toFixed(2)) : null;
                      return (
                        <td key={c.id} style={{ textAlign: 'center' }}>
                          {sub != null ? (
                            <span title={`${maks} - ${s.nilai_jali} - ${s.nilai_khafi} = ${sub}`} style={{ fontWeight: 600 }}>
                              {sub.toFixed(2)}
                            </span>
                          ) : '—'}
                        </td>
                      );
                    })}
                    <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>—</td>
                    <td style={{ fontWeight: 700, color: bidangCfg.color }}>
                      {result.isEmpty ? '—' : formatScore(result.total)}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                      {latestScore?.updated_at
                        ? new Date(latestScore.updated_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Main JuriPanel ─────────────────────────────────────── */
const NAV = [
  { id: 'dashboard', label: 'Dashboard',   icon: <LayoutDashboard size={18} /> },
  { id: 'input',     label: 'Input Nilai', icon: <Edit3 size={18} /> },
  { id: 'riwayat',   label: 'Riwayat',    icon: <History size={18} /> },
];

export default function JuriPanel() {
  const [activeTab,   setActiveTab]   = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();

  const {
    participants, allScores, allNotes, scoringCriteria,
    fetchAllParticipants, fetchAllScores, fetchAllNotes,
    fetchScoringMaster, saveFieldScores,
  } = useScoreStore();

  useEffect(() => {
    if (!user?.id) return;
    fetchAllParticipants();
    fetchAllScores();
    fetchAllNotes();
    fetchScoringMaster();
  }, [user?.id]);

  const bidang    = user?.bidang;
  const bidangCfg = BIDANG_CONFIG[bidang] || {};

  const myFieldScores = allScores.filter(
    s => s.judge_id === user?.id && s.field_id === bidang
  );
  const scoredCount   = new Set(myFieldScores.map(s => s.participant_id)).size;

  const handleRefresh = () => {
    fetchAllParticipants();
    fetchAllScores();
    fetchAllNotes();
  };

  return (
    <div className="juri-panel">
      {/* Sidebar */}
      <aside className={`juri-sidebar ${sidebarOpen ? 'juri-sidebar--open' : ''}`}>
        <div className="juri-sidebar-logo">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div className="juri-logo-img">
              <img src="/rela.jpg" alt="SHF" />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)' }}>SHF Juri</div>
              <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {user?.full_name || 'Panel Juri'}
              </div>
            </div>
          </Link>
        </div>

        {/* Bidang info */}
        {bidang && (
          <div style={{ padding: '8px 16px 0' }}>
            <div style={{
              background: `${bidangCfg.color}18`,
              border: `1px solid ${bidangCfg.color}30`,
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: '0.75rem',
            }}>
              <div style={{ color: bidangCfg.color, fontWeight: 700 }}>{bidangCfg.label}</div>
              <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>Maks. {bidangCfg.maxScore} poin</div>
            </div>
          </div>
        )}

        <nav className="juri-sidebar-nav">
          {NAV.map(item => (
            <button
              key={item.id}
              className={`juri-nav-item ${activeTab === item.id ? 'juri-nav-item--active' : ''}`}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="juri-sidebar-footer">
          <div style={{ padding: '8px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <div className="status-dot live" style={{ display: 'inline-block', marginRight: 6 }} />
            {user?.full_name}
          </div>
          <button className="juri-nav-item" onClick={logout} style={{ color: 'var(--text-muted)' }}>
            <LogOut size={18} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="juri-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <div className="juri-main">
        <header className="juri-topbar">
          <button className="btn btn-ghost btn-icon juri-menu-btn" onClick={() => setSidebarOpen(v => !v)}>
            <Menu size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            <button className="btn btn-outline btn-sm" onClick={handleRefresh} title="Refresh data">
              <RefreshCw size={14} /> Refresh
            </button>
            {bidang && (
              <span className="badge" style={{ background: `${bidangCfg.color}20`, color: bidangCfg.color, border: `1px solid ${bidangCfg.color}40` }}>
                {scoredCount}/{participants.length} Dinilai
              </span>
            )}
          </div>
        </header>

        <div className="juri-content container">
          {activeTab === 'dashboard' && (
            <DashboardJuriTab user={user} participants={participants} allScores={allScores} />
          )}
          {activeTab === 'input' && (
            <InputNilaiTab
              user={user}
              participants={participants}
              allScores={allScores}
              allNotes={allNotes}
              scoringCriteria={scoringCriteria}
              saveFieldScores={saveFieldScores}
            />
          )}
          {activeTab === 'riwayat' && (
            <RiwayatTab
              user={user}
              participants={participants}
              allScores={allScores}
              allNotes={allNotes}
              scoringCriteria={scoringCriteria}
            />
          )}
        </div>
      </div>
    </div>
  );
}
