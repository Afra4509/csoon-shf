-- ============================================================
-- SHF — SMADA Hadrah Festival
-- SQL Migration v3: Official Scoring Form System
-- Jalankan di Supabase > SQL Editor
-- CATATAN: Ini menggantikan schema lama sepenuhnya
-- Tanggal Event: 6 September 2026
-- ============================================================

-- ============================================================
-- CLEANUP (hapus semua tabel lama)
-- ============================================================
drop table if exists public.judge_notes    cascade;
drop table if exists public.scores         cascade;
drop table if exists public.final_scores   cascade;
drop table if exists public.scoring_criteria cascade;
drop table if exists public.scoring_fields cascade;
drop table if exists public.judges         cascade;
drop table if exists public.participants   cascade;
drop table if exists public.event_settings cascade;

-- ============================================================
-- 1. Event Settings (global config)
-- ============================================================
create table public.event_settings (
  id                    integer primary key default 1,
  event_name            text    default 'SMADA Hadrah Festival 2026',
  event_date            date    default '2026-09-06',
  scoring_finalized     boolean default false,
  ranking_published     boolean default false,
  show_judge_notes      boolean default false,  -- apakah peserta bisa lihat catatan juri
  finalized_at          timestamptz,
  published_at          timestamptz,
  updated_at            timestamptz default now(),
  constraint single_row check (id = 1)
);

insert into public.event_settings (id) values (1)
  on conflict (id) do nothing;

alter table public.event_settings enable row level security;

create policy "Semua bisa baca event settings"
  on public.event_settings for select
  using (true);

create policy "Admin kelola event settings"
  on public.event_settings for all
  using (true)
  with check (true);

-- ============================================================
-- 2. Tabel Peserta
-- ============================================================
create table public.participants (
  id            uuid references auth.users(id) on delete cascade primary key,
  username      text unique not null,
  group_name    text not null,
  school_name   text,
  no_urut       integer,
  kategori      text check (kategori in ('sd', 'smp')) not null,
  tingkat_pelajar text,  -- contoh: "SD/MI", "SMP/MTs"
  status        text check (status in ('menunggu', 'tampil', 'selesai')) default 'menunggu',
  created_at    timestamptz default now()
);

alter table public.participants enable row level security;

create policy "Peserta baca data sendiri"
  on public.participants for select
  using (auth.uid() = id);

create policy "Admin/service kelola semua peserta"
  on public.participants for all
  using (true)
  with check (true);

-- ============================================================
-- 3. Tabel Juri
-- ============================================================
create table public.judges (
  id           uuid references auth.users(id) on delete cascade primary key,
  username     text unique not null,
  full_name    text not null,
  bidang       text check (bidang in ('adab', 'vokal', 'banjari', 'jingle', null)),
  is_active    boolean default true,
  created_at   timestamptz default now()
);

alter table public.judges enable row level security;

create policy "Juri baca data sendiri"
  on public.judges for select
  using (auth.uid() = id);

create policy "Admin kelola semua juri"
  on public.judges for all
  using (true)
  with check (true);

create policy "Authenticated bisa baca semua juri"
  on public.judges for select
  to authenticated
  using (true);

-- ============================================================
-- 4. Bidang Penilaian (Master)
-- ============================================================
-- adab: Adab dan Syair (maks 30)
-- vokal: Bidang Suara/Vokal (maks 40)
-- banjari: Musik Banjari (maks 30)
-- jingle: Jingle (terpisah, bobot TBD)
-- ============================================================
create table public.scoring_fields (
  id            text primary key,  -- 'adab', 'vokal', 'banjari', 'jingle'
  label         text not null,
  max_score     numeric(5,2) not null default 30,
  is_main       boolean default true,  -- false untuk Jingle (terpisah dari ranking utama)
  is_active     boolean default true,
  sort_order    integer default 0,
  judge_bidang  text,  -- bidang juri yang bertanggung jawab
  created_at    timestamptz default now()
);

alter table public.scoring_fields enable row level security;

create policy "Semua bisa baca bidang penilaian"
  on public.scoring_fields for select
  using (true);

create policy "Admin kelola bidang penilaian"
  on public.scoring_fields for all
  using (true)
  with check (true);

-- Insert master bidang
insert into public.scoring_fields (id, label, max_score, is_main, sort_order, judge_bidang) values
  ('adab',    'Adab dan Syair',     30, true,  1, 'adab'),
  ('vokal',   'Bidang Suara/Vokal', 40, true,  2, 'vokal'),
  ('banjari', 'Musik Banjari',      30, true,  3, 'banjari'),
  ('jingle',  'Jingle',             30, false, 4, 'jingle');

-- ============================================================
-- 5. Kriteria Penilaian (Master per Bidang)
-- ============================================================
create table public.scoring_criteria (
  id            uuid default gen_random_uuid() primary key,
  field_id      text references public.scoring_fields(id) on delete cascade not null,
  label         text not null,
  sort_order    integer default 0,
  is_active     boolean default true,
  created_at    timestamptz default now()
);

alter table public.scoring_criteria enable row level security;

create policy "Semua bisa baca kriteria"
  on public.scoring_criteria for select
  using (true);

create policy "Admin kelola kriteria"
  on public.scoring_criteria for all
  using (true)
  with check (true);

-- Insert kriteria Adab dan Syair
insert into public.scoring_criteria (field_id, label, sort_order) values
  ('adab', 'Murottil Kalimat',         1),
  ('adab', 'Ekspresi dan Penghayatan', 2),
  ('adab', 'Kerapian Busana',          3),
  ('adab', 'Ketepatan Waktu',          4);

-- Insert kriteria Vokal
insert into public.scoring_criteria (field_id, label, sort_order) values
  ('vokal', 'Keutuhan Suara',                     1),
  ('vokal', 'Pengaturan Nafas',                   2),
  ('vokal', 'Keindahan Suara',                    3),
  ('vokal', 'Kesesuaian Vocal dan Backing Vocal', 4);

-- Insert kriteria Musik Banjari
insert into public.scoring_criteria (field_id, label, sort_order) values
  ('banjari', 'Irama Dasar Al Banjari',                       1),
  ('banjari', 'Keserasian dan Variasi Pukulan Al Banjari',    2),
  ('banjari', 'Improvisasi atau Kreasi',                      3);

-- Insert kriteria Jingle
insert into public.scoring_criteria (field_id, label, sort_order) values
  ('jingle', 'Original',    1),
  ('jingle', 'Keutuhan',    2),
  ('jingle', 'Kreatifitas', 3),
  ('jingle', 'Kekompakan',  4);

-- ============================================================
-- 6. Tabel Scores (nilai per peserta per juri per kriteria)
-- ============================================================
-- Setiap baris = satu kriteria dari satu juri untuk satu peserta
-- JALI dan KHAFI adalah nilai terpisah (keduanya positif)
-- subtotal = (nilai_jali + nilai_khafi) / 2
-- ============================================================
create table public.scores (
  id              uuid default gen_random_uuid() primary key,
  participant_id  uuid references public.participants(id) on delete cascade not null,
  judge_id        uuid references public.judges(id) on delete cascade not null,
  field_id        text references public.scoring_fields(id) on delete cascade not null,
  criteria_id     uuid references public.scoring_criteria(id) on delete cascade not null,

  nilai_jali      numeric(5,2) check (nilai_jali  between 0 and 100),
  nilai_khafi     numeric(5,2) check (nilai_khafi between 0 and 100),
  subtotal        numeric(5,2),  -- (jali + khafi) / 2, dihitung otomatis

  dinilai_pada    timestamptz default now(),
  updated_at      timestamptz default now(),

  -- Satu juri hanya bisa input 1 nilai per kriteria per peserta
  unique (participant_id, judge_id, criteria_id)
);

alter table public.scores enable row level security;

create policy "Peserta baca nilai sendiri"
  on public.scores for select
  using (participant_id = auth.uid());

create policy "Juri baca semua nilai"
  on public.scores for select
  to authenticated
  using (true);

create policy "Juri input nilai sendiri"
  on public.scores for insert
  to authenticated
  with check (judge_id = auth.uid());

create policy "Juri update nilai sendiri"
  on public.scores for update
  to authenticated
  using (judge_id = auth.uid())
  with check (judge_id = auth.uid());

create policy "Admin kelola semua nilai"
  on public.scores for all
  using (true)
  with check (true);

-- ============================================================
-- 7. Catatan Juri (per peserta per bidang)
-- ============================================================
create table public.judge_notes (
  id              uuid default gen_random_uuid() primary key,
  participant_id  uuid references public.participants(id) on delete cascade not null,
  judge_id        uuid references public.judges(id) on delete cascade not null,
  field_id        text references public.scoring_fields(id) on delete cascade not null,
  catatan         text,
  pengurangan     numeric(5,2) default 0,  -- pengurangan nilai (komponen terpisah dari JALI/KHAFI)
  is_published    boolean default false,   -- apakah catatan boleh dilihat peserta
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),

  unique (participant_id, judge_id, field_id)
);

alter table public.judge_notes enable row level security;

-- Peserta hanya bisa baca catatan yang sudah dipublish
create policy "Peserta baca catatan sendiri jika published"
  on public.judge_notes for select
  using (participant_id = auth.uid() and is_published = true);

create policy "Juri baca catatan sendiri"
  on public.judge_notes for select
  to authenticated
  using (judge_id = auth.uid());

create policy "Juri kelola catatan sendiri"
  on public.judge_notes for insert
  to authenticated
  with check (judge_id = auth.uid());

create policy "Juri update catatan sendiri"
  on public.judge_notes for update
  to authenticated
  using (judge_id = auth.uid())
  with check (judge_id = auth.uid());

create policy "Admin kelola semua catatan"
  on public.judge_notes for all
  using (true)
  with check (true);

-- ============================================================
-- 8. Final Scores (nilai akhir per peserta)
-- ============================================================
-- Dihitung dari: Adab + Vokal + Banjari = Nilai Utama (maks 100)
-- Jingle disimpan terpisah
-- Ranking menggunakan nilai_utama, tie-breaker: nilai_vokal
-- ============================================================
create table public.final_scores (
  participant_id    uuid references public.participants(id) on delete cascade primary key,

  -- Nilai per bidang (setelah pengurangan)
  nilai_adab        numeric(5,2),  -- maks 30
  nilai_vokal       numeric(5,2),  -- maks 40
  nilai_banjari     numeric(5,2),  -- maks 30
  nilai_jingle      numeric(5,2),  -- terpisah

  -- Nilai sebelum pengurangan per bidang
  raw_adab          numeric(5,2),
  raw_vokal         numeric(5,2),
  raw_banjari       numeric(5,2),
  raw_jingle        numeric(5,2),

  -- Pengurangan per bidang
  pengurangan_adab    numeric(5,2) default 0,
  pengurangan_vokal   numeric(5,2) default 0,
  pengurangan_banjari numeric(5,2) default 0,
  pengurangan_jingle  numeric(5,2) default 0,

  -- Total utama (Adab + Vokal + Banjari, maks 100)
  nilai_utama       numeric(5,2),

  -- Status kelengkapan penilaian
  adab_done         boolean default false,
  vokal_done        boolean default false,
  banjari_done      boolean default false,
  jingle_done       boolean default false,
  is_complete       boolean default false,  -- semua bidang utama selesai

  -- Status seri
  is_tied           boolean default false,

  -- Metadata
  calculated_at     timestamptz default now(),
  updated_at        timestamptz default now()
);

alter table public.final_scores enable row level security;

create policy "Peserta baca final score sendiri"
  on public.final_scores for select
  using (participant_id = auth.uid());

create policy "Semua bisa baca final score jika published"
  on public.final_scores for select
  using (true);

create policy "Admin kelola final scores"
  on public.final_scores for all
  using (true)
  with check (true);

-- ============================================================
-- 9. Indexes untuk performa
-- ============================================================
create index if not exists idx_scores_participant on public.scores(participant_id);
create index if not exists idx_scores_judge       on public.scores(judge_id);
create index if not exists idx_scores_field       on public.scores(field_id);
create index if not exists idx_scores_criteria    on public.scores(criteria_id);
create index if not exists idx_judge_notes_participant on public.judge_notes(participant_id);
create index if not exists idx_judge_notes_field  on public.judge_notes(field_id);

-- ============================================================
-- 10. Aktifkan Realtime
-- ============================================================
begin;
  alter publication supabase_realtime add table public.scores;
  alter publication supabase_realtime add table public.judge_notes;
  alter publication supabase_realtime add table public.final_scores;
  alter publication supabase_realtime add table public.event_settings;
commit;

-- ============================================================
-- CATATAN:
-- - Tanggal event: 6 September 2026
-- - Nilai utama maks 100 (Adab 30 + Vokal 40 + Banjari 30)
-- - Jingle terpisah, bobot configurable
-- - Juri Jingle: TBD (admin dapat update via AdminPanel)
-- - Tie-breaker: nilai_vokal DESC, jika sama → SERI
-- ============================================================
