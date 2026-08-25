import './SponsorMarquee.css';

// Duplikat foto sponsor agar terlihat penuh saat scroll
const SPONSORS = [
  { id: 1, name: 'aefera.me', img: '/sponsor.jpeg' },
  { id: 2, name: 'aefera.me', img: '/sponsor.jpeg' },
  { id: 3, name: 'aefera.me', img: '/sponsor.jpeg' },
  { id: 4, name: 'aefera.me', img: '/sponsor.jpeg' },
  { id: 5, name: 'aefera.me', img: '/sponsor.jpeg' },
  { id: 6, name: 'aefera.me', img: '/sponsor.jpeg' },
];

export default function SponsorMarquee() {
  // Duplikat 2x untuk loop seamless
  const track = [...SPONSORS, ...SPONSORS];

  return (
    <section className="sponsor-section">
      <div className="sponsor-label">Didukung Oleh</div>
      <div className="sponsor-marquee-wrapper">
        {/* Gradient fade kiri-kanan */}
        <div className="sponsor-fade sponsor-fade--left"  />
        <div className="sponsor-fade sponsor-fade--right" />

        <div className="sponsor-marquee-track">
          {track.map((s, i) => (
            <div key={i} className="sponsor-card">
              <img src={s.img} alt={s.name} draggable={false} />
              <span className="sponsor-name">{s.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
