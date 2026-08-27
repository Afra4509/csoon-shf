import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

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
  console.log('🔄 Mengupdate nama kriteria...');

  // Lihat dulu apa yang ada
  const { data: all } = await supabaseAdmin.from('scoring_criteria').select('*').order('sort_order');
  console.log('\nKriteria saat ini:');
  all?.forEach(c => console.log(`  [${c.field_id}] ${c.id} — "${c.label}"`));

  // Update: Kerapian Busana → Kesiapan Peserta
  const { data, error } = await supabaseAdmin
    .from('scoring_criteria')
    .update({ label: 'Kesiapan Peserta' })
    .eq('label', 'Kerapian Busana')
    .select();

  if (error) {
    console.error('❌ Gagal update:', error.message);
    return;
  }

  if (data?.length === 0) {
    console.log('\n⚠️  Tidak ada baris yang diupdate — kriteria mungkin sudah bernama "Kesiapan Peserta" atau belum ada di DB.');
  } else {
    console.log(`\n✅ Berhasil update ${data?.length} kriteria:`);
    data?.forEach(c => console.log(`  [${c.field_id}] "${c.label}"`));
  }
}

main().catch(console.error);
