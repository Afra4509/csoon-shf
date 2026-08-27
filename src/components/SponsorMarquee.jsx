import './SponsorMarquee.css';

const SPONSORS = [
  { id: 1, img: '/AEFERA WEBSITE_.jpg', name: 'Aefera Website' },
  { id: 2, img: '/BIMBEL FRIETANIA_.jpg', name: 'Bimbel Frietania' },
  { id: 3, img: '/BIMBEL PERDANA_.jpg', name: 'Bimbel Perdana' },
  { id: 4, img: '/DASARATA (M).jpg', name: 'Dasarata' },
  { id: 5, img: '/DIES CREATIVE ADVERTISING_.jpg', name: 'Dies Creative Advertising' },
  { id: 6, img: '/HISANA FRIED CHIKEN (M).jpg', name: 'Hisana Fried Chiken' },
  { id: 7, img: '/HK AUDIO (L).jpg', name: 'HK Audio' },
  { id: 8, img: '/MANISDIRASA BAKERY (L).jpg', name: 'Manisdirasa Bakery' },
  { id: 9, img: '/OMAH TUA (M).png', name: 'Omah Tua' },
  { id: 10, img: '/PERCETAKAN TRIJAYA (L).jpg', name: 'Percetakan Trijaya' },
  { id: 11, img: '/WINGSFOOD XL.jpg', name: 'Wingsfood' },
];

// Duplikat item agar total lebarnya melebihi layar ultrawide sekalipun,
// sehingga saat animasi translateX(-50%) tidak ada area kosong yang terlihat.
// 11 item tidak cukup panjang untuk monitor besar, jadi kita kalikan 3x = 33 item.
const BASE = [...SPONSORS, ...SPONSORS, ...SPONSORS];

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
