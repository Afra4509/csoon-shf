// run-schema.js — Eksekusi schema SQL ke Supabase via pg-meta REST API
// Jalankan: node run-schema.js
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://dzmqdzdjxeloaggrxtwm.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bXFkemRqeGVsb2FnZ3J4dHdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njc3NDgwMCwiZXhwIjoyMTAyMzUwODAwfQ.HCrIcH7wGEeac1MtghViTvIX_f1h-IVR6AQDQ22BO00';

// Extract project ref from URL
const projectRef = 'dzmqdzdjxeloaggrxtwm';

async function execSQL(sql) {
  // Try Supabase Management API
  const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await resp.text();
  return { ok: resp.ok, status: resp.status, body: text };
}

async function main() {
  console.log('🚀 SHF Database Migration v3\n');

  const fullSQL = fs.readFileSync('./schema.sql', 'utf8');

  // Try via supabase-js with raw query (using REST API)
  // Split SQL into individual statements
  const statements = fullSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Total statements: ${statements.length}`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i] + ';';

    // Skip comment-only lines
    if (stmt.trim().replace(/;$/, '').trim().length === 0) continue;

    const result = await execSQL(stmt);

    if (result.ok) {
      success++;
      process.stdout.write('.');
    } else {
      failed++;
      const preview = stmt.substring(0, 60).replace(/\n/g, ' ');
      console.error(`\n❌ [${i + 1}] ${preview}...`);
      console.error(`   Status: ${result.status}`);
      try {
        const parsed = JSON.parse(result.body);
        console.error(`   Error: ${parsed.message || parsed.error || result.body}`);
      } catch {
        console.error(`   Body: ${result.body.substring(0, 200)}`);
      }
    }
  }

  console.log(`\n\nSelesai: ${success} sukses, ${failed} gagal`);
}

main().catch(console.error);
