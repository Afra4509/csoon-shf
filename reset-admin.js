import { createClient } from '@supabase/supabase-js';

const URL = process.env.VITE_SUPABASE_URL;
const SVC = process.env.VITE_SUPABASE_SERVICE_KEY;

const supabaseAdmin = createClient(URL, SVC, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const email = 'admin@shf.ac.id';
  const password = 'adminpassword123'; // Password baru yang akan diset

  console.log('Mencari user admin...');
  const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (listError) {
    console.error('Gagal mengambil daftar user:', listError.message);
    return;
  }

  const adminUser = users.users.find(u => u.email === email);

  if (adminUser) {
    console.log('User admin ditemukan, mereset password...');
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(adminUser.id, {
      password: password,
      email_confirm: true
    });
    if (updateError) {
      console.error('Gagal reset password:', updateError.message);
    } else {
      console.log(`Berhasil! Password admin telah diubah menjadi: ${password}`);
    }
  } else {
    console.log('User admin belum ada. Membuat akun admin baru...');
    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true
    });
    if (createError) {
      console.error('Gagal membuat admin:', createError.message);
    } else {
      console.log(`Berhasil! Akun admin dibuat dengan password: ${password}`);
    }
  }
}

main();
