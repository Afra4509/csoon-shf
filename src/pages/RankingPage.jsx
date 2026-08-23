import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Medal, Star, RefreshCw, Maximize2, Minimize2, Home, Lock, AlertTriangle } from 'lucide-react';
import { supabase } from '../supabase';
import { compareRanking, formatScore, getScoreGrade } from '../utils/scoreCalc';
import './RankingPage.css';

function PodiumCard({ rank, participant, finalScore }) {
  const cfg = {
    1: { height: 160, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: '🥇 Juara 1', icon: <Trophy size={28} /> },
    2: { height: 120, color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', label: '🥈 Juara 2', icon: <Medal size={24} /> },
    3: { height: 90,  color: '#cd7f32', bg: 'rgba(205,127,50,0.12)',  label: '🥉 Juara 3', icon: <Medal size={22} /> },
  }[rank] || {};

  const grade = finalScore?.nilai_utama ? getScoreGrade(finalScore.nilai_utama) : null;

  return (
    <div className={`podium-card podium-card--${rank}`} style={{ '--podium-color': cfg.color, '--podium-bg': cfg.bg }}>
      <div className="podium-content">
        <div className="podium-icon">{cfg.icon}</div>
        <div className="podium-rank-label">{cfg.label}</div>
        <div className="podium-name">{participant.group_name}</div>
        <div className="podium-school">{participant.school_name || ''}</div>
        <div className="podium-kat">
          <span className={`badge ${participant.kategori === 'smp' ? 'badge-gold' : 'badge-green'}`}>
            {participant.kategori?.toUpperCase()}
          </span>
        </div>
        {finalScore?.nilai_utama != null && (
          <div className="podium-score">{formatScore(finalScore.nilai_utama)}</div>
        )}
        {grade && <div className="podium-grade" style={{ color: grade.color }}>{grade.label}</div>}
        {/* Breakdown */}
        {finalScore && (
          <div className="podium-breakdown">
            <span>A: {formatScore(finalScore.nilai_adab ?? '—', 1)}</span>
            <span>V: {formatScore(finalScore.nilai_vokal ?? '—', 1)}</span>
            <span>B: {formatScore(finalScore.nilai_banjari ?? '—', 1)}</span>
          </div>
        )}
      </div>
      <div className="podium-base" style={{ height: cfg.height }} />
    </div>
  );
}

function RankRow({ rank, participant, finalScore, isTop3 }) {
  const grade  = finalScore?.nilai_utama ? getScoreGrade(finalScore.nilai_utama) : null;
  const isTied = finalScore?.is_tied;

  return (
    <tr className={`rank-row ${isTop3 ? 'rank-row--top3' : ''} ${isTied ? 'rank-row--tied' : ''}`}>
      <td className="rank-number">
        {rank <= 3 ? (
          <span className="rank-badge" style={{ '--rank-color': rank === 1 ? '#f59e0b' : rank === 2 ? '#94a3b8' : '#cd7f32' }}>
            {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
          </span>
        ) : (
          <span className="rank-num-plain">{isTied ? '—' : rank}</span>
        )}
      </td>
      <td>
        <div className="rank-name">{participant.group_name}</div>
        <div className="rank-school">{participant.school_name}</div>
      </td>
      <td>
        <span className={`badge ${participant.kategori === 'smp' ? 'badge-gold' : 'badge-green'}`}>
          {participant.kategori?.toUpperCase()}
        </span>
      </td>
      {/* Breakdown per bidang */}
      <td className="rank-bidang-cell">{formatScore(finalScore?.nilai_adab, 1)}</td>
      <td className="rank-bidang-cell">{formatScore(finalScore?.nilai_vokal, 1)}</td>
      <td className="rank-bidang-cell">{formatScore(finalScore?.nilai_banjari, 1)}</td>
      <td className="rank-score-cell" style={{ color: isTied ? 'var(--gold-400)' : (grade?.color || 'var(--accent-primary)') }}>
        {finalScore?.nilai_utama != null ? formatScore(finalScore.nilai_utama) : '—'}
        {isTied && (
          <div style={{ fontSize: '0.625rem', color: 'var(--gold-400)', fontWeight: 600, marginTop: 2 }}>SERI</div>
        )}
      </td>
      <td>
        {isTied ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--gold-400)', fontSize: '0.75rem', fontWeight: 600 }}>
            <AlertTriangle size={12} /> Perlu Keputusan Panitia
          </span>
        ) : grade ? (
          <span style={{ color: grade.color, fontWeight: 600, fontSize: '0.8125rem' }}>
            {grade.emoji} {grade.label}
          </span>
        ) : null}
      </td>
    </tr>
  );
}

export default function RankingPage() {
  const [rankingData,  setRankingData]  = useState([]);
  const [jingleData,   setJingleData]   = useState([]);
  const [settings,     setSettings]     = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastUpdated,  setLastUpdated]  = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [filterKat,    setFilterKat]    = useState('all');
  const [showJingle,   setShowJingle]   = useState(false);

  const loadRanking = useCallback(async () => {
    const { data: settingsData } = await supabase
      .from('event_settings').select('*').eq('id', 1).single();
    setSettings(settingsData);

    if (!settingsData?.ranking_published) {
      setLoading(false);
      return;
    }

    const [{ data: participants }, { data: finalScores }] = await Promise.all([
      supabase.from('participants').select('*'),
      supabase.from('final_scores').select('*'),
    ]);

    if (participants && finalScores) {
      // Ranking utama: Adab + Vokal + Banjari (maks 100)
      const withScores = participants.map(p => ({
        participant: p,
        finalScore:  finalScores.find(f => f.participant_id === p.id) || null,
      })).filter(d => d.finalScore?.nilai_utama != null);

      const sorted = [...withScores].sort((a, b) =>
        compareRanking(
          { nilai_utama: a.finalScore.nilai_utama, nilai_vokal: a.finalScore.nilai_vokal },
          { nilai_utama: b.finalScore.nilai_utama, nilai_vokal: b.finalScore.nilai_vokal }
        )
      );

      // Assign ranking (tied = same rank, skip next)
      let rank = 1;
      const ranked = sorted.map((item, idx) => {
        if (idx > 0) {
          const prev = sorted[idx - 1];
          const cmp = compareRanking(
            { nilai_utama: prev.finalScore.nilai_utama, nilai_vokal: prev.finalScore.nilai_vokal },
            { nilai_utama: item.finalScore.nilai_utama, nilai_vokal: item.finalScore.nilai_vokal }
          );
          if (cmp !== 0) rank = idx + 1;
        }
        return { ...item, rank };
      });

      setRankingData(ranked);

      // Jingle terpisah
      const jingle = participants.map(p => ({
        participant: p,
        nilai_jingle: finalScores.find(f => f.participant_id === p.id)?.nilai_jingle ?? null,
      })).filter(d => d.nilai_jingle != null)
        .sort((a, b) => b.nilai_jingle - a.nilai_jingle);

      setJingleData(jingle);
      setLastUpdated(new Date());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRanking();
    const interval = setInterval(loadRanking, 30000);
    const channel = supabase
      .channel('ranking-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'final_scores' }, loadRanking)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_settings' }, loadRanking)
      .subscribe();
    return () => { clearInterval(interval); supabase.removeChannel(channel); };
  }, [loadRanking]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  const filtered = filterKat === 'all'
    ? rankingData
    : rankingData.filter(d => d.participant.kategori === filterKat);

  const top3   = filtered.slice(0, 3);
  const others = filtered.slice(3);
  const hasTied = filtered.some(d => d.finalScore?.is_tied);

  if (loading) return (
    <div className="ranking-page ranking-loading">
      <div className="login-spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
      <p style={{ color: 'var(--text-muted)', marginTop: 16 }}>Memuat ranking...</p>
    </div>
  );

  if (!settings?.ranking_published) return (
    <div className="ranking-page ranking-hidden">
      <div className="ranking-hidden-card glass-card-strong">
        <div className="ranking-hidden-icon"><Lock size={48} /></div>
        <h1 className="text-headline gradient-text">SMADA Hadrah Festival 2026</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.0625rem', marginTop: 12, textAlign: 'center' }}>
          Hasil ranking belum dipublikasikan.
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>
          6 September 2026 · Halaman ini otomatis tampil setelah Admin mempublikasikan hasil.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 28, justifyContent: 'center' }}>
          <Link to="/" className="btn btn-outline"><Home size={16} /> Beranda</Link>
          <button className="btn btn-ghost btn-sm" onClick={loadRanking}>
            <RefreshCw size={14} /> Cek Ulang
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`ranking-page ${isFullscreen ? 'ranking-fullscreen' : ''}`}>
      {/* Header */}
      <div className="ranking-header">
        <div className="ranking-header-left">
          <div className="ranking-logo"><img src="/rela.jpg" alt="SHF" /></div>
          <div>
            <h1 className="ranking-title gradient-text">SMADA Hadrah Festival 2026</h1>
            <div className="ranking-subtitle">Hasil Akhir Penilaian Resmi · 6 September 2026</div>
          </div>
        </div>
        <div className="ranking-header-right">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
            <div className="badge badge-green" style={{ alignItems: 'center', gap: 6 }}>
              <span className="status-dot live" /> Live
            </div>
            {lastUpdated && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
            <button className="btn btn-ghost btn-icon" onClick={loadRanking}><RefreshCw size={16} /></button>
            <button className="btn btn-ghost btn-icon" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <Link to="/" className="btn btn-ghost btn-icon"><Home size={16} /></Link>
          </div>
        </div>
      </div>

      {/* Notifikasi seri */}
      {hasTied && (
        <div className="ranking-tied-notice">
          <AlertTriangle size={16} />
          <span>Terdapat peserta dengan nilai seri. Ditandai &quot;SERI — Perlu Keputusan Panitia&quot;</span>
        </div>
      )}

      {/* Tab: Utama / Jingle */}
      <div className="ranking-tab-row">
        <div className="ranking-filters">
          <button className={`btn btn-sm ${!showJingle ? 'btn-primary' : 'btn-outline'}`} onClick={() => setShowJingle(false)}>
            <Trophy size={14} /> Ranking Utama
          </button>
          <button className={`btn btn-sm ${showJingle ? 'btn-primary' : 'btn-outline'}`} onClick={() => setShowJingle(true)}>
            <Star size={14} /> Jingle
          </button>
        </div>
        {!showJingle && (
          <div className="ranking-filters">
            {[{ v: 'all', l: 'Semua' }, { v: 'sd', l: 'SD/MI' }, { v: 'smp', l: 'SMP/MTs' }].map(({ v, l }) => (
              <button key={v} className={`btn btn-sm ${filterKat === v ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilterKat(v)}>
                {l}
              </button>
            ))}
          </div>
        )}
      </div>

      {!showJingle ? (
        <>
          {/* Keterangan bobot */}
          <div className="ranking-bobot">
            <span>Adab &amp; Syair: 30</span>
            <span>+</span>
            <span>Vokal: 40</span>
            <span>+</span>
            <span>Musik Banjari: 30</span>
            <span>=</span>
            <strong>100 poin</strong>
          </div>

          {filtered.length === 0 ? (
            <div className="ranking-empty">
              <Trophy size={52} style={{ color: 'var(--border-default)', filter: 'drop-shadow(0 0 12px rgba(16,185,129,0.2))' }} />
              <p style={{ fontWeight: 600, fontSize: '1.0625rem' }}>Belum Ada Nilai Tersedia</p>
              <p style={{ fontSize: '0.875rem', maxWidth: 320, textAlign: 'center', lineHeight: 1.6 }}>
                Nilai akan muncul setelah admin mempublikasikan hasil penilaian.
              </p>
            </div>
          ) : (
            <>
              {/* Podium top 3 */}
              {top3.length >= 1 && (
                <div className="podium-section">
                  <div className="podium-arena">
                    <div className="podium-arena-title">🏆 Podium Kejuaraan</div>
                    <div className="podium-wrap">
                      {top3[1] && <PodiumCard rank={2} participant={top3[1].participant} finalScore={top3[1].finalScore} />}
                      {top3[0] && <PodiumCard rank={1} participant={top3[0].participant} finalScore={top3[0].finalScore} />}
                      {top3[2] && <PodiumCard rank={3} participant={top3[2].participant} finalScore={top3[2].finalScore} />}
                    </div>
                  </div>
                </div>
              )}

              {/* Tabel ranking lengkap */}
              <div className="ranking-table-wrap">
                <div className="ranking-table-header">
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Star size={16} style={{ color: 'var(--gold-400)' }} />
                    Ranking Lengkap
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {filtered.length} peserta
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="ranking-table">
                    <thead>
                      <tr>
                        <th style={{ width: 60 }}>Rank</th>
                        <th>Nama Grup</th>
                        <th>Tingkat</th>
                        <th style={{ width: 70 }}>Adab</th>
                        <th style={{ width: 70 }}>Vokal</th>
                        <th style={{ width: 70 }}>Banjari</th>
                        <th style={{ width: 100 }}>Total</th>
                        <th>Predikat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(item => (
                        <RankRow
                          key={item.participant.id}
                          rank={item.rank}
                          participant={item.participant}
                          finalScore={item.finalScore}
                          isTop3={item.rank <= 3}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        /* Tabel Jingle */
        <div className="ranking-table-wrap glass-card" style={{ marginTop: 16 }}>
          <div className="ranking-table-header">
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>
              <Star size={16} style={{ display: 'inline', marginRight: 8, color: '#f472b6' }} />
              Hasil Penilaian Jingle ({jingleData.length} peserta)
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Terpisah dari ranking utama</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="ranking-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>No.</th>
                  <th>Nama Grup</th>
                  <th>Tingkat</th>
                  <th style={{ width: 120 }}>Nilai Jingle</th>
                </tr>
              </thead>
              <tbody>
                {jingleData.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                      Belum ada nilai Jingle
                    </td>
                  </tr>
                ) : jingleData.map((item, idx) => (
                  <tr key={item.participant.id} className={`rank-row ${idx < 3 ? 'rank-row--top3' : ''}`}>
                    <td className="rank-number">
                      <span className="rank-num-plain" style={{ color: idx === 0 ? '#f472b6' : 'var(--text-muted)' }}>
                        {idx + 1}
                      </span>
                    </td>
                    <td>
                      <div className="rank-name">{item.participant.group_name}</div>
                      <div className="rank-school">{item.participant.school_name}</div>
                    </td>
                    <td>
                      <span className={`badge ${item.participant.kategori === 'smp' ? 'badge-gold' : 'badge-green'}`}>
                        {item.participant.kategori?.toUpperCase()}
                      </span>
                    </td>
                    <td className="rank-score-cell" style={{ color: '#f472b6' }}>
                      {formatScore(item.nilai_jingle)}
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
