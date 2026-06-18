-- ================================================================
-- DuoMity Geek Edition — Schema Supabase
-- Correr en SQL Editor del mismo proyecto que la Cuponera y la Penca
-- (usa el mismo auth.users → login compartido con Google)
-- ================================================================

-- Progreso por universo por usuario
create table if not exists duomity_progress (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  universe_id     text not null,
  correct_total   int default 0,
  sessions_played int default 0,
  perfect_rounds  int default 0,
  duel_wins       int default 0,
  xp              int default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique(user_id, universe_id)
);

-- Logros desbloqueados
create table if not exists duomity_achievements (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  achievement_id  text not null,
  unlocked_at     timestamptz default now(),
  unique(user_id, achievement_id)
);

-- Historial de partidas (para estadísticas futuras)
create table if not exists duomity_sessions (
  id              uuid primary key default gen_random_uuid(),
  player1_id      uuid references auth.users(id),
  player1_name    text,
  player2_name    text,
  universe_id     text,
  mode            text,
  score_p1        int default 0,
  score_p2        int default 0,
  xp_earned_p1    int default 0,
  winner          text,  -- 'p1' | 'p2' | 'draw'
  created_at      timestamptz default now()
);

-- RLS: cada usuario solo ve sus propios datos
alter table duomity_progress     enable row level security;
alter table duomity_achievements enable row level security;
alter table duomity_sessions     enable row level security;

create policy "Own progress" on duomity_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Own achievements" on duomity_achievements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Own sessions" on duomity_sessions
  for all using (auth.uid() = player1_id) with check (auth.uid() = player1_id);

-- Leaderboard (lectura pública — view con datos anónimos)
create or replace view duomity_leaderboard as
  select
    u.id,
    u.raw_user_meta_data->>'full_name' as display_name,
    sum(p.correct_total) as total_correct,
    sum(p.xp)            as total_xp,
    sum(p.sessions_played) as total_sessions,
    count(distinct p.universe_id) as universes_played
  from auth.users u
  join duomity_progress p on p.user_id = u.id
  group by u.id, u.raw_user_meta_data
  order by total_xp desc;

-- ================================================================
-- INSTRUCCIONES POST-INSTALACIÓN
-- 1. Correr este SQL en Supabase → SQL Editor
-- 2. Asegurarse que Google Auth esté habilitado en Authentication → Providers
-- 3. Agregar la URL del proyecto (ej: https://duomity.vercel.app) en
--    Authentication → URL Configuration → Redirect URLs
-- 4. Completar .env.local con NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
-- ================================================================

-- ================================================================
-- Tabla para requests de universos nuevos
-- ================================================================
create table if not exists duomity_universe_requests (
  id          uuid primary key default gen_random_uuid(),
  universe    text not null,
  message     text,
  votes       int default 1,
  user_id     uuid references auth.users(id) on delete set null,
  user_name   text,
  created_at  timestamptz default now()
);

alter table duomity_universe_requests enable row level security;

-- Cualquier usuario logueado puede insertar
create policy "Insert own request" on duomity_universe_requests
  for insert with check (auth.uid() = user_id);

-- Lectura pública (para mostrar el ranking de requests)
create policy "Read all requests" on duomity_universe_requests
  for select using (true);

-- ================================================================
-- MODO SALA — partidas asincrónicas con QR
-- ================================================================

create table if not exists duomity_rooms (
  id           uuid primary key default gen_random_uuid(),
  code         text unique not null,          -- ej: "DSB4J2"
  universe_id  text not null,
  universe_name text,
  universe_icon text,
  questions    jsonb not null,                -- [{q,o,a,exp}]
  created_by   uuid references auth.users(id) on delete set null,
  creator_name text,
  expires_at   timestamptz default now() + interval '7 days',
  created_at   timestamptz default now()
);

create table if not exists duomity_room_results (
  id           uuid primary key default gen_random_uuid(),
  room_id      uuid references duomity_rooms(id) on delete cascade,
  player_name  text not null,
  user_id      uuid references auth.users(id) on delete set null,
  score        int not null,
  total        int not null,
  time_seconds int,
  created_at   timestamptz default now()
);

alter table duomity_rooms        enable row level security;
alter table duomity_room_results enable row level security;

-- Cualquiera puede leer salas (para jugarlas)
create policy "Read rooms" on duomity_rooms for select using (true);
-- Solo usuarios autenticados crean salas
create policy "Create rooms" on duomity_rooms for insert
  with check (auth.uid() = created_by);

-- Cualquiera puede insertar resultados (incluso sin cuenta)
create policy "Insert results" on duomity_room_results for insert
  with check (true);
-- Cualquiera puede leer resultados de una sala
create policy "Read results" on duomity_room_results for select using (true);
