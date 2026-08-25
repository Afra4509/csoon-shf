import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase';
import { formatScore } from '../utils/scoreCalc';
import { Radio } from 'lucide-react';
import './LiveTicker.css';

export default function LiveTicker() {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLive,  setIsLive]  = useState(false);
  const tickerRef = useRef(null);

  useEffect(() => {
    async function loadData() {
      // 1. Cek status event
      const { data: settings } = await supabase
        .from('event_settings')
        .select('ranking_published, scoring_finalized')
        .single();

      // 2. Ambil data peserta & final_scores secara bersamaan
      const [{ data: participants }, { data: finalScores }] = await Promise.all([
        supabase.from('participants').select('id, group_name, kategori, no_urut, status').order('no_urut'),
        supabase.from('final_scores').select('participant_id, nilai_utama, nilai_adab, nilai_vokal, nilai_banjari, is_complete, updated_at'),
      ]);

      const msgs = [];

      // ── Kasus A: Ranking sudah dipublikasikan ──────────────
      if (settings?.ranking_published && finalScores?.length) {
        setIsLive(true);

        // Tampilkan top 3 peserta dengan nilai tertinggi
        const sorted = [...finalScores]
          .filter(f => f.is_complete && f.nilai_utama != null)
          .sort((a, b) => parseFloat(b.nilai_utama) - parseFloat(a.nilai_utama))
          .slice(0, 5);

        sorted.forEach((s, i) => {
          const p = participants?.find(x => x.id === s.participant_id);
          if (!p) return;
          const rank = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i] || `#${i + 1}`;
          msgs.push({
            id: `rank-${s.participant_id}`,
            text: `${rank} ${p.group_name} [${p.kategori?.toUpperCase()}] — Total ${formatScore(s.nilai_utama)}/100`,
          });
        });

        if (msgs.length === 0) {
          msgs.push({ id: 'noresult', text: 'Penilaian selesai — hasil ranking telah dipublikasikan!' });
        }

      // ── Kasus B: Scoring finalized tapi belum dipublikasikan ──
      } else if (settings?.scoring_finalized) {
        setIsLive(false);
        msgs.push({ id: 'finalized', text: '✅ Penilaian telah selesai — hasil sedang diverifikasi panitia, harap tunggu pengumuman.' });

      // ── Kasus C: Penilaian sedang berlangsung ──────────────
      } else {
        const allP = participants || [];
        const allFS = finalScores || [];

        const completedIds  = new Set(allFS.filter(f => f.is_complete).map(f => f.participant_id));
        const scoredIds     = new Set(allFS.map(f => f.participant_id));
        const totalP        = allP.length;
        const completedCount = completedIds.size;
        const scoredCount    = scoredIds.size;

        // Info progress keseluruhan
        if (totalP > 0) {
          msgs.push({
            id: 'progress',
            text: `📊 Progress penilaian: ${completedCount} dari ${totalP} peserta telah selesai dinilai (3 bidang utama)`,
          });

          if (scoredCount > completedCount) {
            msgs.push({
              id: 'partial',
              text: `⏳ ${scoredCount - completedCount} peserta sedang dalam proses penilaian bidang berikutnya`,
            });
          }
        }

        // Peserta yang sedang tampil
        const tampil = allP.filter(p => p.status === 'tampil');
        tampil.forEach(p => {
          msgs.push({
            id: `tampil-${p.id}`,
            text: `🎤 Sedang tampil: ${p.group_name} [${p.kategori?.toUpperCase()}] — No. ${p.no_urut}`,
          });
        });

        // Peserta yang baru selesai dinilai (terakhir diperbarui)
        const recentScored = [...allFS]
          .filter(f => f.is_complete && f.updated_at)
          .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
          .slice(0, 3);

        recentScored.forEach(s => {
          const p = allP.find(x => x.id === s.participant_id);
          if (!p) return;
          msgs.push({
            id: `scored-${s.participant_id}`,
            text: `✅ ${p.group_name} [${p.kategori?.toUpperCase()}] telah selesai dinilai — Nilai Utama: ${formatScore(s.nilai_utama)}/100`,
          });
        });

        // Fallback jika belum ada data sama sekali
        if (msgs.length === 0) {
          msgs.push({ id: 'wait', text: '📋 Penilaian akan segera dimulai — pantau terus halaman ini untuk update terbaru!' });
        }

        setIsLive(tampil.length > 0 || scoredCount > 0);
      }

      setUpdates(msgs);
      setLoading(false);
    }

    loadData();

    // Refresh data setiap 30 detik
    const refreshInterval = setInterval(loadData, 30_000);
    return () => clearInterval(refreshInterval);
  }, []);

  // Rotasi pesan setiap 5 detik jika lebih dari 1
  useEffect(() => {
    if (updates.length <= 1) return;
    const interval = setInterval(() => {
      setUpdates(prev => {
        const first = prev[0];
        return [...prev.slice(1), first];
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [updates.length]);

  if (loading) return null;

  const doubled = updates.length > 1 ? [...updates, ...updates] : updates;

  return (
    <div className="live-ticker">
      <div className="live-ticker__badge">
        <Radio
          size={13}
          style={{ animation: isLive ? 'pulse 2s infinite' : 'none', color: isLive ? 'var(--emerald-400)' : undefined }}
        />
        <span>{isLive ? 'LIVE REPORT' : 'INFO'}</span>
      </div>
      <div className="live-ticker__track-wrapper">
        <div className="live-ticker__track" ref={tickerRef}>
          {doubled.map((item, i) => (
            <span key={`${item.id}-${i}`} className="live-ticker__item">
              <span className="live-ticker__dot" />
              {item.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
