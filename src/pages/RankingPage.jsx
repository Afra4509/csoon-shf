import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Medal, Star, RefreshCw, Maximize2, Minimize2, AlertTriangle, Shield, ArrowLeft } from 'lucide-react';
import { supabase } from '../supabase';
import { compareRanking, formatScore, getScoreGrade } from '../utils/scoreCalc';
import { useAuthStore } from '../store/authStore';
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
          <span className={`badge badge-xs ${participant.kategori === 'smp' ? 'badge-gold' : 'badge-green'}`}>
            {participant.kategori?.toUpperCase()}
          </span>
          <span className="podium-no">No. {participant.no_urut}</span>
        </div>
        <div className="podium-score">
          <span className="podium-score-val">{formatScore(finalScore?.nilai_utama)}</span>
          <span className="podium-score-lbl">Nilai Utama</span>
        </div>
        {grade && <div className="podium-grade" style={{ color: grade.color }}>Predikat: {grade.emoji} {grade.label}</div>}
      </div>
      <div className="podium-base" style={{ height: cfg.height }} />
    </div>
  );
}

function RankRow({ rank, participant, finalScore, isTop3 }) {
  const grade = finalScore?.nilai_utama ? getScoreGrade(finalScore.nilai_utama) : null;

  return (
    <tr className={`rank-row ${isTop3 ? `rank-row--top${rank}` : ''} ${finalScore?.is_tied ? 'rank-row--tied' : ''}`}>
      <td className="rank-col-num">
        {rank === 1 && <span className="rank-badge rank-badge--1">🥇 1</span>}
        {rank === 2 && <span className="rank-badge rank-badge--2">🥈 2</span>}
        {rank === 3 && <span className="rank-badge rank-badge--3">🥉 3</span>}
        {rank > 3  && <span className="rank-num">#{rank}</span>}
      </td>
      <td className="rank-col-name">
        <div className="rank-group-name">{participant.group_name}</div>
        <div className="rank-school">{participant.school_name || '—'} · No. {participant.no_urut}</div>
      </td>
      <td className="rank-col-kat">
        <span className={`badge badge-xs ${participant.kategori === 'smp' ? 'badge-gold' : 'badge-green'}`}>
          {participant.kategori?.toUpperCase()}
        </span>
      </td>
      <td className="rank-col-score">{formatScore(finalScore?.nilai_adab)}</td>
      <td className="rank-col-score">{formatScore(finalScore?.nilai_vokal)}</td>
      <td className="rank-col-score">{formatScore(finalScore?.nilai_banjari)}</td>
      <td className="rank-col-total">
        <strong>{formatScore(finalScore?.nilai_utama)}</strong>
      </td>
      <td className="rank-col-predikat">
        {grade ? (
          <span className="badge badge-xs" style={{ color: grade.color, background: `${grade.color}15`, border: `1px solid ${grade.color}40` }}>
            {grade.emoji} {grade.label}
          </span>
        ) : '—'}
        {finalScore?.is_tied && (
          <span className="badge badge-xs badge-gold" style={{ marginLeft: 4 }} title="Nilai sama — tie breaker via nilai vokal">
            SERI
          </span>
        )}
      </td>
    </tr>
  );
}

export default function RankingPage() {
  const { isAdmin } = useAuthStore();
  const [rankingData,  setRankingData]  = useState([]);
  const [jingleData,   setJingleData]   = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastUpdated,  setLastUpdated]  = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [filterKat,    setFilterKat]    = useState('all');
  const [showJingle,   setShowJingle]   = useState(false);

  const loadRanking = useCallback(async () => {
    const [{ data: participants }, { data: finalScores }] = await Promise.all([
      supabase.from('participants').select('*'),
      supabase.from('final_scores').select('*'),
    ]);

    if (participants && finalScores) {
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
    let active = true;
    const fetchRanking = async () => {
      if (active) await loadRanking();
    };
    fetchRanking();
    const interval = setInterval(fetchRanking, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
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
  const hasTied = filtered.some(d => d.finalScore?.is_tied);

  if (loading) return (
    <div className="ranking-page ranking-loading">
      <div className="login-spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
      <p style={{ color: 'var(--text-muted)', marginTop: 16 }}>Memuat data pemeringkatan internal...</p>
    </div>
  );

  return (
    <div className={`ranking-page ${isFullscreen ? 'ranking-fullscreen' : ''}`}>
      {/* Header */}
      <div className="ranking-header">
        <div className="ranking-header-left">
          <div className="ranking-logo"><img src="/rela.jpg" alt="SHF" /></div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="badge badge-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', fontWeight: 700 }}>
                <Shield size={12} /> Akses Internal (Admin &amp; Juri)
              </span>
            </div>
            <h1 className="ranking-title gradient-text">SMADA Hadrah Festival 2026</h1>
            <div className="ranking-subtitle">Rekap &amp; Pemeringkatan Internal · 6 September 2026</div>
          </div>
        </div>
        <div className="ranking-header-right">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
            <div className="badge badge-green" style={{ alignItems: 'center', gap: 6 }}>
              <span className="status-dot live" /> Live Data
            </div>
            {lastUpdated && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
            <button className="btn btn-ghost btn-icon" onClick={loadRanking} title="Segarkan Data"><RefreshCw size={16} /></button>
            <button className="btn btn-ghost btn-icon" onClick={toggleFullscreen} title="Fullscreen">
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <Link to={isAdmin ? '/admin' : '/juri'} className="btn btn-ghost btn-sm" style={{ gap: 6 }}>
              <ArrowLeft size={14} /> Kembali ke {isAdmin ? 'Admin' : 'Panel Juri'}
            </Link>
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
