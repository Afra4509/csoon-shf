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
import { calcSubtotalKriteria, calcBidangTotal, formatScore } from '../utils/scoreCalc';
import './JuriPanel.css';

/* ── Konfigurasi bidang ─────────────────────────────────── */
const BIDANG_CONFIG = {
  adab:    { label: 'Adab dan Syair',     maxScore: 30, color: 'var(--gold-400)',     desc: 'Juri: Gus Dawud Zahiruddin' },
  vokal:   { label: 'Bidang Suara/Vokal', maxScore: 40, color: 'var(--emerald-400)', desc: 'Juri: Gus Munawwirul Mukin' },
  banjari: { label: 'Musik Banjari',      maxScore: 30, color: '#818cf8',             desc: 'Juri: Gus Muhsin' },
  jingle:  { label: 'Jingle',             maxScore: 30, color: '#f472b6',             desc: 'Juri: (dalam konfirmasi)' },
};

/* ── Komponen: baris kriteria dalam tabel ───────────────── */
function KriteriaRow({ no, label, jali, khafi, onChange }) {
  const subtotal = calcSubtotalKriteria(jali, khafi);
  const hasVal   = jali !== '' || khafi !== '';

  return (
    <tr className={`kriteria-row ${hasVal ? 'kriteria-row--filled' : ''}`}>
      <td className="td-no">{no}</td>
      <td className="td-label">{label}</td>
      <td className="td-score">
        <input
          type="number" min={0} max={100} step={0.5}
          className="score-input"
          placeholder="—"
          value={jali}
          onChange={e => onChange('jali', e.target.value)}
        />
      </td>
      <td className="td-score">
        <input
          type="number" min={0} max={100} step={0.5}
          className="score-input"
          placeholder="—"
          value={khafi}
          onChange={e => onChange('khafi', e.target.value)}
        />
      </td>
      <td className="td-subtotal">
        <span className={hasVal ? 'subtotal-value' : 'subtotal-empty'}>
          {hasVal ? subtotal.toFixed(2) : '—'}
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
        <div className="glass-card juri-bidang-badge" style={{ borderLeft: `3px solid ${bidangCfg.color}` }}>
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
      <div className="glass-card juri-progress-card">
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
        <div className="glass-card juri-stat">
          <div className="juri-stat-value" style={{ color: 'var(--emerald-400)' }}>{participants.length}</div>
          <div className="juri-stat-label">Total Peserta</div>
        </div>
        <div className="glass-card juri-stat">
          <div className="juri-stat-value" style={{ color: bidangCfg.color || 'var(--gold-400)' }}>{scoredIds.size}</div>
          <div className="juri-stat-label">Sudah Dinilai</div>
        </div>
        <div className="glass-card juri-stat">
          <div className="juri-stat-value" style={{ color: 'var(--red-400)' }}>{notDone.length}</div>
          <div className="juri-stat-label">Belum Dinilai</div>
        </div>
      </div>

      {/* Belum dinilai */}
      {notDone.length > 0 && (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
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

  const [selected,  setSelected]  = useState(participants[0]?.id || '');
  const [search,    setSearch]    = useState('');
  const [isSaving,  setIsSaving]  = useState(false);
  const [savedAt,   setSavedAt]   = useState(null);

  // Form state: { [criteriaId]: { jali: '', khafi: '' } }
  const emptyForm = () => {
    const f = {};
    criteria.forEach(c => { f[c.id] = { jali: '', khafi: '' }; });
    return { scores: f, catatan: '', pengurangan: '' };
  };

  const [form, setForm] = useState(emptyForm());

  const peserta    = participants.find(p => p.id === selected);
  const myScores   = allScores.filter(s => s.judge_id === user?.id && s.field_id === bidang);
  const scoredIds  = new Set(myScores.map(s => s.participant_id));

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
      // Fill missing criteria with empty
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
    return participants.filter(p =>
      p.group_name?.toLowerCase().includes(q) ||
      String(p.no_urut).includes(q) ||
      p.school_name?.toLowerCase().includes(q)
    );
  }, [participants, search]);

  // Live preview total bidang
  const preview = useMemo(() => {
    const subs = criteria.map(c => {
      const v = form.scores[c.id] || {};
      return calcSubtotalKriteria(v.jali, v.khafi);
    });
    const raw    = subs.reduce((a, b) => a + b, 0);
    const deduct = parseFloat(form.pengurangan) || 0;
    const total  = Math.max(0, raw - deduct);
    return { raw: parseFloat(raw.toFixed(2)), deduct, total: parseFloat(total.toFixed(2)) };
  }, [form, criteria]);

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

    // Validate: semua kriteria harus diisi
    const missing = criteria.filter(c => {
      const v = form.scores[c.id] || {};
      return v.jali === '' || v.khafi === '';
    });
    if (missing.length > 0) {
      toast.error(`Isi nilai JALI dan KHAFI untuk semua ${criteria.length} kriteria.`);
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
    } else {
      toast.error(res.error || 'Gagal menyimpan nilai.');
    }
  };

  if (!bidang) {
    return (
      <div className="juri-tab">
        <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
          <AlertCircle size={40} style={{ color: 'var(--gold-400)', margin: '0 auto 16px' }} />
          <h3 className="text-title">Bidang Belum Ditetapkan</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
            Admin belum menetapkan bidang penilaian untuk akun Anda. Hubungi admin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="juri-tab">
      <div className="juri-tab-header">
        <h2 className="text-title">Input Nilai — {bidangCfg.label}</h2>
      </div>

      <div className="juri-input-layout">
        {/* Daftar peserta */}
        <div className="juri-picker glass-card">
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
            {filtered.map(p => {
              const isDone = scoredIds.has(p.id);
              return (
                <button
                  key={p.id}
                  className={`juri-picker-item ${selected === p.id ? 'juri-picker-item--active' : ''}`}
                  onClick={() => setSelected(p.id)}
                >
                  <div className="juri-picker-item-info">
                    <div className="juri-picker-item-name">{p.group_name}</div>
                    <div className="juri-picker-item-meta">
                      #{p.no_urut} · <span className={`badge badge-xs ${p.kategori === 'smp' ? 'badge-gold' : 'badge-green'}`}>{p.kategori.toUpperCase()}</span>
                    </div>
                  </div>
                  {isDone
                    ? <CheckCircle size={15} style={{ color: 'var(--emerald-400)', flexShrink: 0 }} />
                    : <Clock size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Tidak ada peserta
              </div>
            )}
          </div>
        </div>

        {/* Form penilaian */}
        <div className="juri-form-wrap">
          {peserta ? (
            <>
              {/* Header peserta */}
              <div className="form-penilaian-header glass-card">
                <div className="form-penilaian-meta">
                  <div className="form-penilaian-label">FORM PENILAIAN</div>
                  <div className="form-penilaian-info">
                    <span>No. Tampil: <strong>{peserta.no_urut}</strong></span>
                    <span>Nama Group: <strong>{peserta.group_name}</strong></span>
                    <span>Tingkat Pelajar: <strong>{peserta.tingkat_pelajar || peserta.kategori?.toUpperCase()}</strong></span>
                  </div>
                </div>
                {scoredIds.has(peserta.id) && (
                  <div className="juri-already-badge">
                    <CheckCircle size={14} /> Sudah dinilai — edit di sini
                  </div>
                )}
              </div>

              <form onSubmit={handleSave}>
                {/* Tabel penilaian — sesuai form resmi */}
                <div className="tabel-penilaian-wrap glass-card">
                  <table className="tabel-penilaian">
                    <thead>
                      <tr>
                        <th className="th-no">No.</th>
                        <th className="th-kriteria">{bidangCfg.label.toUpperCase()} ({bidangCfg.maxScore})</th>
                        <th className="th-jali">JALI</th>
                        <th className="th-khafi">KHAFI</th>
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
                        />
                      ))}
                    </tbody>
                  </table>

                  {/* Summary bawah tabel */}
                  <div className="tabel-summary">
                    <div className="tabel-summary-row">
                      <span>Nilai Sebelum Pengurangan:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{formatScore(preview.raw)}</strong>
                    </div>
                    <div className="tabel-summary-row">
                      <label htmlFor="pengurangan" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        Pengurangan Nilai:
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          id="pengurangan"
                          type="number" min={0} step={0.5}
                          className="score-input pengurangan-input"
                          placeholder="0"
                          value={form.pengurangan}
                          onChange={e => setForm(prev => ({ ...prev, pengurangan: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="tabel-summary-row tabel-summary-total">
                      <span>TOTAL AKHIR:</span>
                      <strong
                        style={{
                          color: bidangCfg.color,
                          fontSize: '1.25rem',
                        }}
                      >
                        {formatScore(preview.total)}
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 4 }}>
                          / {bidangCfg.maxScore}
                        </span>
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Catatan Dewan Juri */}
                <div className="glass-card catatan-wrap">
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
                      : <><Save size={17} />Simpan Nilai</>}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="juri-form-empty glass-card">
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

      <div className="glass-card" style={{ overflow: 'hidden' }}>
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
                const result  = calcBidangTotal(pScores, note?.pengurangan || 0);
                const latestScore = pScores.reduce((a, b) =>
                  new Date(a.updated_at) > new Date(b.updated_at) ? a : b, pScores[0]);

                return (
                  <tr key={pid}>
                    <td style={{ color: 'var(--text-muted)', fontWeight: 700 }}>#{p?.no_urut || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{p?.group_name || '—'}</td>
                    {criteria.map(c => {
                      const s = pScores.find(sc => sc.criteria_id === c.id);
                      const sub = s ? calcSubtotalKriteria(s.nilai_jali, s.nilai_khafi) : null;
                      return (
                        <td key={c.id} style={{ textAlign: 'center' }}>
                          {sub != null ? (
                            <span title={`JALI: ${s.nilai_jali} | KHAFI: ${s.nilai_khafi}`}>
                              {sub.toFixed(2)}
                            </span>
                          ) : '—'}
                        </td>
                      );
                    })}
                    <td style={{ textAlign: 'center', color: 'var(--red-400)' }}>
                      {note?.pengurangan > 0 ? `-${note.pengurangan}` : '—'}
                    </td>
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
