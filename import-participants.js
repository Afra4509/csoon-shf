import { createClient } from '@supabase/supabase-js';

const URL = process.env.VITE_SUPABASE_URL;
const SVC = process.env.VITE_SUPABASE_SERVICE_KEY;

const supabaseAdmin = createClient(URL, SVC, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const data = [
  // SD
  { no: 1, group: 'GRUP NUR QOLBI', school: 'SDN KALIREJO BANGIL', cat: 'sd' },
  { no: 2, group: 'SDN TRAJENG 2', school: 'SDN TRAJENG 2', cat: 'sd' },
  { no: 3, group: 'GRUP NURUL MUSTOFA', school: 'UPT SDN BLANDONGAN', cat: 'sd' },
  { no: 4, group: 'MI ROUDOTUL BANAT', school: 'MI ROUDOTUL BANAT', cat: 'sd' },
  // SMP
  { no: 1, group: 'BANJARI SMP BAYT AL HIKMAH', school: 'SMP BAYT AL HIKMAH', cat: 'smp' },
  { no: 2, group: 'SMPN 2 GONDANG WETAN', school: 'SMPN 2 GONDANG WETAN', cat: 'smp' },
  { no: 3, group: 'AL IMAN PUTRA', school: 'SMP 1 PASURUAN', cat: 'smp' },
  { no: 4, group: 'AL IMAN PUTRI', school: 'SMP 1 PASURUAN', cat: 'smp' },
  { no: 5, group: 'MTS ROUDOTUL BANAT', school: 'MTS ROUDOTUL BANAT', cat: 'smp' },
];

async function main() {
  console.log('Mengimpor peserta...');

  for (const p of data) {
    const rawUsername = p.group.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 15) || `peserta${p.cat}${p.no}`;
    const username = `${rawUsername}_${p.cat}${p.no}`;
    const email = `${username}@shf.ac.id`;
    const password = `shf${p.no}2026`;

    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
    });

    if (authErr) {
      console.error(`Gagal membuat auth untuk ${p.group}: ${authErr.message}`);
      continue;
    }

    const { error: dbErr } = await supabaseAdmin.from('participants').insert({
      id: authData.user.id,
      username: username,
      group_name: p.group,
      school_name: p.school,
      no_urut: p.no,
      kategori: p.cat,
      status: 'menunggu'
    });

    if (dbErr) {
      console.error(`Gagal insert ke db untuk ${p.group}: ${dbErr.message}`);
    } else {
      console.log(`Berhasil insert: ${p.group} (Kategori: ${p.cat}, No: ${p.no}) -> Username: ${username}`);
    }
  }
}

main();
