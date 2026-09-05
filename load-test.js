import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runTest() {
  const TOTAL_REQUESTS = 20000;
  const CONCURRENCY_LIMIT = 500; // Kita batasi 500 per gelombang agar komputer/RAM tidak langsung crash sebelum ngirim
  
  console.log(`🚀 Memulai simulasi EXTREME: ${TOTAL_REQUESTS} pengunjung ke Supabase...`);
  console.log(`⚠️ Peringatan: Ini setara dengan serangan DDoS skala kecil. Supabase kemungkinan besar akan memblokir (Rate Limit) request ini.`);
  
  const start = Date.now();
  let successful = 0;
  let failed = 0;
  let totalTimeSum = 0;

  // Helper function untuk menjalankan batch
  const processBatch = async (batchSize) => {
    const requests = Array.from({ length: batchSize }).map(async () => {
      const reqStart = Date.now();
      try {
        const { error } = await supabase.from('event_settings').select('*');
        if (error) throw error;
        return { success: true, time: Date.now() - reqStart };
      } catch (err) {
        return { success: false, time: Date.now() - reqStart, error: err.message };
      }
    });
    return Promise.all(requests);
  };

  // Proses dalam gelombang (batch)
  for (let i = 0; i < TOTAL_REQUESTS; i += CONCURRENCY_LIMIT) {
    const batchSize = Math.min(CONCURRENCY_LIMIT, TOTAL_REQUESTS - i);
    console.log(`- Mengirim gelombang ${i + 1} sampai ${i + batchSize}...`);
    
    const results = await processBatch(batchSize);
    
    results.forEach(r => {
      if (r.success) {
        successful++;
        totalTimeSum += r.time;
      } else {
        failed++;
      }
    });
  }

  const totalExecutionTime = Date.now() - start;
  const avgTime = successful > 0 ? totalTimeSum / successful : 0;

  console.log('\n📊 HASIL LOAD TEST (20.000 REQUEST):');
  console.log(`- Total Request Dikirim: ${TOTAL_REQUESTS}`);
  console.log(`- Request Berhasil: ${successful}`);
  console.log(`- Request Gagal / Ditolak (Blocked): ${failed}`);
  if (successful > 0) {
    console.log(`- Kecepatan Rata-rata Respons: ${Math.round(avgTime)} milidetik per request`);
  }
  console.log(`- Total Waktu Dieksekusi: ${(totalExecutionTime / 1000).toFixed(2)} detik`);
  
  console.log('\n💡 KESIMPULAN 20.000 TRAFIK:');
  if (failed > 0) {
    console.log('⚠️ Sesuai dugaan, sistem proteksi Supabase / Cloudflare langsung mendeteksi ini sebagai anomali (serangan) dan memblokir / menolak request Anda (Rate Limit).');
    console.log('⚠️ Dalam kondisi nyata di dunia nyata, 20.000 orang biasanya tidak akan menekan tombol di milidetik yang sama persis, jadi beban akan lebih tersebar.');
  } else {
    console.log('✅ LUAR BIASA! Supabase Anda berhasil menahan 20.000 request tanpa ada yang diblokir!');
  }
}

runTest();
