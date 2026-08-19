import fs from 'fs';
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dzmqdzdjxeloaggrxtwo.supabase.co';
const SUPABASE_SVC = process.env.SUPABASE_SERVICE_KEY || '';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SVC, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Helper: baca CSV
function readCSV(filename) {
  const content = fs.readFileSync(filename, 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(l => l);
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = line.split(',');
    return headers.reduce((obj, h, i) => ({ ...obj, [h.trim()]: values[i] }), {});
  });
}

async function getOrCreateUser(email, password, username) {
  // Coba buat
  const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email, password, email_confirm: true
  });
  if (authData?.user) return authData.user;
  
  // Jika gagal karena sudah ada, cari via admin API listUsers (cukup limit karena user dikit)
  const { data: list } = await supabaseAdmin.auth.admin.listUsers();
  const existing = list?.users?.find(u => u.email === email);
  if (existing) return existing;
  
  throw new Error(`Gagal create dan gagal find user: ${email} - ${authErr?.message}`);
}

async function main() {
  console.log('--- MEMULAI IMPORT JURI & PESERTA (V3) ---');

  try {
    // 1. IMPORT JURI
    const judgesData = readCSV('akun_juri.csv');
    console.log(`Ditemukan ${judgesData.length} juri di CSV`);
    for (const j of judgesData) {
      if (!j.Username) continue;
      const user = await getOrCreateUser(j['Email Login'], j.Password, j.Username);
      
      const { error: dbErr } = await supabaseAdmin.from('judges').upsert({
        id: user.id,
        username: j.Username,
        full_name: j['Nama/Jabatan'],
        is_active: true,
        // Set default bidang jika ada keyword di nama
        bidang: j['Nama/Jabatan'].toLowerCase().includes('adab') ? 'adab' :
                j['Nama/Jabatan'].toLowerCase().includes('vokal') ? 'vokal' :
                j['Nama/Jabatan'].toLowerCase().includes('terbang') ? 'banjari' : 'adab'
      });
      if (dbErr) console.error(`[X] Gagal insert Juri ${j.Username}: ${dbErr.message}`);
      else console.log(`[V] Berhasil Juri: ${j.Username}`);
    }

    // 2. IMPORT PESERTA
    const participantsData = readCSV('akun_peserta.csv');
    console.log(`\nDitemukan ${participantsData.length} peserta di CSV`);
    for (const p of participantsData) {
      if (!p.Username) continue;
      const user = await getOrCreateUser(p['Email Login'], p.Password, p.Username);

      const { error: dbErr } = await supabaseAdmin.from('participants').upsert({
        id: user.id,
        username: p.Username,
        group_name: p['Nama Grup'],
        school_name: p['Asal Sekolah'],
        no_urut: parseInt(p['No Urut']),
        kategori: p.Kategori.toLowerCase(),
        tingkat_pelajar: p.Kategori,
        status: 'menunggu'
      });
      if (dbErr) console.error(`[X] Gagal insert Peserta ${p.Username}: ${dbErr.message}`);
      else console.log(`[V] Berhasil Peserta: ${p.Username}`);
    }

    console.log('\n--- SELESAI ---');
  } catch (err) {
    console.error('Terjadi kesalahan:', err);
  }
}

main();
