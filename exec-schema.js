// exec-schema.js — Jalankan schema SQL via Supabase pg-meta v0
// menggunakan service role key
import fs from 'fs';

const SUPABASE_URL = 'https://dzmqdzdjxeloaggrxtwm.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bXFkemRqeGVsb2FnZ3J4dHdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njc3NDgwMCwiZXhwIjoyMTAyMzUwODAwfQ.HCrIcH7wGEeac1MtghViTvIX_f1h-IVR6AQDQ22BO00';

async function execSQL(sql) {
  // Supabase supports arbitrary SQL via the pg endpoint when using service role
  const url = `${SUPABASE_URL}/rest/v1/rpc/`;
  
  // Try via supabase's internal postgres endpoint  
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
    },
  });
  
  console.log('REST API check:', resp.status);
  const text = await resp.text();
  console.log(text.substring(0, 200));
}

// Try PostgreSQL via different approach
async function runQuery(sql) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_raw_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
    },
    body: JSON.stringify({ sql }),
  });
  return { status: resp.status, body: await resp.text() };
}

async function main() {
  // Test: Check what tables exist
  console.log('Checking existing tables...');
  const r = await runQuery("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;");
  console.log('Status:', r.status);
  console.log('Body:', r.body.substring(0, 500));
}

main().catch(console.error);
