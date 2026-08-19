import { QRCodeSVG } from 'qrcode.react';
import { Download, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import './QRCodeDisplay.css';

export default function QRCodeDisplay({ participantId, participantName, size = 200 }) {
  const url = `${window.location.origin}/dashboard?ref=${participantId}`;

  const handleDownload = () => {
    const svg = document.getElementById(`qr-svg-${participantId}`);
    if (!svg) return;

    const data = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([data], { type: 'image/svg+xml' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `QR-SHF-${participantName?.replace(/\s+/g, '-')}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('QR Code berhasil diunduh');
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'SHF Score', url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link disalin ke clipboard');
    }
  };

  return (
    <div className="qr-display">
      <div className="qr-display__frame">
        <div className="qr-display__inner">
          <QRCodeSVG
            id={`qr-svg-${participantId}`}
            value={url}
            size={size}
            level="H"
            bgColor="transparent"
            fgColor="var(--text-primary)"
            includeMargin={false}
          />
        </div>
        <div className="qr-display__glow" />
      </div>

      <p className="qr-display__label">QR Code Peserta</p>
      <p className="qr-display__name">{participantName}</p>

      <div className="qr-display__actions">
        <button className="btn btn-outline btn-sm" onClick={handleDownload}>
          <Download size={14} />
          Unduh SVG
        </button>
        <button className="btn btn-ghost btn-sm" onClick={handleShare}>
          <Share2 size={14} />
          Bagikan
        </button>
      </div>
    </div>
  );
}
