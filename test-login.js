import { createClient } from '@supabase/supabase-js';

const URL = process.env.VITE_SUPABASE_URL;
const ANON = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(URL, ANON);

async function testLogin() {
  console.log('Testing login...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@shf.ac.id',
    password: 'adminpassword123',
  });

  if (error) {
    console.error('Login failed:', error.message);
  } else {
    console.log('Login success!', data.user.email);
  }
}

testLogin();
