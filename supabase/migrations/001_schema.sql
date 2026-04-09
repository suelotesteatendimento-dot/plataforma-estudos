-- ============================================================
-- Estudo+ — Migração inicial para Supabase Postgres
-- Execute no SQL Editor do Supabase (dashboard.supabase.com)
-- ============================================================

-- ── 1. Tabela profiles ──────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null,
  email      text not null,
  role       text not null default 'user',
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ── 2. Tabela invite_codes ───────────────────────────────────
create table if not exists public.invite_codes (
  id          text primary key default gen_random_uuid()::text,
  code        text unique not null,
  created_by  uuid not null references auth.users(id) on delete cascade,
  used_by     uuid references auth.users(id) on delete set null,
  is_used     boolean not null default false,
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);

-- ── 3. Tabelas do app (gerenciadas pelo Prisma via connection string) ──
-- O Prisma criará as tabelas abaixo automaticamente via `prisma db push`.
-- Elas são: StudyPlan, Exercise, ExerciseAttempt, DailyScore,
-- ExamSession, ExamAnswer, UserStats, ReviewLog, InviteCode.
-- Após rodar prisma db push, volte aqui e execute os blocos abaixo.

-- ── 4. Habilitar RLS ────────────────────────────────────────
alter table public.profiles         enable row level security;
alter table public.invite_codes     enable row level security;

-- Tabelas Prisma (execute após prisma db push):
alter table public."StudyPlan"      enable row level security;
alter table public."Exercise"       enable row level security;
alter table public."ExerciseAttempt" enable row level security;
alter table public."DailyScore"     enable row level security;
alter table public."ExamSession"    enable row level security;
alter table public."ExamAnswer"     enable row level security;
alter table public."UserStats"      enable row level security;
alter table public."ReviewLog"      enable row level security;
alter table public."InviteCode"     enable row level security;

-- ── 5. Políticas RLS — profiles ─────────────────────────────
create policy "profiles: leitura própria"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: edição própria"
  on public.profiles for update
  using (auth.uid() = id);

-- ── 6. Políticas RLS — invite_codes ─────────────────────────
create policy "invites: leitura dos próprios"
  on public.invite_codes for select
  using (auth.uid() = created_by);

create policy "invites: criação autenticada"
  on public.invite_codes for insert
  with check (auth.uid() = created_by);

create policy "invites: marcar como usado (service role)"
  on public.invite_codes for update
  using (true);  -- controlado via service role no backend

-- ── 7. Políticas RLS — tabelas Prisma ───────────────────────
-- StudyPlan
create policy "studyplan: próprio usuário"
  on public."StudyPlan" for all
  using (auth.uid()::text = "userId")
  with check (auth.uid()::text = "userId");

-- Exercise
create policy "exercise: próprio usuário"
  on public."Exercise" for all
  using (auth.uid()::text = "userId")
  with check (auth.uid()::text = "userId");

-- ExerciseAttempt
create policy "attempt: próprio usuário"
  on public."ExerciseAttempt" for all
  using (auth.uid()::text = "userId")
  with check (auth.uid()::text = "userId");

-- DailyScore
create policy "dailyscore: próprio usuário"
  on public."DailyScore" for all
  using (auth.uid()::text = "userId")
  with check (auth.uid()::text = "userId");

-- ExamSession
create policy "examsession: próprio usuário"
  on public."ExamSession" for all
  using (auth.uid()::text = "userId")
  with check (auth.uid()::text = "userId");

-- ExamAnswer (acesso via ExamSession do usuário)
create policy "examanswer: via session do usuário"
  on public."ExamAnswer" for all
  using (
    exists (
      select 1 from public."ExamSession" s
      where s.id = "examSessionId"
      and s."userId" = auth.uid()::text
    )
  );

-- UserStats
create policy "userstats: próprio usuário"
  on public."UserStats" for all
  using (auth.uid()::text = "userId")
  with check (auth.uid()::text = "userId");

-- ReviewLog
create policy "reviewlog: próprio usuário"
  on public."ReviewLog" for all
  using (auth.uid()::text = "userId")
  with check (auth.uid()::text = "userId");

-- InviteCode (gerenciado pelo Prisma, acesso via service role no backend)
create policy "invitecode: service role"
  on public."InviteCode" for all
  using (true);

-- ── 8. Trigger: criar profile automaticamente ao registrar ──
-- (Opcional — o backend já cria via API, mas serve como fallback)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 9. Seed: primeiro usuário admin (execute manualmente) ────
-- Para criar o primeiro usuário sem convite:
-- 1. Crie manualmente via Supabase Dashboard → Authentication → Users
-- 2. Depois gere um convite via /configuracoes/convites para convidar outros
--
-- OU insira um convite inicial diretamente:
-- INSERT INTO public."InviteCode" (id, code, "createdById", "isUsed", "createdAt")
-- VALUES (gen_random_uuid()::text, 'ADMIN-0000-0001', '<uuid-do-admin>', false, now());
