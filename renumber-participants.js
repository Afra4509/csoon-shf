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

// Urutan resmi SD (1 s.d. 17)
const SD_ORDER = [
  { no: 1,  group: 'Al - Firdaus',          school: 'SDN Sumber Suko Kejayan',         user: 'alfirdaus_sd1' },
  { no: 2,  group: 'Al-Ikhlas',             school: 'SD Islam KHA Wahid Hasyim Bangil', user: 'alikhlas_sd2' },
  { no: 3,  group: 'Al-Murtadho',           school: 'MI Miftahul Ulum',                user: 'almurtadho_sd3' },
  { no: 4,  group: 'Waladun Sholeh 3',       school: 'SD Gentong',                      user: 'waladunsholeh3_sd4' },
  { no: 5,  group: 'Nurul Musthofa',        school: 'UPT SDN Blandongan',              user: 'nurulmusthofa_sd5' },
  { no: 6,  group: 'Al-Fatih',              school: 'SDN Trajeng 2',                   user: 'alfatih_sd6' },
  { no: 7,  group: 'Sunan Bonang',          school: 'SDN Bendungan Kraton',            user: 'sunanbonang_sd7' },
  { no: 8,  group: 'Al-Hidayah',            school: 'SDN Trajeng 1',                   user: 'alhidayah_sd8' },
  { no: 9,  group: 'Habibal Qolbi',         school: 'SD Al - Kausar',                  user: 'habibalqolbi_sd9' },
  { no: 10, group: 'Tabassam',              school: 'MI Roudhotul Banat Wal Banin',    user: 'tabassam_sd10' },
  { no: 11, group: 'Nur As salam',          school: 'SDN Gading Rejo II',              user: 'nurassalam_sd11' },
  { no: 12, group: 'Ahbabur Rosul',         school: 'SDN TIDU 1 Pohjentrek',           user: 'ahbaburrosul_sd12' },
  { no: 13, group: 'Waladun Sholeh 4',       school: 'SD Gentong',                      user: 'waladunsholeh4_sd13' },
  { no: 14, group: 'Az-Zahrotul Jannah',     school: 'SD Az-Zahra',                     user: 'azzahrotuljannah_sd14' },
  { no: 15, group: 'Nur Qolbi',             school: 'SDN Kalirejo Bangil',             user: 'nurqolbi_sd15' },
  { no: 16, group: 'Nurul Musthofa',        school: 'MIN 2 Kota pasuruan',             user: 'nurulmusthofa_min2_sd16' },
  { no: 17, group: 'An-Nasydatul Islam',     school: 'UPT SDN Bakalan',                 user: 'annasydatul_sd17' },
];

// Urutan resmi SMP (1 s.d. 15)
const SMP_ORDER = [
  { no: 1,  group: 'Muhabbaturrasul Putra', school: 'MTsN 1 Pasuruan',                 user: 'muhabbaturrasulp_smp1' },
  { no: 2,  group: 'Al-Hikmah',             school: 'MTS Al-Yasini',                   user: 'alhikmah_smp2' },
  { no: 3,  group: 'Spaza Sabila Nada',     school: 'SMP Az-Zahra',                    user: 'spazasabila_smp3' },
  { no: 4,  group: 'Muhabbaturrasul Putri', school: 'MTsN 1 Pasuruan',                 user: 'muhabbaturrasulpi_smp4' },
  { no: 5,  group: 'Subulussalam',          school: 'SMPN 4 Pasuruan',                 user: 'subulussalam_smp5' },
  { no: 6,  group: 'Syaqunnabi',            school: 'SMPN 3 Kota Pasuruan',            user: 'syaqunnabi_smp6' },
  { no: 7,  group: 'Al-Miftah',             school: 'MTS miftahul Ulum',               user: 'almiftah_smp7' },
  { no: 8,  group: "Fa'al hakim",           school: 'SMPU Al-Yasini',                  user: 'faalhakim_smp8' },
  { no: 9,  group: 'Nurul Musthofa',        school: 'SMPN 2 Gondang wetan',            user: 'nurulmusthofa_smp9' },
  { no: 10, group: 'Al-Iman Putri',         school: 'SMPN 1 Pasuruan',                 user: 'alimanputri_smp10' },
  { no: 11, group: 'Al-Abror',              school: 'SMPN 2 Pasuruan',                 user: 'alabror_smp11' },
  { no: 12, group: 'Bustanul Azhar',        school: 'SMP Al-Azhar',                    user: 'bustanulazhar_smp12' },
  { no: 13, group: 'Al-Iman Putra',         school: 'SMPN 1 Pasuruan',                 user: 'alimanputra_smp13' },
  { no: 14, group: 'Ar-Roudhoh',            school: 'Mts Roudhotul Banat',             user: 'arroudhoh_smp14' },
  { no: 15, group: 'Junior Al-Hikmah',      school: 'SMP Bayt Al-Hikmah',              user: 'junioralhikmah_smp15' },
];

async function main() {
  console.log('=== Penomoran Ulang Berurutan Mulai No. 1 (SD: 1-17, SMP: 1-15) ===');

  const { data: participants } = await supabaseAdmin.from('participants').select('*');
  console.log(`Total peserta di database saat ini: ${participants.length}`);

  const rekap = [];

  // Proses SD
  for (const item of SD_ORDER) {
    // Cari participant di DB yang cocok (berdasarkan sekolah / nama grup)
    const match = participants.find(p => {
      if (p.kategori !== 'sd') return false;
      const s1 = p.school_name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const s2 = item.school.toLowerCase().replace(/[^a-z0-9]/g, '');
      return s1.includes(s2) || s2.includes(s1);
    });

    if (match) {
      const password = `shf${item.no}2026`;
      const email = `${item.user}@shf.ac.id`;

      console.log(`SD #${item.no}: ${item.group} (${item.school}) -> Update user: ${item.user}`);

      // Update di participants table
      await supabaseAdmin.from('participants').update({
        no_urut: item.no,
        username: item.user,
        group_name: item.group,
        school_name: item.school,
      }).eq('id', match.id);

      // Update di auth
      try {
        await supabaseAdmin.auth.admin.updateUserById(match.id, {
          password: password,
          email: email,
          email_confirm: true,
        });
      } catch (err) {
        console.warn(`Auth update note for ${item.group}: ${err.message}`);
      }

      rekap.push({
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
      console.warn(`TIDAK DITEMUKAN MATCH UNTUK SD: ${item.group} (${item.school})`);
    }
  }

  // Proses SMP
  for (const item of SMP_ORDER) {
    const match = participants.find(p => {
      if (p.kategori !== 'smp') return false;
      const g1 = p.group_name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const g2 = item.group.toLowerCase().replace(/[^a-z0-9]/g, '');
      const s1 = p.school_name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const s2 = item.school.toLowerCase().replace(/[^a-z0-9]/g, '');
      return g1 === g2 || s1 === s2 || (g1.includes('putra') && g2.includes('putra')) || (g1.includes('putri') && g2.includes('putri'));
    });

    if (match) {
      const password = `shf${item.no}2026`;
      const email = `${item.user}@shf.ac.id`;

      console.log(`SMP #${item.no}: ${item.group} (${item.school}) -> Update user: ${item.user}`);

      await supabaseAdmin.from('participants').update({
        no_urut: item.no,
        username: item.user,
        group_name: item.group,
        school_name: item.school,
      }).eq('id', match.id);

      try {
        await supabaseAdmin.auth.admin.updateUserById(match.id, {
          password: password,
          email: email,
          email_confirm: true,
        });
      } catch (err) {
        console.warn(`Auth update note for ${item.group}: ${err.message}`);
      }

      rekap.push({
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
      console.warn(`TIDAK DITEMUKAN MATCH UNTUK SMP: ${item.group} (${item.school})`);
    }
  }

  // Simpan CSV
  const csvRows = ['Kategori,No Urut,Nama Grup,Asal Sekolah,Username,Password,Email Login,ID'];
  rekap.forEach(a => {
    csvRows.push(`"${a.kategori}",${a.no},"${a.group}","${a.school}","${a.username}","${a.password}","${a.email}","${a.id || ''}"`);
  });

  fs.writeFileSync('akun_peserta.csv', csvRows.join('\n'), 'utf8');
  fs.writeFileSync('akun_peserta_fix_2026.csv', csvRows.join('\n'), 'utf8');

  console.log(`\n Selesai! Berhasil menata ulang urutan 32 peserta.`);
  console.log(` SD: No. 1 s.d. 17`);
  console.log(` SMP: No. 1 s.d. 15`);
}

main();
