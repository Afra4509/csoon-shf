import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Parse .env manually since dotenv might not be installed
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
  console.log('🔄 Memulai Injeksi Nilai Dummy...');

  // 1. Ambil data master
  const { data: participants } = await supabaseAdmin.from('participants').select('*');
  const { data: judges } = await supabaseAdmin.from('judges').select('*');
  const { data: criteria } = await supabaseAdmin.from('scoring_criteria').select('*');

  if (!participants?.length || !judges?.length || !criteria?.length) {
    console.error('Data master (peserta, juri, atau kriteria) tidak lengkap.');
    return;
  }

  const scoresToInsert = [];
  const notesToInsert = [];

  // Maksimal nilai per bidang
  const BIDANG_MAX = {
    adab: 7.5,
    vokal: 10,
    banjari: 10,
    jingle: 7.5
  };

  // 2. Loop & buat data
  for (const p of participants) {
    let adabDone = false, vokalDone = false, banjariDone = false, jingleDone = false;

    for (const j of judges) {
      if (!j.bidang) continue;

      const juriCriteria = criteria.filter(c => c.field_id === j.bidang);
      
      for (const c of juriCriteria) {
        // Random pengurangan jali (0-2) dan khafi (0-2)
        const jali = Math.random() < 0.3 ? 0 : parseFloat((Math.random() * 2).toFixed(1));
        const khafi = Math.random() < 0.3 ? 0 : parseFloat((Math.random() * 2).toFixed(1));
        
        const maks = BIDANG_MAX[j.bidang] || 10;
        const subtotal = Math.max(0, maks - jali - khafi);

        scoresToInsert.push({
          participant_id: p.id,
          judge_id: j.id,
          field_id: j.bidang,
          criteria_id: c.id,
          nilai_jali: jali,
          nilai_khafi: khafi,
          subtotal: parseFloat(subtotal.toFixed(2)),
          updated_at: new Date().toISOString()
        });
      }

      // Catatan juri (kadang ada, kadang kosong)
      const hasNote = Math.random() > 0.5;
      notesToInsert.push({
        participant_id: p.id,
        judge_id: j.id,
        field_id: j.bidang,
        catatan: hasNote ? `Penampilan yang sangat baik, perhatikan tempo.` : null,
        pengurangan: 0,
        is_published: true,
        updated_at: new Date().toISOString()
      });

      if (j.bidang === 'adab') adabDone = true;
      if (j.bidang === 'vokal') vokalDone = true;
      if (j.bidang === 'banjari') banjariDone = true;
      if (j.bidang === 'jingle') jingleDone = true;
    }

    // Update status peserta jadi 'selesai'
    if (adabDone && vokalDone && banjariDone) {
      await supabaseAdmin.from('participants').update({ status: 'selesai' }).eq('id', p.id);
    }
  }

  // 3. Upsert data ke Supabase
  console.log(`Menginjeksi ${scoresToInsert.length} data skor...`);
  const { error: errScores } = await supabaseAdmin.from('scores').upsert(scoresToInsert, { onConflict: 'participant_id,judge_id,criteria_id' });
  if (errScores) {
    console.error('Gagal insert skor:', errScores);
    return;
  }

  console.log(`Menginjeksi ${notesToInsert.length} data catatan juri...`);
  const { error: errNotes } = await supabaseAdmin.from('judge_notes').upsert(notesToInsert, { onConflict: 'participant_id,judge_id,field_id' });
  if (errNotes) {
    console.error('Gagal insert catatan:', errNotes);
    return;
  }

  console.log('✅ Injeksi selesai! Kalkulasi nilai akhir di Admin Panel...');
}

main().catch(console.error);
