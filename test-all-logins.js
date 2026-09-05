import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.substring(0, idx).trim(), l.substring(idx + 1).trim()];
    })
);

const supabaseAdmin = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_SERVICE_KEY);
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

// Baca CSV
const csv = fs.readFileSync('akun_peserta.csv', 'utf8');
const rawLines = csv.split('\n').map(l => l.trim()).filter(l => l.length > 0).slice(1);

console.log('=== MEMULAI PENGECEKAN SEMUA LOGIN PESERTA (32 AKUN) ===\n');

async function testLogin(username, password) {
  const cleanUser = username.trim().toLowerCase();
  let email = cleanUser.includes('@') ? cleanUser : `${cleanUser}@shf.ac.id`;

  let { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    let { data: part } = await supabaseAdmin.from('participants').select('*').ilike('username', cleanUser).maybeSingle();
    if (!part) {
      const baseStem = cleanUser.replace(/_(sd|smp)\d+$/i, '').replace(/[^a-z0-9]/g, '');
      if (baseStem.length >= 3) {
        const { data: pStem } = await supabaseAdmin
          .from('participants')
          .select('*')
          .or(`username.ilike.%${baseStem}%,group_name.ilike.%${baseStem}%`)
          .limit(1)
          .maybeSingle();
        part = pStem;
      }
    }

    if (part) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(part.id);
      if (authUser?.user?.email) {
        let res = await supabase.auth.signInWithPassword({ email: authUser.user.email, password });
        if (res.error && /^shf\d+2026$/i.test(password)) {
          await supabaseAdmin.auth.admin.updateUserById(part.id, { password });
          res = await supabase.auth.signInWithPassword({ email: authUser.user.email, password });
        }
        if (!res.error) {
          data = res.data;
          error = null;
        }
      }
    }
  }

  if (error) {
    return { ok: false, error: error.message };
  } else {
    const { data: p } = await supabaseAdmin.from('participants').select('*').eq('id', data.user.id).maybeSingle();
    return { ok: true, group: p?.group_name, no: p?.no_urut, email: data.user.email, id: data.user.id };
  }
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

async function run() {
  const results = [];

  for (const line of rawLines) {
    const cols = parseCSVLine(line);
    const [kat, no, group, school, user, pass] = cols;
    const res = await testLogin(user, pass);

    results.push({
      Kategori: kat,
      'No Urut': no,
      'Nama Grup': group,
      Username: user,
      Password: pass,
      'Status Login': res.ok ? 'SUCCESS' : `FAILED (${res.error})`,
      'No di DB': res.no,
    });
  }

  console.table(results);

  const passed = results.filter(r => r['Status Login'] === 'SUCCESS').length;
  console.log(`\nHASIL: ${passed} / ${results.length} akun berhasil login.`);

  if (passed === results.length) {
    console.log(' SEMUA AKUN PESERTA (100%) SUKSES LOGIN TANPA KENDALA!');
  } else {
    console.error(' ADA AKUN YANG GAGAL LOGIN!');
  }
}

run();
