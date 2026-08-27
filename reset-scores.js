import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Parse .env manually
const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^#\s]+?)=(.*)$/);
  if (match) env[match[1]] = match[2];
});

const supabaseAdmin = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('🔄 Memulai Reset Semua Nilai...');

  // Hapus semua data dari 3 tabel terkait nilai
  const DUMMY_UUID = '00000000-0000-0000-0000-000000000000';
  const { error: e1 } = await supabaseAdmin.from('scores').delete().neq('participant_id', DUMMY_UUID);
  const { error: e2 } = await supabaseAdmin.from('judge_notes').delete().neq('participant_id', DUMMY_UUID);
  const { error: e3 } = await supabaseAdmin.from('final_scores').delete().neq('participant_id', DUMMY_UUID);

  // Kembalikan status peserta menjadi 'menunggu'
  const { error: e4 } = await supabaseAdmin.from('participants').update({ status: 'menunggu' }).neq('id', DUMMY_UUID);

  if (e1 || e2 || e3 || e4) {
    console.error('Ada error saat reset:', e1, e2, e3, e4);
  } else {
    console.log('✅ Semua nilai berhasil dihapus! Sistem bersih.');
  }
}

main().catch(console.error);
