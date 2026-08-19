// run-migration.js — Jalankan: node run-migration.js
// Script untuk mengeksekusi schema SQL baru ke Supabase
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const URL = 'https://dzmqdzdjxeloaggrxtwm.supabase.co';
const SVC = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bXFkemRqeGVsb2FnZ3J4dHdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njc3NDgwMCwiZXhwIjoyMTAyMzUwODAwfQ.HCrIcH7wGEeac1MtghViTvIX_f1h-IVR6AQDQ22BO00';

const supabaseAdmin = createClient(URL, SVC, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: 'public' },
});

// Jalankan SQL via REST API Supabase (pg-meta endpoint)
async function runSQL(sql) {
  const response = await fetch(`${URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SVC}`,
      'apikey': SVC,
    },
    body: JSON.stringify({ query: sql }),
  });
  return response;
}

async function main() {
  console.log('🚀 Memulai migrasi database SHF v3...\n');

  const sql = fs.readFileSync('./schema.sql', 'utf8');

  // Split by statement and run each
  // Use Supabase pg-meta API
  const pgMetaUrl = `${URL}/pg-meta/v0/query`;

  const response = await fetch(pgMetaUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SVC}`,
      'apikey': SVC,
    },
    body: JSON.stringify({ query: sql }),
  });

  const text = await response.text();

  if (response.ok) {
    console.log('✅ Migrasi berhasil!');
  } else {
    console.error('❌ Migrasi gagal:', response.status, text);

    // Coba cara lain: via supabase-js rpc
    console.log('\n⏳ Mencoba cara alternatif...');
    console.log('Silakan copy paste schema.sql ke Supabase Dashboard > SQL Editor dan jalankan manual.');
    console.log('\nSupabase URL:', URL);
  }
}

main().catch(console.error);
