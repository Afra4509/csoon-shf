import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Radio } from 'lucide-react';
import './LiveTicker.css';

export default function LiveTicker() {
  const [items,   setItems]   = useState([]);
  const [isLive,  setIsLive]  = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const msgs = [];

      const [{ data: finalScores }, { data: parts }] = await Promise.all([
        supabase.from('final_scores').select('participant_id, is_complete, updated_at').order('updated_at', { ascending: false }),
        supabase.from('participants').select('id, group_name, kategori, no_urut, status'),
      ]);

      const completedCount = finalScores?.filter(f => f.is_complete).length ?? 0;
      const total = parts?.length ?? 0;

      if (total > 0) {
        if (completedCount > 0) {
          msgs.push(`📊 ${completedCount} dari ${total} peserta telah selesai dievaluasi Dewan Juri`);
        }

        // Siapa yang sedang tampil
        const tampil = parts?.filter(p => p.status === 'tampil') ?? [];
        tampil.forEach(p => {
          msgs.push(`🎤 Sedang tampil: ${p.group_name} [${p.kategori?.toUpperCase()}] No.${p.no_urut}`);
        });

        // Tampilkan peserta yang baru selesai tampil
        const recentCompleted = (finalScores ?? [])
          .filter(f => f.is_complete)
          .slice(0, 3);
        const recentIds = recentCompleted.map(s => s.participant_id);
        const recentParts = parts?.filter(x => recentIds.includes(x.id)) ?? [];
        recentParts.forEach(p => {
          msgs.push(`✅ ${p.group_name} — Selesai tampil & dievaluasi`);
        });

        setIsLive(tampil.length > 0);
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
