import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { formatScore } from '../utils/scoreCalc';
import { Radio } from 'lucide-react';
import './LiveTicker.css';

export default function LiveTicker() {
  const [items,   setItems]   = useState([]);
  const [isLive,  setIsLive]  = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data: settings } = await supabase
        .from('event_settings')
        .select('ranking_published, scoring_finalized')
        .single();

      const msgs = [];

      // ── Ranking sudah dipublikasikan → tampilkan top hasil ─
      if (settings?.ranking_published) {
        const { data: finalScores } = await supabase
          .from('final_scores')
          .select('participant_id, nilai_utama, is_complete')
          .eq('is_complete', true)
          .order('nilai_utama', { ascending: false })
          .limit(5);

        if (finalScores?.length) {
          const ids = finalScores.map(f => f.participant_id);
          const { data: parts } = await supabase
            .from('participants')
            .select('id, group_name, kategori')
            .in('id', ids);

          const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
          finalScores.forEach((s, i) => {
            const p = parts?.find(x => x.id === s.participant_id);
            if (!p) return;
            msgs.push(`${medals[i] || `#${i + 1}`} ${p.group_name} [${p.kategori?.toUpperCase()}] — ${formatScore(s.nilai_utama)}/100`);
          });
        }

        setIsLive(true);

      // ── Sedang penilaian → tampilkan progress sederhana ────
      } else {
        const { data: finalScores } = await supabase
          .from('final_scores')
          .select('participant_id, nilai_utama, is_complete, updated_at')
          .order('updated_at', { ascending: false });

        const completedCount = finalScores?.filter(f => f.is_complete).length ?? 0;
        const totalScored    = finalScores?.length ?? 0;

        if (completedCount > 0) {
          // Ada data — tampilkan progress
          const { data: parts } = await supabase
            .from('participants')
            .select('id, group_name, kategori, no_urut, status');

          const total = parts?.length ?? 0;

          msgs.push(`📊 ${completedCount} dari ${total} peserta telah selesai dinilai`);

          // Siapa yang sedang tampil
          const tampil = parts?.filter(p => p.status === 'tampil') ?? [];
          tampil.forEach(p => {
            msgs.push(`🎤 Sedang tampil: ${p.group_name} [${p.kategori?.toUpperCase()}] No.${p.no_urut}`);
          });

          // 3 peserta terakhir selesai dinilai
          const recent = (finalScores ?? [])
            .filter(f => f.is_complete)
            .slice(0, 3);
          recent.forEach(s => {
            const p = parts?.find(x => x.id === s.participant_id);
            if (!p) return;
            msgs.push(`✅ ${p.group_name} — ${formatScore(s.nilai_utama)}/100`);
          });

          setIsLive(tampil.length > 0);
        }
      }

      // Fallback — belum ada data sama sekali
      if (msgs.length === 0) {
        msgs.push('Sedang dinilai oleh dewan juri — harap menunggu...');
        setIsLive(false);
      }

      setItems(msgs);
      setLoading(false);
    }

    loadData();
    const t = setInterval(loadData, 30_000);
    return () => clearInterval(t);
  }, []);

  if (loading) return null;

  // Untuk CSS scroll yang smooth: duplikat item agar loop mulus
  const isScroll = items.length > 1;
  // Hitung durasi berdasarkan total karakter agar kecepatan konsisten
  const totalChars = items.reduce((s, t) => s + t.length, 0);
  const duration   = Math.max(15, Math.min(60, totalChars * 0.15));
  const displayed  = isScroll ? [...items, ...items] : items; // duplikat untuk loop

  return (
    <div className="live-ticker">
      <div className="live-ticker__badge">
        <Radio
          size={13}
          style={{ animation: isLive ? 'pulse 2s infinite' : 'none' }}
        />
        <span>{isLive ? 'LIVE REPORT' : 'INFO'}</span>
      </div>
      <div className="live-ticker__track-wrapper">
        <div
          className={`live-ticker__track ${isScroll ? 'live-ticker__track--scroll' : 'live-ticker__track--static'}`}
          style={{ '--ticker-duration': `${duration}s` }}
        >
          {displayed.map((text, i) => (
            <span key={i} className="live-ticker__item">
              <span className="live-ticker__dot" />
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
