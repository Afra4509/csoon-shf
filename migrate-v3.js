// migrate-v3.js — Jalankan via: node migrate-v3.js
// Gunakan Supabase Management API dengan personal access token

const SUPABASE_URL = 'https://api.supabase.com';
const PROJECT_REF = 'dzmqdzdjxeloaggrxtwm';
const PAT = process.env.SUPABASE_PAT || ''; // personal access token

async function sql(query) {
  const resp = await fetch(`${SUPABASE_URL}/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PAT}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  const body = await resp.json().catch(() => resp.text());
  return { ok: resp.ok, status: resp.status, body };
}

async function run(label, query) {
  const r = await sql(query);
  if (r.ok) {
    console.log(`✅ ${label}`);
  } else {
    const msg = typeof r.body === 'object' ? JSON.stringify(r.body) : r.body;
    console.error(`❌ ${label}\n   ${msg}`);
  }
}

async function main() {
  console.log('🚀 SHF Database Migration v3 — 6 September 2026\n');

  // === CLEANUP ===
  await run('Drop judge_notes',     'drop table if exists public.judge_notes cascade');
  await run('Drop scores',          'drop table if exists public.scores cascade');
  await run('Drop final_scores',    'drop table if exists public.final_scores cascade');
  await run('Drop scoring_criteria','drop table if exists public.scoring_criteria cascade');
  await run('Drop scoring_fields',  'drop table if exists public.scoring_fields cascade');
  await run('Drop judges',          'drop table if exists public.judges cascade');
  await run('Drop participants',    'drop table if exists public.participants cascade');
  await run('Drop event_settings',  'drop table if exists public.event_settings cascade');

  // === EVENT SETTINGS ===
  await run('Create event_settings', `
    create table public.event_settings (
      id                integer primary key default 1,
      event_name        text    default 'SMADA Hadrah Festival 2026',
      event_date        date    default '2026-09-06',
      scoring_finalized boolean default false,
      ranking_published boolean default false,
      show_judge_notes  boolean default false,
      finalized_at      timestamptz,
      published_at      timestamptz,
      updated_at        timestamptz default now(),
      constraint single_row check (id = 1)
    )
  `);
  await run('Insert event_settings default', `insert into public.event_settings (id) values (1) on conflict (id) do nothing`);
  await run('RLS event_settings', `alter table public.event_settings enable row level security`);
  await run('Policy: baca settings', `create policy "Semua bisa baca event settings" on public.event_settings for select using (true)`);
  await run('Policy: admin settings', `create policy "Admin kelola event settings" on public.event_settings for all using (true) with check (true)`);

  // === PARTICIPANTS ===
  await run('Create participants', `
    create table public.participants (
      id              uuid references auth.users(id) on delete cascade primary key,
      username        text unique not null,
      group_name      text not null,
      school_name     text,
      no_urut         integer,
      kategori        text check (kategori in ('sd', 'smp')) not null,
      tingkat_pelajar text,
      status          text check (status in ('menunggu', 'tampil', 'selesai')) default 'menunggu',
      created_at      timestamptz default now()
    )
  `);
  await run('RLS participants', `alter table public.participants enable row level security`);
  await run('Policy: peserta baca diri', `create policy "Peserta baca data sendiri" on public.participants for select using (auth.uid() = id)`);
  await run('Policy: admin peserta', `create policy "Admin kelola semua peserta" on public.participants for all using (true) with check (true)`);

  // === JUDGES ===
  await run('Create judges', `
    create table public.judges (
      id         uuid references auth.users(id) on delete cascade primary key,
      username   text unique not null,
      full_name  text not null,
      bidang     text,
      is_active  boolean default true,
      created_at timestamptz default now()
    )
  `);
  await run('RLS judges', `alter table public.judges enable row level security`);
  await run('Policy: juri baca diri', `create policy "Juri baca data sendiri" on public.judges for select using (auth.uid() = id)`);
  await run('Policy: admin juri', `create policy "Admin kelola semua juri" on public.judges for all using (true) with check (true)`);
  await run('Policy: auth baca juri', `create policy "Auth baca semua juri" on public.judges for select to authenticated using (true)`);

  // === SCORING FIELDS ===
  await run('Create scoring_fields', `
    create table public.scoring_fields (
      id          text primary key,
      label       text not null,
      max_score   numeric(5,2) not null default 30,
      is_main     boolean default true,
      is_active   boolean default true,
      sort_order  integer default 0,
      judge_bidang text,
      created_at  timestamptz default now()
    )
  `);
  await run('RLS scoring_fields', `alter table public.scoring_fields enable row level security`);
  await run('Policy: baca fields', `create policy "Semua bisa baca bidang" on public.scoring_fields for select using (true)`);
  await run('Policy: admin fields', `create policy "Admin kelola bidang" on public.scoring_fields for all using (true) with check (true)`);
  await run('Insert scoring_fields', `
    insert into public.scoring_fields (id, label, max_score, is_main, sort_order, judge_bidang) values
      ('adab',    'Adab dan Syair',      30, true,  1, 'adab'),
      ('vokal',   'Bidang Suara/Vokal',  40, true,  2, 'vokal'),
      ('banjari', 'Musik Banjari',       30, true,  3, 'banjari'),
      ('jingle',  'Jingle',             30, false, 4, 'jingle')
  `);

  // === SCORING CRITERIA ===
  await run('Create scoring_criteria', `
    create table public.scoring_criteria (
      id         uuid default gen_random_uuid() primary key,
      field_id   text references public.scoring_fields(id) on delete cascade not null,
      label      text not null,
      sort_order integer default 0,
      is_active  boolean default true,
      created_at timestamptz default now()
    )
  `);
  await run('RLS scoring_criteria', `alter table public.scoring_criteria enable row level security`);
  await run('Policy: baca kriteria', `create policy "Semua bisa baca kriteria" on public.scoring_criteria for select using (true)`);
  await run('Policy: admin kriteria', `create policy "Admin kelola kriteria" on public.scoring_criteria for all using (true) with check (true)`);
  await run('Insert kriteria Adab', `
    insert into public.scoring_criteria (field_id, label, sort_order) values
      ('adab', 'Murottil Kalimat', 1),
      ('adab', 'Ekspresi dan Penghayatan', 2),
      ('adab', 'Kerapian Busana', 3),
      ('adab', 'Ketepatan Waktu', 4)
  `);
  await run('Insert kriteria Vokal', `
    insert into public.scoring_criteria (field_id, label, sort_order) values
      ('vokal', 'Keutuhan Suara', 1),
      ('vokal', 'Pengaturan Nafas', 2),
      ('vokal', 'Keindahan Suara', 3),
      ('vokal', 'Kesesuaian Vocal dan Backing Vocal', 4)
  `);
  await run('Insert kriteria Banjari', `
    insert into public.scoring_criteria (field_id, label, sort_order) values
      ('banjari', 'Irama Dasar Al Banjari', 1),
      ('banjari', 'Keserasian dan Variasi Pukulan Al Banjari', 2),
      ('banjari', 'Improvisasi atau Kreasi', 3)
  `);
  await run('Insert kriteria Jingle', `
    insert into public.scoring_criteria (field_id, label, sort_order) values
      ('jingle', 'Original', 1),
      ('jingle', 'Keutuhan', 2),
      ('jingle', 'Kreatifitas', 3),
      ('jingle', 'Kekompakan', 4)
  `);

  // === SCORES ===
  await run('Create scores', `
    create table public.scores (
      id             uuid default gen_random_uuid() primary key,
      participant_id uuid references public.participants(id) on delete cascade not null,
      judge_id       uuid references public.judges(id) on delete cascade not null,
      field_id       text references public.scoring_fields(id) on delete cascade not null,
      criteria_id    uuid references public.scoring_criteria(id) on delete cascade not null,
      nilai_jali     numeric(5,2) check (nilai_jali  between 0 and 100),
      nilai_khafi    numeric(5,2) check (nilai_khafi between 0 and 100),
      subtotal       numeric(5,2),
      dinilai_pada   timestamptz default now(),
      updated_at     timestamptz default now(),
      unique (participant_id, judge_id, criteria_id)
    )
  `);
  await run('RLS scores', `alter table public.scores enable row level security`);
  await run('Policy: peserta baca nilai', `create policy "Peserta baca nilai sendiri" on public.scores for select using (participant_id = auth.uid())`);
  await run('Policy: juri baca nilai', `create policy "Juri baca semua nilai" on public.scores for select to authenticated using (true)`);
  await run('Policy: juri insert nilai', `create policy "Juri input nilai sendiri" on public.scores for insert to authenticated with check (judge_id = auth.uid())`);
  await run('Policy: juri update nilai', `create policy "Juri update nilai sendiri" on public.scores for update to authenticated using (judge_id = auth.uid()) with check (judge_id = auth.uid())`);
  await run('Policy: admin nilai', `create policy "Admin kelola semua nilai" on public.scores for all using (true) with check (true)`);

  // === JUDGE NOTES ===
  await run('Create judge_notes', `
    create table public.judge_notes (
      id             uuid default gen_random_uuid() primary key,
      participant_id uuid references public.participants(id) on delete cascade not null,
      judge_id       uuid references public.judges(id) on delete cascade not null,
      field_id       text references public.scoring_fields(id) on delete cascade not null,
      catatan        text,
      pengurangan    numeric(5,2) default 0,
      is_published   boolean default false,
      created_at     timestamptz default now(),
      updated_at     timestamptz default now(),
      unique (participant_id, judge_id, field_id)
    )
  `);
  await run('RLS judge_notes', `alter table public.judge_notes enable row level security`);
  await run('Policy: peserta baca catatan', `create policy "Peserta baca catatan published" on public.judge_notes for select using (participant_id = auth.uid() and is_published = true)`);
  await run('Policy: juri baca catatan', `create policy "Juri baca catatan sendiri" on public.judge_notes for select to authenticated using (judge_id = auth.uid())`);
  await run('Policy: juri insert catatan', `create policy "Juri insert catatan sendiri" on public.judge_notes for insert to authenticated with check (judge_id = auth.uid())`);
  await run('Policy: juri update catatan', `create policy "Juri update catatan sendiri" on public.judge_notes for update to authenticated using (judge_id = auth.uid()) with check (judge_id = auth.uid())`);
  await run('Policy: admin catatan', `create policy "Admin kelola semua catatan" on public.judge_notes for all using (true) with check (true)`);

  // === FINAL SCORES ===
  await run('Create final_scores', `
    create table public.final_scores (
      participant_id      uuid references public.participants(id) on delete cascade primary key,
      nilai_adab          numeric(5,2),
      nilai_vokal         numeric(5,2),
      nilai_banjari       numeric(5,2),
      nilai_jingle        numeric(5,2),
      raw_adab            numeric(5,2),
      raw_vokal           numeric(5,2),
      raw_banjari         numeric(5,2),
      raw_jingle          numeric(5,2),
      pengurangan_adab    numeric(5,2) default 0,
      pengurangan_vokal   numeric(5,2) default 0,
      pengurangan_banjari numeric(5,2) default 0,
      pengurangan_jingle  numeric(5,2) default 0,
      nilai_utama         numeric(5,2),
      adab_done           boolean default false,
      vokal_done          boolean default false,
      banjari_done        boolean default false,
      jingle_done         boolean default false,
      is_complete         boolean default false,
      is_tied             boolean default false,
      calculated_at       timestamptz default now(),
      updated_at          timestamptz default now()
    )
  `);
  await run('RLS final_scores', `alter table public.final_scores enable row level security`);
  await run('Policy: peserta baca final', `create policy "Peserta baca final score" on public.final_scores for select using (participant_id = auth.uid())`);
  await run('Policy: semua baca final', `create policy "Publik baca final score" on public.final_scores for select using (true)`);
  await run('Policy: admin final', `create policy "Admin kelola final scores" on public.final_scores for all using (true) with check (true)`);

  // === INDEXES ===
  await run('Index: scores.participant', `create index if not exists idx_scores_participant on public.scores(participant_id)`);
  await run('Index: scores.judge',       `create index if not exists idx_scores_judge on public.scores(judge_id)`);
  await run('Index: scores.field',       `create index if not exists idx_scores_field on public.scores(field_id)`);
  await run('Index: notes.participant',  `create index if not exists idx_notes_participant on public.judge_notes(participant_id)`);

  // === REALTIME ===
  await run('Realtime: scores',         `alter publication supabase_realtime add table public.scores`);
  await run('Realtime: judge_notes',    `alter publication supabase_realtime add table public.judge_notes`);
  await run('Realtime: final_scores',   `alter publication supabase_realtime add table public.final_scores`);
  await run('Realtime: event_settings', `alter publication supabase_realtime add table public.event_settings`);

  console.log('\n✨ Migrasi selesai!');
  
  // Verify
  const verify = await sql(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`);
  if (verify.ok) {
    console.log('\nTabel yang ada di database:');
    (verify.body || []).forEach(r => console.log('  -', r.table_name));
  }
}

main().catch(console.error);
