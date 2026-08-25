import './SponsorMarquee.css';

// Banyak item agar loop benar-benar seamless tanpa patah
const BASE = [
  { id: 1, img: '/sponsor.jpeg', name: 'aefera.me' },
  { id: 2, img: '/sponsor.jpeg', name: 'aefera.me' },
  { id: 3, img: '/sponsor.jpeg', name: 'aefera.me' },
  { id: 4, img: '/sponsor.jpeg', name: 'aefera.me' },
  { id: 5, img: '/sponsor.jpeg', name: 'aefera.me' },
  { id: 6, img: '/sponsor.jpeg', name: 'aefera.me' },
  { id: 7, img: '/sponsor.jpeg', name: 'aefera.me' },
  { id: 8, img: '/sponsor.jpeg', name: 'aefera.me' },
];

export default function SponsorMarquee() {
  // Duplikat tepat 2x — animasi translateX(-50%) akan snap seamless
  const track = [...BASE, ...BASE];

  return (
    <section className="sponsor-section">
      <div className="sponsor-label">Didukung Oleh</div>
      <div className="sponsor-marquee-wrapper">
        <div className="sponsor-fade sponsor-fade--left"  />
        <div className="sponsor-fade sponsor-fade--right" />
        <div className="sponsor-marquee-track">
          {track.map((s, i) => (
            <div key={i} className="sponsor-card">
              <img src={s.img} alt={s.name} draggable={false} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
