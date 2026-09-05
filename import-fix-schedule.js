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

const supabaseAdmin = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── DATA RESMI JADWAL TAMPIL SD SHF FIX 2026-1 ─────────────
const SD_SCHEDULE = [
  { no: 9,  group: 'Al - Firdaus',          school: 'SDN Sumber Suko Kejayan',         user: 'alfirdaus_sd9' },
  { no: 10, group: 'Al-Ikhlas',             school: 'SD Islam KHA Wahid Hasyim Bangil', user: 'alikhlas_sd10' },
  { no: 11, group: 'Al-Murtadho',           school: 'MI Miftahul Ulum',                user: 'almurtadho_sd11' },
  { no: 12, group: 'Waladun Sholeh 3',       school: 'SD Gentong',                      user: 'waladunsholeh3_sd12' },
  { no: 13, group: 'Nurul Musthofa',        school: 'UPT SDN Blandongan',              user: 'nurulmusthofa_sd13', isExisting: true, oldSchool: 'UPT SDN BLANDONGAN' },
  { no: 14, group: 'Al-Fatih',              school: 'SDN Trajeng 2',                   user: 'alfatih_sd14', isExisting: true, oldSchool: 'SDN TRAJENG 2' },
  { no: 15, group: 'Sunan Bonang',          school: 'SDN Bendungan Kraton',            user: 'sunanbonang_sd15' },
  { no: 16, group: 'Al-Hidayah',            school: 'SDN Trajeng 1',                   user: 'alhidayah_sd16' },
  { no: 17, group: 'Habibal Qolbi',         school: 'SD Al - Kausar',                  user: 'habibalqolbi_sd17' },
  { no: 18, group: 'Tabassam',              school: 'MI Roudhotul Banat Wal Banin',    user: 'tabassam_sd18', isExisting: true, oldSchool: 'MI ROUDOTUL BANAT' },
  { no: 19, group: 'Nur As salam',          school: 'SDN Gading Rejo II',              user: 'nurassalam_sd19' },
  { no: 20, group: 'Ahbabur Rosul',         school: 'SDN TIDU 1 Pohjentrek',           user: 'ahbaburrosul_sd20' },
  { no: 21, group: 'Waladun Sholeh 4',       school: 'SD Gentong',                      user: 'waladunsholeh4_sd21' },
  { no: 22, group: 'Az-Zahrotul Jannah',     school: 'SD Az-Zahra',                     user: 'azzahrotuljannah_sd22' },
  { no: 23, group: 'Nur Qolbi',             school: 'SDN Kalirejo Bangil',             user: 'nurqolbi_sd23', isExisting: true, oldSchool: 'SDN KALIREJO BANGIL' },
  { no: 24, group: 'Nurul Musthofa',        school: 'MIN 2 Kota pasuruan',             user: 'nurulmusthofa_min2_sd24' },
  { no: 25, group: 'An-Nasydatul Islam',     school: 'UPT SDN Bakalan',                 user: 'annasydatul_sd25' },
];

// ── DATA RESMI JADWAL TAMPIL SMP SHF FIX 2026-1 ────────────
const SMP_SCHEDULE = [
  { no: 11, group: 'Muhabbaturrasul Putra', school: 'MTsN 1 Pasuruan',                 user: 'muhabbaturrasulp_smp11' },
  { no: 12, group: 'Al-Hikmah',             school: 'MTS Al-Yasini',                   user: 'alhikmah_smp12' },
  { no: 13, group: 'Spaza Sabila Nada',     school: 'SMP Az-Zahra',                    user: 'spazasabila_smp13' },
  { no: 14, group: 'Muhabbaturrasul Putri', school: 'MTsN 1 Pasuruan',                 user: 'muhabbaturrasulpi_smp14' },
  { no: 15, group: 'Subulussalam',          school: 'SMPN 4 Pasuruan',                 user: 'subulussalam_smp15' },
  { no: 16, group: 'Syaqunnabi',            school: 'SMPN 3 Kota Pasuruan',            user: 'syaqunnabi_smp16' },
  { no: 17, group: 'Al-Miftah',             school: 'MTS miftahul Ulum',               user: 'almiftah_smp17' },
  { no: 18, group: "Fa'al hakim",           school: 'SMPU Al-Yasini',                  user: 'faalhakim_smp18' },
  { no: 19, group: 'Nurul Musthofa',        school: 'SMPN 2 Gondang wetan',            user: 'nurulmusthofa_smp19', isExisting: true, oldSchool: 'SMPN 2 GONDANG WETAN' },
  { no: 20, group: 'Al-Iman Putri',         school: 'SMPN 1 Pasuruan',                 user: 'alimanputri_smp20', isExisting: true, oldSchool: 'SMP 1 PASURUAN' },
  { no: 21, group: 'Al-Abror',              school: 'SMPN 2 Pasuruan',                 user: 'alabror_smp21' },
  { no: 22, group: 'Bustanul Azhar',        school: 'SMP Al-Azhar',                    user: 'bustanulazhar_smp22' },
  { no: 23, group: 'Al-Iman Putra',         school: 'SMPN 1 Pasuruan',                 user: 'alimanputra_smp23', isExisting: true, oldSchool: 'SMP 1 PASURUAN', oldGroup: 'AL IMAN PUTRA' },
  { no: 24, group: 'Ar-Roudhoh',            school: 'Mts Roudhotul Banat',             user: 'arroudhoh_smp24', isExisting: true, oldSchool: 'MTS ROUDOTUL BANAT' },
  { no: 25, group: 'Junior Al-Hikmah',      school: 'SMP Bayt Al-Hikmah',              user: 'junioralhikmah_smp25', isExisting: true, oldSchool: 'SMP BAYT AL HIKMAH' },
];

async function run() {
  console.log('=== Sinkronisasi Jadwal Tampil & Peserta SHF 2026 ===');

  // Ambil data peserta lama
  const { data: existingParts, error: eParts } = await supabaseAdmin.from('participants').select('*');
  if (eParts) {
    console.error('Gagal mengambil data peserta:', eParts);
    return;
  }
  console.log(`Ditemukan ${existingParts.length} data peserta di database.`);

  const allAccounts = [];

  // ── 1. PROSES SD ──────────────────────────────────────────
  for (const item of SD_SCHEDULE) {
    const password = `shf${item.no}2026`;
    const email = `${item.user}@shf.ac.id`;

    // Cek apakah match dengan peserta lama (berdasarkan sekolah / id)
    let match = null;
    if (item.isExisting) {
      match = existingParts.find(p => p.kategori === 'sd' && p.school_name.toLowerCase().includes(item.oldSchool.toLowerCase()));
    }

    if (match) {
      console.log(`[UPDATE SD #${item.no}] Menyesuaikan ${match.group_name} -> ${item.group} (${item.school})`);
      // Update data di participants
      await supabaseAdmin.from('participants').update({
        group_name: item.group,
        school_name: item.school,
        no_urut: item.no,
        username: item.user,
        tingkat_pelajar: 'SD',
      }).eq('id', match.id);

      // Update password auth & email auth
      try {
        await supabaseAdmin.auth.admin.updateUserById(match.id, {
          password: password,
          email: email,
          email_confirm: true,
        });
      } catch (err) {
        console.warn(`Peringatan update auth untuk ${item.group}:`, err.message);
      }

      allAccounts.push({
        kategori: 'SD',
        no: item.no,
        group: item.group,
        school: item.school,
        username: item.user,
        password: password,
        email: email,
        id: match.id,
      });
    } else {
      // Buat peserta baru
      console.log(`[TAMBAH SD #${item.no}] Membuat akun baru untuk ${item.group} (${item.school})`);
      
      // Buat auth user
      let userId = null;
      const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
      });

      if (authErr) {
        // Jika sudah ada user auth dengan email itu
        console.warn(`User auth ${email} sudah ada atau error: ${authErr.message}`);
        const { data: listU } = await supabaseAdmin.auth.admin.listUsers();
        const found = listU?.users?.find(u => u.email === email);
        if (found) userId = found.id;
      } else {
        userId = authUser.user.id;
      }

      if (userId) {
        const { error: insErr } = await supabaseAdmin.from('participants').upsert({
          id: userId,
          username: item.user,
          group_name: item.group,
          school_name: item.school,
          no_urut: item.no,
          kategori: 'sd',
          tingkat_pelajar: 'SD',
          status: 'menunggu',
        }, { onConflict: 'id' });

        if (insErr) console.error(`Error insert peserta ${item.group}:`, insErr);
      }

      allAccounts.push({
        kategori: 'SD',
        no: item.no,
        group: item.group,
        school: item.school,
        username: item.user,
        password: password,
        email: email,
        id: userId,
      });
    }
  }

  // ── 2. PROSES SMP ─────────────────────────────────────────
  for (const item of SMP_SCHEDULE) {
    const password = `shf${item.no}2026`;
    const email = `${item.user}@shf.ac.id`;

    let match = null;
    if (item.isExisting) {
      if (item.oldGroup) {
        match = existingParts.find(p => p.kategori === 'smp' && p.group_name.toUpperCase().includes(item.oldGroup));
      } else if (item.oldSchool.includes('BAYT')) {
        match = existingParts.find(p => p.kategori === 'smp' && p.school_name.toUpperCase().includes('BAYT'));
      } else if (item.oldSchool.includes('ROUDOTUL')) {
        match = existingParts.find(p => p.kategori === 'smp' && p.school_name.toUpperCase().includes('ROUDOTUL'));
      } else if (item.oldSchool.includes('GONDANG')) {
        match = existingParts.find(p => p.kategori === 'smp' && p.school_name.toUpperCase().includes('GONDANG'));
      } else if (item.no === 20) {
        // Al-Iman Putri
        match = existingParts.find(p => p.kategori === 'smp' && p.group_name.toUpperCase().includes('PUTRI'));
      }
    }

    if (match) {
      console.log(`[UPDATE SMP #${item.no}] Menyesuaikan ${match.group_name} -> ${item.group} (${item.school})`);
      await supabaseAdmin.from('participants').update({
        group_name: item.group,
        school_name: item.school,
        no_urut: item.no,
        username: item.user,
        tingkat_pelajar: 'SMP',
      }).eq('id', match.id);

      try {
        await supabaseAdmin.auth.admin.updateUserById(match.id, {
          password: password,
          email: email,
          email_confirm: true,
        });
      } catch (err) {
        console.warn(`Peringatan update auth untuk ${item.group}:`, err.message);
      }

      allAccounts.push({
        kategori: 'SMP',
        no: item.no,
        group: item.group,
        school: item.school,
        username: item.user,
        password: password,
        email: email,
        id: match.id,
      });
    } else {
      console.log(`[TAMBAH SMP #${item.no}] Membuat akun baru untuk ${item.group} (${item.school})`);
      let userId = null;
      const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
      });

      if (authErr) {
        console.warn(`User auth ${email} sudah ada atau error: ${authErr.message}`);
        const { data: listU } = await supabaseAdmin.auth.admin.listUsers();
        const found = listU?.users?.find(u => u.email === email);
        if (found) userId = found.id;
      } else {
        userId = authUser.user.id;
      }

      if (userId) {
        const { error: insErr } = await supabaseAdmin.from('participants').upsert({
          id: userId,
          username: item.user,
          group_name: item.group,
          school_name: item.school,
          no_urut: item.no,
          kategori: 'smp',
          tingkat_pelajar: 'SMP',
          status: 'menunggu',
        }, { onConflict: 'id' });

        if (insErr) console.error(`Error insert peserta ${item.group}:`, insErr);
      }

      allAccounts.push({
        kategori: 'SMP',
        no: item.no,
        group: item.group,
        school: item.school,
        username: item.user,
        password: password,
        email: email,
        id: userId,
      });
    }
  }

  // ── 3. TULIS REKAP CSV ─────────────────────────────────────
  const csvRows = ['Kategori,No Urut,Nama Grup,Asal Sekolah,Username,Password,Email Login,ID'];
  allAccounts.forEach(a => {
    csvRows.push(`"${a.kategori}",${a.no},"${a.group}","${a.school}","${a.username}","${a.password}","${a.email}","${a.id || ''}"`);
  });

  fs.writeFileSync('akun_peserta_fix_2026.csv', csvRows.join('\n'), 'utf8');
  fs.writeFileSync('akun_peserta.csv', csvRows.join('\n'), 'utf8');
  console.log(`\n Berhasil mengimpor & memperbarui ${allAccounts.length} akun peserta.`);
  console.log(` File akun tersimpan di: akun_peserta_fix_2026.csv dan akun_peserta.csv`);
}

run();
