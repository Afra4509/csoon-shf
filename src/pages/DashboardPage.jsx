import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  LogOut, RefreshCw, Clock, CheckCircle,
  BookOpen, Mic, Music, Star, ChevronRight, MessageSquare
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useScoreStore } from '../store/scoreStore';
import { supabase } from '../supabase';
import { calcSubtotalByField, calcBidangTotal, formatScore } from '../utils/scoreCalc';
import QRCodeDisplay from '../components/QRCodeDisplay';
import Navbar from '../components/Navbar';
import './DashboardPage.css';

const BIDANG = [
  { id: 'adab',    label: 'Adab dan Syair',     icon: <BookOpen size={17} />, color: 'var(--gold-400)' },
  { id: 'vokal',   label: 'Bidang Suara/Vokal',  icon: <Mic size={17} />,     color: 'var(--emerald-400)' },
  { id: 'banjari', label: 'Musik Banjari',        icon: <Music size={17} />,   color: '#818cf8' },
];

/* ── Kartu Evaluasi Juri per Bidang (HANYA teks evaluasi, TANPA angka) ── */
function BidangEvaluasiCard({ bidang, scores, notes }) {
  const fieldScores = scores.filter(s => s.field_id === bidang.id);
  const note        = notes.find(n => n.field_id === bidang.id);
  const isDone      = fieldScores.length > 0;
  const hasCatatan  = !!(note?.catatan && note.catatan.trim());

  return (
    <div
      className={`bidang-card glass-card ${isDone ? 'bidang-card--done' : ''}`}
      style={{ borderLeft: `3px solid ${isDone ? bidang.color : 'var(--border-subtle)'}` }}
    >
      <div className="bidang-card__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ color: bidang.color, display: 'flex', alignItems: 'center' }}>
            {bidang.icon}
          </div>
          <div>
            <div className="bidang-card__label">{bidang.label}</div>
            <div className="evaluasi-card__sub">Evaluasi &amp; Catatan Dewan Juri</div>
          </div>
        </div>
        <div className="bidang-card__right">
          {isDone ? (
            <div className="evaluasi-badge-done" style={{ color: bidang.color }}>
              <CheckCircle size={15} />
              <span>Selesai Dievaluasi</span>
            </div>
          ) : (
            <div className="bidang-card__pending">
              <Clock size={14} />
              <span>Menunggu Evaluasi</span>
            </div>
          )}
        </div>
      </div>

      <div className="evaluasi-card__content">
        {isDone ? (
          hasCatatan ? (
            <div className="evaluasi-quote-box" style={{ borderLeftColor: bidang.color }}>
              <div className="evaluasi-quote-header">
                <span className="evaluasi-quote-badge" style={{ color: bidang.color, background: `${bidang.color}18`, borderColor: `${bidang.color}35` }}>
                  <MessageSquare size={13} /> Catatan &amp; Evaluasi Dewan Juri
                </span>
                {note?.judges?.full_name && (
                  <span className="evaluasi-quote-author">Juri: {note.judges.full_name}</span>
                )}
              </div>
              <div className="evaluasi-quote-body">
                &ldquo;{note.catatan}&rdquo;
              </div>
            </div>
          ) : (
            <div className="evaluasi-empty-note">
              <CheckCircle size={16} style={{ color: bidang.color, flexShrink: 0 }} />
              <span>Dewan juri telah menyelesaikan penilaian untuk bidang ini (tidak ada catatan evaluasi tertulis khusus).</span>
            </div>
          )
        ) : (
          <div className="evaluasi-pending-box">
            <Clock size={15} style={{ flexShrink: 0 }} />
            <span>Penilaian sedang berlangsung. Teks evaluasi dari juri akan otomatis tampil segera setelah dinilai.</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const { fetchMyScores, scoringCriteria, fetchScoringMaster } = useScoreStore();

  const [myScores,     setMyScores]     = useState([]);
  const [myNotes,      setMyNotes]      = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initialLoad,  setInitialLoad]  = useState(true);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    const { scores, notes } = await fetchMyScores(user.id);
    setMyScores(scores || []);
    setMyNotes(notes  || []);
    setInitialLoad(false);
  }, [user, fetchMyScores]);

  useEffect(() => {
    loadData();
    fetchScoringMaster();

    // Realtime listener for scores & notes
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
  }, [loadData, fetchScoringMaster, user?.id]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const doneCount = BIDANG.filter(b => myScores.some(s => s.field_id === b.id)).length;
  const allEvaluated = doneCount === BIDANG.length;

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
            ) : (
              <>
                {/* Ringkasan Status Evaluasi (Tanpa Angka Skor Utama) */}
                <div className="evaluasi-summary-card glass-card">
                  <div className="evaluasi-summary-card__left">
                    <div className="evaluasi-summary-card__status-tag">
                      <CheckCircle size={14} /> Progress Evaluasi Dewan Juri
                    </div>
                    <div className="evaluasi-summary-card__title gradient-text">
                      {allEvaluated
                        ? 'Evaluasi Selesai'
                        : doneCount > 0
                        ? 'Evaluasi Sedang Berlangsung'
                        : 'Menunggu Penilaian Juri'}
                    </div>
                    <p className="evaluasi-summary-card__desc">
                      {allEvaluated
                        ? 'Dewan juri telah menuntaskan evaluasi untuk penampilan grup Anda. Catatan dan evaluasi tiap bidang dapat disimak di bawah ini.'
                        : doneCount > 0
                        ? `${doneCount} dari 3 bidang utama telah selesai dievaluasi oleh dewan juri. Evaluasi diperbarui secara realtime.`
                        : 'Penampilan grup Anda sedang dalam antrean / proses penilaian oleh dewan juri.'}
                    </p>
                    <div className="evaluasi-summary-card__meta">
                      <span className="status-dot live" />
                      <span>Evaluasi Resmi SMADA Hadrah Festival 2026</span>
                    </div>
                  </div>
                  <div className="evaluasi-summary-card__right">
                    <div className="evaluasi-progress-stat">
                      <div className="evaluasi-progress-num gradient-text">{doneCount}/3</div>
                      <div className="evaluasi-progress-label">Bidang Selesai</div>
                    </div>
                  </div>
                </div>

                {/* Progress status bidang chips */}
                <div className="glass-card" style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                    Status Evaluasi per Bidang
                  </div>
                  <div className="bidang-status-row">
                    {BIDANG.map(b => {
                      const done = myScores.some(s => s.field_id === b.id);
                      return (
                        <div
                          key={b.id}
                          className={`bidang-status-chip ${done ? 'bidang-status-chip--done' : ''}`}
                          style={{ borderColor: done ? b.color : 'var(--border-subtle)', color: done ? b.color : 'var(--text-muted)' }}
                        >
                          {done ? <CheckCircle size={13} /> : <Clock size={13} />}
                          <span>{b.label}</span>
                          <span className="bidang-status-chip-sub">({done ? 'Dievaluasi' : 'Menunggu'})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Daftar Evaluasi per Bidang (Teks Murni, Angka Ditiadakan) */}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Evaluasi Dewan Juri per Bidang
                  </div>
                  {BIDANG.map(b => (
                    <BidangEvaluasiCard
                      key={b.id}
                      bidang={b}
                      scores={myScores}
                      notes={myNotes}
                    />
                  ))}
                </div>

                {/* Kategori Jingle — Pengecualian: Nilai diizinkan untuk ditayangkan kepada peserta */}
                {(() => {
                  const jingleScores = myScores.filter(s => s.field_id === 'jingle');
                  if (jingleScores.length === 0) return null;
                  const jingleNote = myNotes.find(n => n.field_id === 'jingle');
                  const jingleResult = calcBidangTotal(jingleScores, jingleNote?.pengurangan || 0, 'jingle');
                  const jingleCriteria = scoringCriteria.filter(c => c.field_id === 'jingle');

                  return (
                    <div style={{ marginTop: 24 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Nilai Kategori Jingle
                        </div>
                        <span className="badge badge-gold" style={{ fontSize: '0.75rem', gap: 4 }}>
                          <Star size={12} /> Khusus Kategori Jingle
                        </span>
                      </div>
                      <div className="bidang-card glass-card bidang-card--done" style={{ borderLeft: '3px solid #f472b6' }}>
                        <div className="bidang-card__header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Star size={16} style={{ color: '#f472b6' }} />
                            <div>
                              <div className="bidang-card__label">Jingle</div>
                              <div className="evaluasi-card__sub">Nilai resmi kategori Jingle</div>
                            </div>
                          </div>
                          <div className="bidang-card__score" style={{ color: '#f472b6', fontSize: '1.5rem', fontWeight: 800 }}>
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
                                    {sub != null ? <span className="kriteria-sub" style={{ color: '#f472b6', fontWeight: 700 }}>{formatScore(sub, 2)}</span> : '—'}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="bidang-summary-total" style={{ color: '#f472b6', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                            <span>Total Nilai Jingle</span>
                            <span>{formatScore(jingleResult.total)}</span>
                          </div>
                          {jingleNote?.catatan && (
                            <div className="evaluasi-quote-box" style={{ marginTop: 14 }}>
                              <div className="evaluasi-quote-header">
                                <span className="evaluasi-quote-badge" style={{ color: '#f472b6', background: 'rgba(244,114,182,0.12)', borderColor: 'rgba(244,114,182,0.3)' }}>
                                  📝 Catatan Juri Jingle
                                </span>
                              </div>
                              <div className="evaluasi-quote-body">
                                &ldquo;{jingleNote.catatan}&rdquo;
                              </div>
                            </div>
                          )}
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
