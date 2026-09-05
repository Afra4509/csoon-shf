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

const EXACT_MAPPING = [
  // ── SD (1 s.d. 17) ──────────────────────────────
  { id: 'f5cd52c2-a7fe-4a73-b394-b5cbb3ddad2d', no: 1,  cat: 'sd', group: 'Al - Firdaus',          school: 'SDN Sumber Suko Kejayan',         user: 'alfirdaus_sd1' },
  { id: '6e9980e6-a22b-40af-aa60-1ac71129e62f', no: 2,  cat: 'sd', group: 'Al-Ikhlas',             school: 'SD Islam KHA Wahid Hasyim Bangil', user: 'alikhlas_sd2' },
  { id: 'f6d66bb9-5ec1-4ca3-b216-ffc2e3a91991', no: 3,  cat: 'sd', group: 'Al-Murtadho',           school: 'MI Miftahul Ulum',                user: 'almurtadho_sd3' },
  { id: '9f7d1378-1a4e-40d9-be74-dfb2f863e3e4', no: 4,  cat: 'sd', group: 'Waladun Sholeh 3',       school: 'SD Gentong',                      user: 'waladunsholeh3_sd4' },
  { id: '123c3dcc-7793-4ec9-9d8e-259f79c95cec', no: 5,  cat: 'sd', group: 'Nurul Musthofa',        school: 'UPT SDN Blandongan',              user: 'nurulmusthofa_sd5' },
  { id: '52e3bb0a-56a2-4218-9c87-b773f9d5e471', no: 6,  cat: 'sd', group: 'Al-Fatih',              school: 'SDN Trajeng 2',                   user: 'alfatih_sd6' },
  { id: '8126d25b-810d-416e-9483-a87ffa1865fd', no: 7,  cat: 'sd', group: 'Sunan Bonang',          school: 'SDN Bendungan Kraton',            user: 'sunanbonang_sd7' },
  { id: '06b71613-ccc4-481f-971e-b9aaf6ff68f5', no: 8,  cat: 'sd', group: 'Al-Hidayah',            school: 'SDN Trajeng 1',                   user: 'alhidayah_sd8' },
  { id: '5f546db0-6392-476e-a66b-0e25c0cf0a3a', no: 9,  cat: 'sd', group: 'Habibal Qolbi',         school: 'SD Al - Kausar',                  user: 'habibalqolbi_sd9' },
  { id: '255ce4c9-e927-45df-b730-89c1c3f09e63', no: 10, cat: 'sd', group: 'Tabassam',              school: 'MI Roudhotul Banat Wal Banin',    user: 'tabassam_sd10' },
  { id: 'c09289bf-d166-4c68-96e5-0d23e64b7e0d', no: 11, cat: 'sd', group: 'Nur As salam',          school: 'SDN Gading Rejo II',              user: 'nurassalam_sd11' },
  { id: 'ae86e14a-46ec-4c4c-834a-02fba99d597d', no: 12, cat: 'sd', group: 'Ahbabur Rosul',         school: 'SDN TIDU 1 Pohjentrek',           user: 'ahbaburrosul_sd12' },
  { id: '78b28dc8-f013-4bdc-96b7-7aad237d050f', no: 13, cat: 'sd', group: 'Waladun Sholeh 4',       school: 'SD Gentong',                      user: 'waladunsholeh4_sd13' },
  { id: '31ac8746-a39c-48a3-ae33-3b76c2914713', no: 14, cat: 'sd', group: 'Az-Zahrotul Jannah',     school: 'SD Az-Zahra',                     user: 'azzahrotuljannah_sd14' },
  { id: '57306ed5-601e-41a8-8d54-ce5f2400dcf7', no: 15, cat: 'sd', group: 'Nur Qolbi',             school: 'SDN Kalirejo Bangil',             user: 'nurqolbi_sd15' },
  { id: '15eb2ea6-70d0-43f6-81e8-ad8df04572bc', no: 16, cat: 'sd', group: 'Nurul Musthofa',        school: 'MIN 2 Kota pasuruan',             user: 'nurulmusthofa_min2_sd16' },
  { id: '7df607a7-e537-48f3-98fd-7f95eff65f32', no: 17, cat: 'sd', group: 'An-Nasydatul Islam',     school: 'UPT SDN Bakalan',                 user: 'annasydatul_sd17' },

  // ── SMP (1 s.d. 15) ─────────────────────────────
  { id: '564ccb8b-ae39-4dcf-86d1-425933fa77a8', no: 1,  cat: 'smp', group: 'Muhabbaturrasul Putra', school: 'MTsN 1 Pasuruan',                 user: 'muhabbaturrasulp_smp1' },
  { id: 'cac99ed2-d67f-44f2-b795-1038dd407864', no: 2,  cat: 'smp', group: 'Al-Hikmah',             school: 'MTS Al-Yasini',                   user: 'alhikmah_smp2' },
  { id: 'b587c89e-27d8-441b-b089-93ef17b636c8', no: 3,  cat: 'smp', group: 'Spaza Sabila Nada',     school: 'SMP Az-Zahra',                    user: 'spazasabila_smp3' },
  { id: '59ac2e9c-702d-41a8-8353-bc6e516ea73c', no: 4,  cat: 'smp', group: 'Muhabbaturrasul Putri', school: 'MTsN 1 Pasuruan',                 user: 'muhabbaturrasulpi_smp4' },
  { id: '9d844e78-9586-4af5-bdd9-cfff4fdfa965', no: 5,  cat: 'smp', group: 'Subulussalam',          school: 'SMPN 4 Pasuruan',                 user: 'subulussalam_smp5' },
  { id: '712e734f-85d0-4ced-b823-891115f605d8', no: 6,  cat: 'smp', group: 'Syaqunnabi',            school: 'SMPN 3 Kota Pasuruan',            user: 'syaqunnabi_smp6' },
  { id: '01c176cf-8724-4869-b71c-27ee98d42a41', no: 7,  cat: 'smp', group: 'Al-Miftah',             school: 'MTS miftahul Ulum',               user: 'almiftah_smp7' },
  { id: '0829d216-9490-4191-926b-800f0d87b366', no: 8,  cat: 'smp', group: "Fa'al hakim",           school: 'SMPU Al-Yasini',                  user: 'faalhakim_smp8' },
  { id: '5b6bb655-b4db-4bf4-8946-8d7007c02f76', no: 9,  cat: 'smp', group: 'Nurul Musthofa',        school: 'SMPN 2 Gondang wetan',            user: 'nurulmusthofa_smp9' },
  { id: 'fee3f5f6-a4af-47b7-b744-9faf19c66e40', no: 10, cat: 'smp', group: 'Al-Iman Putri',         school: 'SMPN 1 Pasuruan',                 user: 'alimanputri_smp10' },
  { id: 'f5a456a7-abda-44fc-889f-ce7de08e22ba', no: 11, cat: 'smp', group: 'Al-Abror',              school: 'SMPN 2 Pasuruan',                 user: 'alabror_smp11' },
  { id: 'd3a1ee6c-e836-41f2-ad3d-84d30c93a51f', no: 12, cat: 'smp', group: 'Bustanul Azhar',        school: 'SMP Al-Azhar',                    user: 'bustanulazhar_smp12' },
  { id: '9d2146e1-9a32-4948-b40e-13f0c542cbe9', no: 13, cat: 'smp', group: 'Al-Iman Putra',         school: 'SMPN 1 Pasuruan',                 user: 'alimanputra_smp13' },
  { id: '0794706d-2c26-44e3-a1aa-c04309012188', no: 14, cat: 'smp', group: 'Ar-Roudhoh',            school: 'Mts Roudhotul Banat',             user: 'arroudhoh_smp14' },
  { id: 'fec6bb0d-ecf3-4abb-9ea2-040785958750', no: 15, cat: 'smp', group: 'Junior Al-Hikmah',      school: 'SMP Bayt Al-Hikmah',              user: 'junioralhikmah_smp15' },
];

async function run() {
  console.log('=== Memperbarui Data Penomoran Pasti Berurutan (ID Mapping) ===');

  const rekap = [];

  for (const item of EXACT_MAPPING) {
    const password = `shf${item.no}2026`;
    const email = `${item.user}@shf.ac.id`;

    console.log(`[${item.cat.toUpperCase()} #${item.no}] ${item.group} (${item.school}) -> user: ${item.user}`);

    // Update participants table
    const { error: dbErr } = await supabaseAdmin.from('participants').update({
      no_urut: item.no,
      group_name: item.group,
      school_name: item.school,
      username: item.user,
      kategori: item.cat,
      tingkat_pelajar: item.cat.toUpperCase(),
    }).eq('id', item.id);

    if (dbErr) console.error(`DB update error for ${item.id}:`, dbErr);

    // Update Supabase Auth user
    try {
      await supabaseAdmin.auth.admin.updateUserById(item.id, {
        password: password,
        email: email,
        email_confirm: true,
      });
    } catch (err) {
      console.warn(`Auth update error for ${item.id}:`, err.message);
    }

    rekap.push({
      kategori: item.cat.toUpperCase(),
      no: item.no,
      group: item.group,
      school: item.school,
      username: item.user,
      password: password,
      email: email,
      id: item.id,
    });
  }

  // Tulis CSV
  const csvRows = ['Kategori,No Urut,Nama Grup,Asal Sekolah,Username,Password,Email Login,ID'];
  rekap.forEach(a => {
    csvRows.push(`"${a.kategori}",${a.no},"${a.group}","${a.school}","${a.username}","${a.password}","${a.email}","${a.id}"`);
  });

  fs.writeFileSync('akun_peserta.csv', csvRows.join('\n'), 'utf8');
  fs.writeFileSync('akun_peserta_fix_2026.csv', csvRows.join('\n'), 'utf8');

  console.log('\n Berhasil menata ulang urutan pasti ID!');
}

run();
