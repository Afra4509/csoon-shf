import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase';
import { formatScore } from '../utils/scoreCalc';
import { Radio } from 'lucide-react';
import './LiveTicker.css';

export default function LiveTicker() {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const tickerRef = useRef(null);

  useEffect(() => {
    async function loadData() {
      const { data: settings } = await supabase.from('event_settings').select('ranking_published, scoring_finalized').single();
      
      if (!settings?.ranking_published && !settings?.scoring_finalized) {
        setUpdates([{ id: 'wait', text: 'Menunggu proses penilaian oleh dewan juri...' }]);
        setLoading(false);
        return;
      }

      const { data: finalScores } = await supabase
        .from('final_scores')
        .select('*, participants(group_name, kategori)')
        .eq('is_complete', true)
        .order('updated_at', { ascending: false })
        .limit(5);

      if (finalScores && finalScores.length > 0) {
        const mapped = finalScores.map((s, i) => ({
          id: s.id || i,
          text: `[${s.participants?.kategori?.toUpperCase()}] ${s.participants?.group_name} meraih total ${formatScore(s.nilai_utama)}`
        }));
        setUpdates(mapped);
      } else {
        setUpdates([{ id: 'wait', text: 'Menunggu hasil penilaian masuk...' }]);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  useEffect(() => {
    if (updates.length <= 1) return;
    const interval = setInterval(() => {
      setUpdates(prev => {
        const first = prev[0];
        return [...prev.slice(1), first];
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [updates.length]);

  if (loading) return null;

  const doubled = updates.length > 1 ? [...updates, ...updates] : updates;

  return (
    <div className="live-ticker">
      <div className="live-ticker__badge">
        <Radio size={13} style={{ animation: updates.length > 1 ? 'pulse 2s infinite' : 'none' }} />
        <span>{updates.length > 1 ? 'LIVE REPORT' : 'INFO'}</span>
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
