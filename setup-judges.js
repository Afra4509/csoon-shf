import { createClient } from '@supabase/supabase-js';

const URL = process.env.VITE_SUPABASE_URL;
const SVC = process.env.VITE_SUPABASE_SERVICE_KEY;

const supabaseAdmin = createClient(URL, SVC, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const judgesToCreate = [
    { username: 'juriadab', fullName: 'Juri Adab: Gus Dawud Zahiruddin', password: 'password123' },
    { username: 'jurivokal', fullName: 'Juri Vokal: Gus Munawwirul Makin', password: 'password123' },
    { username: 'juriterbang', fullName: 'Juri Terbang: Gus Muhsin', password: 'password123' },
  ];

  console.log('Menambahkan Juri...');

  for (const j of judgesToCreate) {
    const email = `${j.username}@shf-juri.ac.id`;
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: j.password,
      email_confirm: true,
      user_metadata: { full_name: j.fullName }
    });

    if (error) {
      console.error(`Error membuat ${j.username}:`, error.message);
    } else {
      console.log(`Berhasil membuat user Auth untuk ${j.username} (${j.fullName})`);
      
      // Insert ke tabel judges
      const { error: dbError } = await supabaseAdmin.from('judges').insert({
        id: data.user.id,
        username: j.username,
        full_name: j.fullName,
        is_active: true
      });
      
      if (dbError) {
        console.error(`Error insert ke tabel judges untuk ${j.username}:`, dbError.message);
      } else {
        console.log(`Berhasil insert data Juri ke tabel: ${j.fullName}`);
      }
    }
  }
}

main();
