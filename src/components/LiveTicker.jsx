import { useEffect, useRef, useState } from 'react';
import { MOCK_LIVE_UPDATES } from '../utils/mockData';
import { Radio } from 'lucide-react';
import './LiveTicker.css';

export default function LiveTicker() {
  const [updates, setUpdates] = useState(MOCK_LIVE_UPDATES);
  const tickerRef = useRef(null);

  // Simulate new updates coming in
  useEffect(() => {
    const interval = setInterval(() => {
      setUpdates(prev => {
        const first = prev[0];
        return [...prev.slice(1), first];
      });
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const doubled = [...updates, ...updates];

  return (
    <div className="live-ticker">
      <div className="live-ticker__badge">
        <Radio size={13} />
        <span>LIVE</span>
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
