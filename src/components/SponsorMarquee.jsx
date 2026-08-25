import './SponsorMarquee.css';

// Buat 30 item agar total lebarnya jauh melebihi layar ultrawide sekalipun,
// sehingga saat animasi translateX(-50%) tidak ada area kosong yang terlihat.
const BASE = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  img: '/sponsor.jpeg',
  name: 'aefera.me'
}));

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
