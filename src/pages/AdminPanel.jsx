 import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, Users, Edit3, Download, LogOut, Search,
  CheckCircle, Clock, Zap, BarChart2, Save, X, AlertCircle,
  Menu, Plus, ShieldCheck, Trophy, Lock, Unlock, Eye, EyeOff,
  RefreshCw, Key, UserPlus, Upload, ChevronDown, ChevronUp, Star, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { useScoreStore } from '../store/scoreStore';
import { useJuriStore } from '../store/juriStore';
import { useEventStore } from '../store/eventStore';
import { formatScore, getScoreGrade, calcBidangTotal, calcSubtotalKriteria, getStatusPenilaian } from '../utils/scoreCalc';
import './AdminPanel.css';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard',    icon: <LayoutDashboard size={18} /> },
  { id: 'peserta',   label: 'Data Peserta', icon: <Users size={18} /> },
  { id: 'juri',      label: 'Manajemen Juri', icon: <ShieldCheck size={18} /> },
  { id: 'nilai',     label: 'Rekap Nilai',  icon: <BarChart2 size={18} /> },
  { id: 'ranking',   label: 'Ranking & Finalisasi', icon: <Trophy size={18} /> },
  { id: 'export',    label: 'Export Data',  icon: <Download size={18} /> },
];

/* ── Bidang Config ── */
const BIDANG_LIST = [
  { id: 'adab', label: 'Adab dan Syair', max: 30, color: 'var(--gold-400)' },
  { id: 'vokal', label: 'Bidang Suara/Vokal', max: 40, color: 'var(--emerald-400)' },
  { id: 'banjari', label: 'Musik Banjari', max: 30, color: '#818cf8' },
  { id: 'jingle', label: 'Jingle', max: 30, color: '#f472b6' },
];

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div className="admin-stat glass-card">
      <div className="admin-stat__icon" style={{ color, background: `${color}18` }}>{icon}</div>
      <div>
        <div className="admin-stat__value" style={{ color }}>{value}</div>
        <div className="admin-stat__label">{label}</div>
        {sub && <div className="admin-stat__sub">{sub}</div>}
      </div>
    </div>
  );
}

/* ── Dashboard Tab ── */
function DashboardTab({ stats, participants, judges, juriProgress, allScores, finalScores }) {
  const allJuriDone = juriProgress.every(j => j.isDone);

  // Nilai Terbaru (5 terakhir)
  const recentScores = useMemo(() => {
    const entries = [];
    participants.forEach(p => {
      const pScores = allScores.filter(s => s.participant_id === p.id);
      if (pScores.length > 0) {
        const lastUpdate = pScores.reduce((best, current) => 
          new Date(best.updated_at) > new Date(current.updated_at) ? best : current
        );
        entries.push({ participant: p, updatedAt: lastUpdate.updated_at });
      }
    });
    return entries.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5);
  }, [allScores, participants]);

  return (
    <div className="admin-tab">
      <div className="admin-tab-header">
        <h2 className="text-title">Ringkasan Festival</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--emerald-400)', fontSize: '0.8125rem' }}>
          <span className="status-dot live" /> Live Sync Aktif
        </div>
      </div>

      <div className="stats-grid-admin">
        <StatCard icon={<Users size={20}/>}         label="Total Peserta"  value={stats.total}        color="var(--emerald-400)" />
        <StatCard icon={<ShieldCheck size={20}/>}   label="Jumlah Juri"   value={judges.length}      color="#818cf8" />
        <StatCard icon={<Zap size={20}/>}           label="Selesai Dinilai (3 Bidang Utama)" value={stats.sudahDinilai} color="var(--gold-400)" />
        <StatCard icon={<Clock size={20}/>}         label="Belum Selesai" value={stats.belumDinilai + stats.sebagian} color="var(--text-muted)" />
      </div>

      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontWeight: 700 }}>Progress Penilaian per Juri</span>
          {allJuriDone && judges.length > 0 && (
            <span className="badge badge-green"><CheckCircle size={13} /> Semua Juri Selesai</span>
          )}
        </div>
        {judges.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Belum ada juri terdaftar.</p>
        ) : juriProgress.map(j => {
          const cfg = BIDANG_LIST.find(b => b.id === j.bidang);
          const c   = cfg?.color || '#818cf8';
          return (
            <div key={j.id} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 600 }}>{j.full_name}</span>
                  <span className="badge badge-xs" style={{ background: `${c}15`, color: c }}>{cfg?.label || 'Belum Diatur'}</span>
                  {!j.is_active && <span className="badge badge-muted" style={{ fontSize: '0.625rem' }}>Nonaktif</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {j.isDone
                    ? <span style={{ color: 'var(--emerald-400)', display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={13}/> Selesai</span>
                    : <span style={{ color: c }}>{j.scored}/{j.total} peserta</span>
                  }
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{j.pct}%</span>
                </div>
              </div>
              <div className="admin-progress-bar" style={{ marginBottom: 0 }}>
                <div
                  className="admin-progress-fill"
                  style={{
                    width: `${j.pct}%`,
                    background: j.isDone ? 'linear-gradient(90deg, var(--emerald-500), var(--emerald-400))' : `linear-gradient(90deg, ${c}, ${c}dd)`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Peserta Update Terakhir */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', fontWeight: 700 }}>
          Penilaian Terbaru
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Grup</th>
                <th>Kategori</th>
                <th>Status Penilaian</th>
                <th>Update Terakhir</th>
              </tr>
            </thead>
            <tbody>
              {recentScores.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>Belum ada penilaian</td></tr>
              ) : recentScores.map(({ participant: p, updatedAt }, i) => {
                const fs = finalScores.find(f => f.participant_id === p.id) || {};
                const s  = getStatusPenilaian(fs);
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{p.group_name}</td>
                    <td><span className={`badge ${p.kategori === 'smp' ? 'badge-gold' : 'badge-green'}`}>{p.kategori.toUpperCase()}</span></td>
                    <td><span className="badge" style={{ color: s.color, background: `${s.color}18` }}>{s.label}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                      {new Date(updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Peserta Tab (Dipertahankan structurenya) ── */
function PesertaTab({ participants, updateStatus, createParticipant, updateParticipant, deleteParticipant }) {
  const [search,      setSearch]      = useState('');
  const [filterKat,   setFilterKat]   = useState('all');
  const [showModal,   setShowModal]   = useState(false);
  const [editTarget,  setEditTarget]  = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    username: '', password: '', groupName: '', schoolName: '', noUrut: '', kategori: 'sd', tingkatPelajar: ''
  });

  const openEdit = (p) => {
    setEditTarget(p);
    setFormData({ 
      username: p.username, password: '', groupName: p.group_name, 
      schoolName: p.school_name || '', noUrut: String(p.no_urut || ''), 
      kategori: p.kategori, tingkatPelajar: p.tingkat_pelajar || ''
    });
    setShowModal(true);
  };

  const openCreate = () => {
    setEditTarget(null);
    setFormData({ username: '', password: '', groupName: '', schoolName: '', noUrut: '', kategori: 'sd', tingkatPelajar: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = editTarget ? await updateParticipant(editTarget.id, formData) : await createParticipant(formData);
    setIsSubmitting(false);
    if (res.success) {
      toast.success(editTarget ? 'Peserta diperbarui' : 'Peserta ditambahkan');
      setShowModal(false);
    } else {
      toast.error(res.error || 'Gagal menyimpan');
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Hapus peserta ${name}? Data nilai juga akan terhapus.`)) {
      const res = await deleteParticipant(id);
      if (res.success) toast.success('Peserta dihapus');
      else toast.error(res.error || 'Gagal menghapus');
    }
  };

  const filtered = participants.filter(p => {
    if (filterKat !== 'all' && p.kategori !== filterKat) return false;
    const q = search.toLowerCase();
    return p.group_name?.toLowerCase().includes(q) || p.school_name?.toLowerCase().includes(q) || String(p.no_urut).includes(q);
  });

  return (
    <div className="admin-tab">
      <div className="admin-tab-header">
        <h2 className="text-title">Data Peserta</h2>
        <button className="btn btn-primary btn-sm" onClick={openCreate}><UserPlus size={16} /> Tambah Peserta</button>
      </div>
      
      <div className="admin-filters">
        <div className="input-with-icon" style={{ flex: 1, maxWidth: 300 }}>
          <Search size={14} className="input-icon" />
          <input type="text" className="input-field" placeholder="Cari peserta..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ v: 'all', l: 'Semua' }, { v: 'sd', l: 'SD' }, { v: 'smp', l: 'SMP' }].map(({ v, l }) => (
            <button key={v} className={`btn btn-sm ${filterKat === v ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilterKat(v)}>{l}</button>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>No.</th><th>Nama Grup / Tim</th><th>Kategori</th><th>Sekolah</th><th>Status Tampil</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{p.no_urut || '—'}</td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{p.group_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.username}</div>
                  </td>
                  <td>
                    <span className={`badge ${p.kategori === 'smp' ? 'badge-gold' : 'badge-green'}`}>{p.kategori.toUpperCase()}</span>
                  </td>
                  <td>{p.school_name || '—'}</td>
                  <td>
                    <select className="status-select" value={p.status} onChange={(e) => updateStatus(p.id, e.target.value)}>
                      <option value="menunggu">Menunggu</option>
                      <option value="tampil">Tampil</option>
                      <option value="selesai">Selesai</option>
                    </select>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-outline btn-icon btn-sm" onClick={() => openEdit(p)} title="Edit"><Edit3 size={14} /></button>
                      <button className="btn btn-outline btn-icon btn-sm" onClick={() => handleDelete(p.id, p.group_name)} style={{ color: 'var(--red-400)', borderColor: 'var(--red-400)' }} title="Hapus"><X size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-scale-in" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h3 className="text-title" style={{ fontSize: '1.125rem' }}>{editTarget ? 'Edit Peserta' : 'Tambah Peserta'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 20 }}>
              {!editTarget && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="input-group">
                    <label className="input-label">Username <span style={{color:'var(--red-400)'}}>*</span></label>
                    <input type="text" required className="input-field" placeholder="nurqolbi" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value.replace(/\s+/g, '')})} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Password <span style={{color:'var(--red-400)'}}>*</span></label>
                    <input type="text" required className="input-field" minLength={6} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                  </div>
                </div>
              )}
              <div className="input-group">
                <label className="input-label">Nama Grup / Tim <span style={{color:'var(--red-400)'}}>*</span></label>
                <input type="text" required className="input-field" value={formData.groupName} onChange={e => setFormData({...formData, groupName: e.target.value})} />
              </div>
              <div className="input-group">
                <label className="input-label">Asal Sekolah</label>
                <input type="text" className="input-field" value={formData.schoolName} onChange={e => setFormData({...formData, schoolName: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div className="input-group">
                  <label className="input-label">Kategori <span style={{color:'var(--red-400)'}}>*</span></label>
                  <select className="input-field" value={formData.kategori} onChange={e => setFormData({...formData, kategori: e.target.value})}>
                    <option value="sd">SD</option><option value="smp">SMP</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Tingkat</label>
                  <input type="text" className="input-field" placeholder="SD/MI" value={formData.tingkatPelajar} onChange={e => setFormData({...formData, tingkatPelajar: e.target.value})} />
                </div>
                <div className="input-group">
                  <label className="input-label">No. Urut</label>
                  <input type="number" className="input-field" min="1" value={formData.noUrut} onChange={e => setFormData({...formData, noUrut: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Loading...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Juri Management Tab ── */
function JuriTab({ judges, createJudge, updateJudge, deleteJudge, resetJudgePassword, participants, allScores }) {
  const [showModal,    setShowModal]    = useState(false);
  const [resetTarget,  setResetTarget]  = useState(null);
  const [newPassword,  setNewPassword]  = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', fullName: '', bidang: 'adab' });

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await createJudge(formData);
    setIsSubmitting(false);
    if (res.success) {
      toast.success('Juri ditambahkan');
      setShowModal(false);
    } else toast.error(res.error || 'Gagal menambahkan');
  };

  return (
    <div className="admin-tab">
      <div className="admin-tab-header">
        <h2 className="text-title">Manajemen Juri</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}><UserPlus size={16} /> Tambah Juri</button>
      </div>
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr><th>Nama Juri</th><th>Username</th><th>Bidang Penilaian</th><th>Status</th><th>Aksi</th></tr>
          </thead>
          <tbody>
            {judges.map(j => (
              <tr key={j.id}>
                <td style={{ fontWeight: 700 }}>{j.full_name}</td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{j.username}</td>
                <td>
                  <select 
                    className="input-field" 
                    style={{ padding: '4px 8px', width: 'auto', fontSize: '0.8125rem', height: 'auto' }}
                    value={j.bidang || ''}
                    onChange={(e) => updateJudge(j.id, { fullName: j.full_name, isActive: j.is_active, bidang: e.target.value })}
                  >
                    <option value="" disabled>Pilih Bidang...</option>
                    {BIDANG_LIST.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
                  </select>
                </td>
                <td>
                  <span className={`badge ${j.is_active ? 'badge-green' : 'badge-muted'}`}>
                    <span className={`status-dot ${j.is_active ? 'done' : 'pending'}`} />{j.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => updateJudge(j.id, { fullName: j.full_name, bidang: j.bidang, isActive: !j.is_active })}>
                      {j.is_active ? <EyeOff size={14}/> : <Eye size={14}/>}
                    </button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setResetTarget(j)}><Key size={14}/></button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { if(window.confirm('Hapus juri?')) deleteJudge(j.id) }} style={{ color: 'var(--red-400)' }}><X size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-scale-in">
            <div className="modal-header">
              <h3 className="text-title" style={{ fontSize: '1.125rem' }}>Tambah Juri Baru</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 20 }}>
              <div className="input-group">
                <label className="input-label">Nama Lengkap</label>
                <input type="text" required className="input-field" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
              </div>
              <div className="input-group">
                <label className="input-label">Bidang Penilaian</label>
                <select required className="input-field" value={formData.bidang} onChange={e => setFormData({...formData, bidang: e.target.value})}>
                  {BIDANG_LIST.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="input-group">
                  <label className="input-label">Username</label>
                  <input type="text" required className="input-field" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                </div>
                <div className="input-group">
                  <label className="input-label">Password</label>
                  <input type="text" required minLength={6} className="input-field" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>Tambah Juri</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {resetTarget && (
        <div className="modal-overlay">
          <div className="modal-content animate-scale-in" style={{ maxWidth: 400 }}>
            <div className="modal-header"><h3 className="text-title">Reset Password</h3></div>
            <div style={{ padding: 20 }}>
              <input type="text" className="input-field" placeholder="Password Baru" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                <button className="btn btn-outline" onClick={() => setResetTarget(null)}>Batal</button>
                <button className="btn btn-primary" onClick={async () => {
                  const res = await resetJudgePassword(resetTarget.id, newPassword);
                  if (res.success) { toast.success('Berhasil reset'); setResetTarget(null); }
                }}>Reset</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Rekap Nilai Tab ── */
function NilaiTab({ participants, allScores, allNotes, finalScores, resetParticipantScores }) {
  const [filterKat,   setFilterKat]   = useState('all');
  const [expandId,    setExpandId]    = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [isResetting, setIsResetting] = useState(false);
  const [resetField,  setResetField]  = useState('all');

  const openReset = (p, e) => { e.stopPropagation(); setResetField('all'); setResetTarget(p); };

  const handleReset = async () => {
    if (!resetTarget) return;
    setIsResetting(true);
    const res = await resetParticipantScores(resetTarget.id, resetField === 'all' ? null : resetField);
    setIsResetting(false);
    if (res.success) {
      const lbl = resetField === 'all' ? 'semua bidang' : (BIDANG_LIST.find(b => b.id === resetField)?.label || resetField);
      toast.success(`✅ Nilai ${resetTarget.group_name} (${lbl}) berhasil direset`);
      setResetTarget(null);
    } else {
      toast.error(res.error || 'Gagal mereset nilai');
    }
  };

  const filtered = participants.filter(p => filterKat === 'all' || p.kategori === filterKat);

  return (
    <div className="admin-tab">
      <div className="admin-tab-header">
        <h2 className="text-title">Rekap Nilai Peserta (Per Bidang)</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ v: 'all', l: 'Semua' }, { v: 'sd', l: 'SD' }, { v: 'smp', l: 'SMP' }].map(({ v, l }) => (
            <button key={v} className={`btn btn-sm ${filterKat === v ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilterKat(v)}>{l}</button>
          ))}
        </div>
      </div>

      {filtered.map(p => {
        const fs = finalScores.find(f => f.participant_id === p.id) || {};
        const isExpanded = expandId === p.id;
        const stat = getStatusPenilaian(fs);

        return (
          <div key={p.id} className="glass-card nilai-row">
            <button className="nilai-row-header" onClick={() => setExpandId(isExpanded ? null : p.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>#{p.no_urut}</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700 }}>{p.group_name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.school_name || '—'}</div>
                </div>
                <span className={`badge ${p.kategori === 'smp' ? 'badge-gold' : 'badge-green'}`}>{p.kategori.toUpperCase()}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="badge" style={{ background: `${stat.color}15`, color: stat.color }}>{stat.label}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: fs.is_complete ? 'var(--emerald-400)' : 'var(--text-muted)' }}>
                  {fs.is_complete ? formatScore(fs.nilai_utama) : '—'}
                </div>
                {allScores.some(s => s.participant_id === p.id) && (
                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    title="Reset penilaian peserta ini"
                    onClick={(e) => openReset(p, e)}
                    style={{ color: 'var(--red-400)', flexShrink: 0 }}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
                {isExpanded ? <ChevronUp size={18} className="text-muted"/> : <ChevronDown size={18} className="text-muted"/>}
              </div>
            </button>
            
            {isExpanded && (
              <div className="nilai-row-body">
                {/* Breakdown tiap bidang */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  {BIDANG_LIST.map(b => {
                    const bScores = allScores.filter(s => s.participant_id === p.id && s.field_id === b.id);
                    const bNote   = allNotes.find(n => n.participant_id === p.id && n.field_id === b.id);
                    const bResult = calcBidangTotal(bScores, bNote?.pengurangan || 0);

                    return (
                      <div key={b.id} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: 12, border: `1px solid ${b.color}30` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: b.color }}>{b.label} {b.id === 'jingle' && <Star size={10} style={{display:'inline'}}/>}</span>
                          {bResult.isEmpty ? <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Belum</span> : (
                            <span style={{ fontSize: '1rem', fontWeight: 800, color: b.color }}>{formatScore(bResult.total)}</span>
                          )}
                        </div>
                        {!bResult.isEmpty && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Total Mentah:</span><span>{formatScore(bResult.raw)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Pengurangan:</span><span style={{ color: 'var(--red-400)' }}>{bResult.pengurangan > 0 ? `-${bResult.pengurangan}` : '0'}</span>
                            </div>
                            {bNote?.catatan && (
                              <div style={{ marginTop: 6, fontStyle: 'italic', borderTop: '1px dashed var(--border-subtle)', paddingTop: 4 }}>
                                "{bNote.catatan}"
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* ── Modal Reset ── */}
      {resetTarget && (
        <div className="modal-overlay">
          <div className="modal-content animate-scale-in" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Trash2 size={20} style={{ color: 'var(--red-400)' }} />
                <h3 className="text-title" style={{ fontSize: '1.125rem' }}>Reset Penilaian</h3>
              </div>
              <button className="btn-icon" onClick={() => setResetTarget(null)}><X size={20}/></button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Info peserta */}
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '12px 16px', borderLeft: '3px solid var(--red-400)' }}>
                <div style={{ fontWeight: 700 }}>{resetTarget.group_name}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>#{resetTarget.no_urut} · {resetTarget.school_name || '—'} · {resetTarget.kategori?.toUpperCase()}</div>
              </div>
              {/* Pilih bidang */}
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 10 }}>Pilih bidang yang akan direset:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[{ id: 'all', label: 'Semua Bidang', sub: 'Hapus seluruh nilai, catatan, dan final score', color: '#ef4444' }, ...BIDANG_LIST.filter(b => allScores.some(s => s.participant_id === resetTarget.id && s.field_id === b.id))].map(b => (
                    <label key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', borderRadius: 8, background: resetField === b.id ? 'rgba(239,68,68,0.08)' : 'transparent', border: resetField === b.id ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--border-subtle)', transition: 'all 0.15s' }}>
                      <input type="radio" name="resetField" value={b.id} checked={resetField === b.id} onChange={() => setResetField(b.id)} style={{ accentColor: '#ef4444' }} />
                      <div>
                        <div style={{ fontWeight: 600, color: b.color || 'var(--text-primary)' }}>{b.label}</div>
                        {b.sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.sub}</div>}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              {/* Warning */}
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '10px 14px', fontSize: '0.8125rem', color: '#f87171', display: 'flex', gap: 8 }}>
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Tindakan ini <strong>tidak dapat dibatalkan</strong>. Juri harus mengisi ulang nilai yang dihapus.</span>
              </div>
              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button className="btn btn-outline" onClick={() => setResetTarget(null)}>Batal</button>
                <button
                  className="btn"
                  style={{ background: '#ef4444', color: '#fff', boxShadow: '0 4px 12px rgba(239,68,68,0.35)' }}
                  disabled={isResetting}
                  onClick={handleReset}
                >
                  {isResetting ? 'Menghapus...' : `Reset ${resetField === 'all' ? 'Semua' : (BIDANG_LIST.find(b => b.id === resetField)?.label || '')}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Ranking Tab ── */
function RankingTab({ participants, finalScores, settings, finalizeScoring, undoFinalize, publishRanking, unpublishRanking, recalcFinalScores }) {
  const [loading, setLoading] = useState(false);

  const handleRecalc = async () => {
    setLoading(true);
    await recalcFinalScores();
    toast.success('Kalkulasi nilai akhir berhasil diperbarui');
    setLoading(false);
  };

  const tiedParticipants = finalScores.filter(f => f.is_tied);

  return (
    <div className="admin-tab">
      <div className="admin-tab-header">
        <h2 className="text-title">Ranking &amp; Finalisasi</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link to="/ranking" className="btn btn-outline btn-sm" style={{ gap: 6 }}>
            <Trophy size={14} style={{ color: 'var(--gold-400)' }} /> Buka Halaman Peringkat
          </Link>
          <button className="btn btn-outline btn-sm" onClick={handleRecalc} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin-icon' : ''} /> Rekalkulasi Nilai
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Status Publikasi */}
        <div className="glass-card" style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              Status Peringkat Internal {settings?.ranking_published ? <span className="badge badge-green">Terkunci &amp; Terverifikasi</span> : <span className="badge badge-muted">Draft Internal</span>}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
              Peringkat bersifat internal (hanya dapat diakses oleh Administrator dan Dewan Juri) dan tidak ditampilkan kepada peserta.
            </p>
          </div>
          <div>
            {settings?.ranking_published ? (
              <button className="btn btn-outline" onClick={unpublishRanking}><EyeOff size={16}/> Sembunyikan Ranking</button>
            ) : (
              <button className="btn btn-primary" onClick={publishRanking}><Eye size={16}/> Publikasikan Ranking</button>
            )}
          </div>
        </div>

        {/* Warning Seri */}
        {tiedParticipants.length > 0 && (
          <div className="glass-card" style={{ padding: 20, background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <AlertCircle size={24} style={{ color: 'var(--gold-400)' }} />
              <div>
                <h3 style={{ fontWeight: 700, color: 'var(--gold-400)' }}>Peringatan: Terdapat Nilai Seri!</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
                  Terdapat {tiedParticipants.length} peserta yang memiliki Total Nilai Utama dan Nilai Vokal yang persis sama. 
                  Sistem menandainya dengan status "SERI" dan tidak memberikan prioritas otomatis. Panitia perlu melakukan rapat keputusan untuk menentukan urutan final.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700 }}>Preview Ranking Utama</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Diurutkan berdasarkan: Total Utama DESC, lalu Vokal DESC</span>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Rank</th><th>Nama Grup</th><th>Tingkat</th><th>Adab</th><th>Vokal</th><th>Banjari</th><th>Total Utama</th><th>Status</th></tr>
            </thead>
            <tbody>
              {/* Gunakan data ranking ter-sort dari store (harus sort lokal karena belum ada tabel ranking_history) */}
              {[...finalScores]
                .filter(f => f.is_complete)
                .sort((a, b) => {
                  if (b.nilai_utama !== a.nilai_utama) return b.nilai_utama - a.nilai_utama;
                  return b.nilai_vokal - a.nilai_vokal;
                })
                .map((f, i) => {
                  const p = participants.find(x => x.id === f.participant_id);
                  if (!p) return null;
                  return (
                    <tr key={f.participant_id} style={f.is_tied ? { background: 'rgba(245,158,11,0.05)' } : {}}>
                      <td style={{ fontWeight: 800 }}>{i + 1}</td>
                      <td style={{ fontWeight: 700 }}>{p.group_name}</td>
                      <td><span className={`badge ${p.kategori === 'smp' ? 'badge-gold' : 'badge-green'}`}>{p.kategori.toUpperCase()}</span></td>
                      <td style={{ color: 'var(--text-muted)' }}>{formatScore(f.nilai_adab)}</td>
                      <td style={{ color: 'var(--emerald-400)', fontWeight: 600 }}>{formatScore(f.nilai_vokal)}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{formatScore(f.nilai_banjari)}</td>
                      <td style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--accent-primary)' }}>{formatScore(f.nilai_utama)}</td>
                      <td>{f.is_tied ? <span className="badge badge-gold">SERI</span> : <span className="badge badge-green">Lolos</span>}</td>
                    </tr>
                  );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Export Tab ── */
function ExportTab({ exportCSV }) {
  const handleExport = () => {
    const csv  = exportCSV();
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `SHF-2026-Rekap-Nilai-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('File CSV berhasil diunduh');
  };

  return (
    <div className="admin-tab">
      <div className="admin-tab-header"><h2 className="text-title">Export Data</h2></div>
      <div className="glass-card" style={{ padding: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--emerald-400)' }}>
            <Download size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700 }}>Export Rekap Nilai Akhir (CSV)</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Format rekapitulasi semua bidang (Adab, Vokal, Banjari, Jingle)
            </div>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleExport}><Download size={16} /> Download CSV</button>
      </div>
    </div>
  );
}

/* ── Main Admin Panel ── */
export default function AdminPanel() {
  const [activeTab,   setActiveTab]   = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuthStore();

  const {
    participants, allScores, allNotes, finalScores,
    fetchAllParticipants, fetchAllScores, fetchAllNotes, fetchFinalScores,
    createParticipant, updateParticipant, deleteParticipant,
    updateParticipantStatus, exportCSV, recalculateFinalScores,
    resetParticipantScores,
  } = useScoreStore();

  const { judges, fetchJudges, createJudge, updateJudge, deleteJudge, resetJudgePassword, getJudgeProgress } = useJuriStore();
  const { settings, fetchSettings, finalizeScoring, undoFinalize, publishRanking, unpublishRanking } = useEventStore();

  useEffect(() => {
    fetchAllParticipants();
    fetchAllScores();
    fetchAllNotes();
    fetchFinalScores();
    fetchJudges();
    fetchSettings();
  }, []);

  const stats = useMemo(() => {
    const done = finalScores.filter(f => f.is_complete).length;
    const partial = finalScores.filter(f =>
      (f.adab_done || f.vokal_done || f.banjari_done) && !f.is_complete
    ).length;
    return {
      total:        participants.length,
      selesai:      participants.filter(p => p.status === 'selesai').length,
      tampil:       participants.filter(p => p.status === 'tampil').length,
      menunggu:     participants.filter(p => p.status === 'menunggu').length,
      sd:           participants.filter(p => p.kategori === 'sd').length,
      smp:          participants.filter(p => p.kategori === 'smp').length,
      sudahDinilai: done,
      sebagian:     partial,
      belumDinilai: participants.length - done - partial,
    };
  }, [participants, finalScores]);
  const juriProgress = getJudgeProgress(allScores, participants);

  return (
    <div className="admin-panel">
      <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : ''}`}>
        <div className="admin-sidebar__logo">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', border: '1.5px solid var(--border-default)', flexShrink: 0, boxShadow: '0 0 12px var(--accent-glow)' }}>
              <img src="/rela.jpg" alt="SHF" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)' }}>SHF Admin</div>
              <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Panel Operator</div>
            </div>
          </Link>
        </div>

        <nav className="admin-sidebar__nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`admin-nav-item ${activeTab === item.id ? 'admin-nav-item--active' : ''}`}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
            >
              {item.icon}<span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <button className="admin-nav-item" onClick={logout} style={{ color: 'var(--text-muted)' }}>
            <LogOut size={18} /><span>Keluar</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="admin-overlay" onClick={() => setSidebarOpen(false)} />}

      <div className="admin-main">
        <header className="admin-topbar">
          <button className="btn btn-ghost btn-icon admin-menu-btn" onClick={() => setSidebarOpen(v => !v)}><Menu size={20} /></button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => { fetchAllScores(); fetchFinalScores(); fetchAllNotes(); }}><RefreshCw size={14} /></button>
            {settings?.ranking_published && <span className="badge badge-green"><span className="status-dot live" /> Ranking Publik</span>}
            <span className="badge badge-green"><span className="status-dot live" /> {stats.sudahDinilai}/{stats.total} Selesai Dinilai</span>
          </div>
        </header>

        <div className="admin-content container">
          {activeTab === 'dashboard' && <DashboardTab stats={stats} participants={participants} allScores={allScores} judges={judges} juriProgress={juriProgress} finalScores={finalScores} />}
          {activeTab === 'peserta' && <PesertaTab participants={participants} updateStatus={updateParticipantStatus} createParticipant={createParticipant} updateParticipant={updateParticipant} deleteParticipant={deleteParticipant} />}
          {activeTab === 'juri' && <JuriTab judges={judges} createJudge={createJudge} updateJudge={updateJudge} deleteJudge={deleteJudge} resetJudgePassword={resetJudgePassword} />}
          {activeTab === 'nilai' && <NilaiTab participants={participants} allScores={allScores} allNotes={allNotes} finalScores={finalScores} resetParticipantScores={resetParticipantScores} />}
          {activeTab === 'ranking' && <RankingTab participants={participants} finalScores={finalScores} settings={settings} finalizeScoring={finalizeScoring} undoFinalize={undoFinalize} publishRanking={publishRanking} unpublishRanking={unpublishRanking} recalcFinalScores={recalculateFinalScores} />}
          {activeTab === 'export' && <ExportTab exportCSV={exportCSV} />}
        </div>
      </div>
    </div>
  );
}
