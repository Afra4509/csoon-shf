import { useRef, useState, useEffect } from 'react';
import { GALLERY_IMAGES } from '../utils/mockData';
import { ChevronLeft, ChevronRight, Image } from 'lucide-react';
import './GallerySection.css';

export default function GallerySection() {
  const trackRef   = useRef(null);
  const isDragging = useRef(false);
  const startX     = useRef(0);
  const scrollLeft = useRef(0);
  const [active, setActive]   = useState(null);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(true);

  const updateButtons = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 10);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateButtons, { passive: true });
    updateButtons();
    return () => el.removeEventListener('scroll', updateButtons);
  }, []);

  const scroll = (dir) => {
    trackRef.current?.scrollBy({ left: dir * 360, behavior: 'smooth' });
  };

  // Mouse drag
  const onMouseDown = (e) => {
    isDragging.current = true;
    startX.current = e.pageX - trackRef.current.offsetLeft;
    scrollLeft.current = trackRef.current.scrollLeft;
    trackRef.current.style.cursor = 'grabbing';
  };
  const onMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - trackRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    trackRef.current.scrollLeft = scrollLeft.current - walk;
  };
  const stopDrag = () => {
    isDragging.current = false;
    if (trackRef.current) trackRef.current.style.cursor = 'grab';
  };

  return (
    <section id="galeri" className="section gallery-section">
      <div className="container">
        <div className="gallery-header">
          <div className="gallery-header__left">
            <span className="text-label" style={{ color: 'var(--accent-primary)' }}>
              <Image size={12} style={{ display: 'inline', marginRight: 6 }} />
              Galeri Festival
            </span>
            <h2 className="text-headline" style={{ marginTop: 8 }}>
              Momen Terbaik<br />
              <span className="gradient-text">SHF Setiap Tahun</span>
            </h2>
          </div>
          <div className="gallery-header__controls">
            <button
              className={`btn btn-outline btn-icon ${!canLeft ? 'gallery-btn--disabled' : ''}`}
              onClick={() => scroll(-1)}
              disabled={!canLeft}
              aria-label="Scroll left"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              className={`btn btn-outline btn-icon ${!canRight ? 'gallery-btn--disabled' : ''}`}
              onClick={() => scroll(1)}
              disabled={!canRight}
              aria-label="Scroll right"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div
          className="gallery-track"
          ref={trackRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
        >
          {GALLERY_IMAGES.map((img) => (
            <div
              key={img.id}
              className={`gallery-item ${active === img.id ? 'gallery-item--active' : ''}`}
              onClick={() => setActive(active === img.id ? null : img.id)}
            >
              <div className="gallery-item__img-wrapper">
                <img
                  src={img.url}
                  alt={img.caption}
                  draggable={false}
                  loading="lazy"
                />
                <div className="gallery-item__overlay">
                  <span className="badge badge-green gallery-item__year">{img.year}</span>
                  <p className="gallery-item__caption">{img.caption}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="gallery-hint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
          Geser atau seret untuk melihat lebih banyak
        </p>
      </div>
    </section>
  );
}
