import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  LogOut, RefreshCw, Clock, CheckCircle,
  BookOpen, Mic, Music, Star, Award, ChevronRight, Users
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useScoreStore } from '../store/scoreStore';
import { supabase } from '../supabase';
import { calcSubtotalByField, calcBidangTotal, formatScore, getScoreGrade } from '../utils/scoreCalc';
import QRCodeDisplay from '../components/QRCodeDisplay';
import Navbar from '../components/Navbar';
import './DashboardPage.css';

const BIDANG = [
  { id: 'adab',    label: 'Adab dan Syair',     icon: <BookOpen size={15} />, color: 'var(--gold-400)',    max: 30 },
  { id: 'vokal',   label: 'Bidang Suara/Vokal',  icon: <Mic size={15} />,     color: 'var(--emerald-400)', max: 40 },
  { id: 'banjari', label: 'Musik Banjari',        icon: <Music size={15} />,   color: '#818cf8',             max: 30 },
];

/* ── Ring SVG ── */
function ScoreRing({ value, max = 100, size = 80, color }) {
  const pct  = Math.min((value || 0) / max, 1);
  const r    = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - pct * circ;
  return (
    <div className="score-ring" style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border-subtle)" strokeWidth={6} />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color || 'var(--accent-primary)'} strokeWidth={6}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)', filter: `drop-shadow(0 0 4px ${color || 'var(--accent-primary)'})` }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <span style={{ fontWeight: 800, fontSize: size > 100 ? '1.5rem' : '0.9rem', color: color || 'var(--accent-primary)' }}>
          {value != null ? formatScore(value, 1) : '—'}
        </span>
      </div>
    </div>
  );
}

/* ── Kartu nilai satu bidang ── */
function BidangScoreCard({ bidang, scores, notes, criteriaList, isPublished }) {
  const fieldScores = scores.filter(s => s.field_id === bidang.id);
  const note        = notes.find(n => n.field_id === bidang.id);
  const result      = calcBidangTotal(fieldScores, note?.pengurangan || 0, bidang.id);
  const isDone      = fieldScores.length > 0;
  const grade       = isDone ? getScoreGrade((result.total / bidang.max) * 100) : null;

  // Nilai per kriteria
  const criteria = criteriaList.filter(c => c.field_id === bidang.id);

  return (
    <div className={`bidang-card glass-card ${isDone ? 'bidang-card--done' : ''}`}
      style={{ borderLeft: `3px solid ${isDone ? bidang.color : 'var(--border-subtle)'}` }}>
      <div className="bidang-card__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ color: bidang.color }}>{bidang.icon}</div>
          <div>
            <div className="bidang-card__label">{bidang.label}</div>
            <div className="bidang-card__max">Maks. {bidang.max} poin</div>
          </div>
        </div>
        <div className="bidang-card__right">
          {isDone ? (
            <div className="bidang-card__score" style={{ color: bidang.color }}>
              {formatScore(result.total)}
              <span className="bidang-card__max-label">/{bidang.max}</span>
            </div>
          ) : (
            <div className="bidang-card__pending">
              <Clock size={14} />
              <span>Menunggu</span>
            </div>
          )}
        </div>
      </div>

      {isDone && (
        <div className="bidang-card__detail">
          {/* Detail per kriteria */}
          <div className="bidang-kriteria-list">
            {criteria.map(c => {
              const s = fieldScores.find(sc => sc.criteria_id === c.id);
              const sub = s ? calcSubtotalByField(bidang.id, s.nilai_jali, s.nilai_khafi) : null;
              return (
                <div key={c.id} className="bidang-kriteria-row">
                  <span className="bidang-kriteria-label">{c.label}</span>
                  <div className="bidang-kriteria-scores">
                    {s ? (
                      <>
                        <span className="kriteria-jali">J:{formatScore(s.nilai_jali, 1)}</span>
                        <span className="kriteria-khafi">K:{formatScore(s.nilai_khafi, 1)}</span>
                        <span className="kriteria-sub" style={{ color: bidang.color }}>{formatScore(sub, 2)}</span>
                      </>
                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="bidang-summary">
            <div className="bidang-summary-row">
              <span>Nilai Sebelum Pengurangan</span>
              <span>{formatScore(result.raw)}</span>
            </div>
            {result.pengurangan > 0 && (
              <div className="bidang-summary-row" style={{ color: 'var(--red-400)' }}>
                <span>Pengurangan</span>
                <span>−{formatScore(result.pengurangan)}</span>
              </div>
            )}
            <div className="bidang-summary-total" style={{ color: bidang.color }}>
              <span>Total {bidang.label}</span>
              <span>{formatScore(result.total)} / {bidang.max}</span>
            </div>
          </div>

          {/* Catatan juri (jika published) */}
          {isPublished && note?.catatan && (
            <div className="bidang-catatan">
              <div className="bidang-catatan-label">📝 Catatan Dewan Juri</div>
              <div className="bidang-catatan-text">"{note.catatan}"</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const { fetchMyScores, scoringCriteria, fetchScoringMaster } = useScoreStore();

  const [myScores,     setMyScores]     = useState([]);
  const [myNotes,      setMyNotes]      = useState([]);
  const [settings,     setSettings]     = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initialLoad,  setInitialLoad]  = useState(true);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    const { scores, notes } = await fetchMyScores(user.id);
    setMyScores(scores || []);
    setMyNotes(notes  || []);

    const { data: s } = await supabase.from('event_settings').select('show_judge_notes').eq('id', 1).single();
    if (s) setSettings(s);
    setInitialLoad(false);
  }, [user?.id, fetchMyScores]);

  useEffect(() => {
    loadData();
    fetchScoringMaster();

    // Realtime
    if (!user?.id) return;
    const channel = supabase
      .channel(`myscore-${user?.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'scores',
        filter: `participant_id=eq.${user?.id}`,
      }, loadData)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'judge_notes',
        filter: `participant_id=eq.${user?.id}`,
      }, loadData)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [loadData, fetchScoringMaster]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  // Hitung nilai utama (adab + vokal + banjari, maks 100)
  const bidangResults = BIDANG.map(b => {
    const fs     = myScores.filter(s => s.field_id === b.id);
    const note   = myNotes.find(n => n.field_id === b.id);
    const result = calcBidangTotal(fs, note?.pengurangan || 0, b.id);
    return { ...b, ...result, done: fs.length > 0 };
  });

  const nilaiUtama = bidangResults.every(b => b.done)
    ? bidangResults.reduce((sum, b) => sum + b.total, 0)
    : null;

  const grade      = nilaiUtama != null ? getScoreGrade(nilaiUtama) : null;
  const doneCount  = bidangResults.filter(b => b.done).length;
  const isPublished = settings?.show_judge_notes;

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-content container" style={{ paddingTop: 'calc(var(--nav-height) + 40px)', paddingBottom: 60 }}>

        {/* Header */}
        <div className="dashboard-header">
          <div className="dashboard-header__info">
            <div className="dashboard-header__greet">
              <div className={`status-dot ${user?.status === 'selesai' ? 'done' : user?.status === 'tampil' ? 'live' : 'pending'}`} />
              <span className="text-caption" style={{ color: 'var(--text-muted)' }}>
                {user?.status === 'selesai' ? 'Selesai Tampil' : user?.status === 'tampil' ? 'Sedang Tampil' : 'Menunggu Giliran'}
              </span>
            </div>
            <h1 className="text-headline" style={{ marginTop: 8 }}>{user?.group_name || 'Dashboard Peserta'}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
              No. Urut {user?.no_urut} &nbsp;·&nbsp; {user?.tingkat_pelajar || user?.kategori?.toUpperCase()}
              {user?.school_name && <>&nbsp;·&nbsp; {user.school_name}</>}
            </p>
          </div>
          <div className="dashboard-header__actions">
            <button className={`btn btn-outline btn-sm ${isRefreshing ? 'refreshing' : ''}`} onClick={handleRefresh}>
              <RefreshCw size={15} className={isRefreshing ? 'spin-icon' : ''} /> Refresh
            </button>
            <button className="btn btn-ghost btn-sm" onClick={logout}>
              <LogOut size={15} /> Keluar
            </button>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-main">
            {initialLoad ? (
              <div className="not-scored glass-card">
                <div className="login-spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
              </div>
            ) : doneCount === 0 ? (
              <div className="not-scored glass-card">
                <div className="not-scored__icon"><Clock size={40} /></div>
                <h2 className="text-title">Nilai Belum Tersedia</h2>
                <p style={{ color: 'var(--text-muted)', marginTop: 8, maxWidth: 380, textAlign: 'center' }}>
                  Nilai akan muncul otomatis setelah Dewan Juri selesai melakukan penilaian.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: 24 }}>
                  <span className="status-dot live" /> Menunggu penilaian secara realtime...
                </div>
              </div>
            ) : (
              <>
                {/* Total Nilai Utama */}
                <div className="total-score-card glass-card">
                  <div className="total-score-card__left">
                    <div className="total-score-card__label">
                      <CheckCircle size={14} /> Nilai Utama ({doneCount}/3 Bidang Selesai)
                    </div>
                    {nilaiUtama != null ? (
                      <>
                        <div className="total-score-card__value gradient-text">
                          {formatScore(nilaiUtama)} / 100
                        </div>
                        {grade && (
                          <div className="total-score-card__grade" style={{ color: grade.color }}>
                            <Award size={16} />{grade.label}
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginTop: 8 }}>
                        Menunggu semua bidang selesai dinilai...
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        Adab (30) + Vokal (40) + Musik Banjari (30) = 100
                      </span>
                    </div>
                  </div>
                  <div className="total-score-card__ring">
                    <ScoreRing
                      value={nilaiUtama}
                      max={100}
                      size={140}
                      color={grade?.color || 'var(--emerald-400)'}
                    />
                  </div>
                </div>

                {/* Progress status bidang */}
                <div className="glass-card" style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                    Status Penilaian per Bidang
                  </div>
                  <div className="bidang-status-row">
                    {BIDANG.map(b => {
                      const done = myScores.some(s => s.field_id === b.id);
                      return (
                        <div key={b.id} className={`bidang-status-chip ${done ? 'bidang-status-chip--done' : ''}`}
                          style={{ borderColor: done ? b.color : 'var(--border-subtle)', color: done ? b.color : 'var(--text-muted)' }}>
                          {done ? <CheckCircle size={13} /> : <Clock size={13} />}
                          <span>{b.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Detail per bidang */}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Nilai per Bidang
                  </div>
                  {BIDANG.map(b => (
                    <BidangScoreCard
                      key={b.id}
                      bidang={b}
                      scores={myScores}
                      notes={myNotes}
                      criteriaList={scoringCriteria}
                      isPublished={isPublished}
                    />
                  ))}
                </div>

                {/* Jingle — terpisah */}
                {(() => {
                  const jingleScores = myScores.filter(s => s.field_id === 'jingle');
                  if (jingleScores.length === 0) return null;
                  const jingleNote = myNotes.find(n => n.field_id === 'jingle');
                  const jingleResult = calcBidangTotal(jingleScores, jingleNote?.pengurangan || 0, 'jingle');
                  const jingleCriteria = scoringCriteria.filter(c => c.field_id === 'jingle');
                  return (
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Nilai Jingle (Terpisah)
                      </div>
                      <div className="bidang-card glass-card bidang-card--done" style={{ borderLeft: '3px solid #f472b6' }}>
                        <div className="bidang-card__header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Star size={15} style={{ color: '#f472b6' }} />
                            <div>
                              <div className="bidang-card__label">Jingle</div>
                              <div className="bidang-card__max">Nilai terpisah dari ranking utama</div>
                            </div>
                          </div>
                          <div className="bidang-card__score" style={{ color: '#f472b6' }}>
                            {formatScore(jingleResult.total)}
                          </div>
                        </div>
                        <div className="bidang-card__detail">
                          <div className="bidang-kriteria-list">
                            {jingleCriteria.map(c => {
                              const s = jingleScores.find(sc => sc.criteria_id === c.id);
                              const sub = s ? calcSubtotalByField('jingle', s.nilai_jali, s.nilai_khafi) : null;
                              return (
                                <div key={c.id} className="bidang-kriteria-row">
                                  <span className="bidang-kriteria-label">{c.label}</span>
                                  <div className="bidang-kriteria-scores">
                                    {sub != null ? <span className="kriteria-sub" style={{ color: '#f472b6' }}>{formatScore(sub, 2)}</span> : '—'}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="bidang-summary-total" style={{ color: '#f472b6', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                            <span>Total Nilai Jingle</span>
                            <span>{formatScore(jingleResult.total)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </div>

          {/* Sidebar */}
          <aside className="dashboard-sidebar">
            <div className="glass-card" style={{ padding: 28 }}>
              <h3 className="text-body-sm" style={{ fontWeight: 700, marginBottom: 20, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                QR Code Pribadi
              </h3>
              <QRCodeDisplay participantId={user?.id} participantName={user?.group_name} size={160} />
            </div>
            <div className="glass-card" style={{ padding: 24, marginTop: 16 }}>
              <h3 className="text-body-sm" style={{ fontWeight: 700, marginBottom: 16, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Informasi Peserta
              </h3>
              {[
                { label: 'Nama Grup',        value: user?.group_name },
                { label: 'Sekolah',          value: user?.school_name || '—' },
                { label: 'No. Urut',         value: user?.no_urut },
                { label: 'Tingkat Pelajar',  value: user?.tingkat_pelajar || user?.kategori?.toUpperCase() },
                { label: 'Username',         value: user?.username },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
                </div>
              ))}
            </div>
            <Link to="/" className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>
              <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} /> Kembali ke Beranda
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
