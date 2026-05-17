-- StudyAI Supabase schema
-- Run this file in the Supabase SQL editor.

create extension if not exists "pgcrypto";

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question text not null,
  answer text not null,
  subject text not null default 'General',
  created_at timestamptz not null default now()
);

create table if not exists public.pinned_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, question_id)
);

create table if not exists public.revision_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  summary text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, question_id)
);

create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid references public.questions(id) on delete cascade,
  subject text not null default 'General',
  front text not null,
  back text not null,
  review_count integer not null default 0,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.flashcards
add column if not exists review_count integer not null default 0;

alter table public.flashcards
add column if not exists reviewed_at timestamptz;

create table if not exists public.exam_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  exam_date date not null,
  goal text,
  plan text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists revision_summaries_set_updated_at on public.revision_summaries;
create trigger revision_summaries_set_updated_at
before update on public.revision_summaries
for each row execute function public.set_updated_at();

drop trigger if exists exam_plans_set_updated_at on public.exam_plans;
create trigger exam_plans_set_updated_at
before update on public.exam_plans
for each row execute function public.set_updated_at();

alter table public.questions enable row level security;
alter table public.subjects enable row level security;
alter table public.pinned_questions enable row level security;
alter table public.revision_summaries enable row level security;
alter table public.flashcards enable row level security;
alter table public.exam_plans enable row level security;

drop policy if exists "Users can read their subjects" on public.subjects;
create policy "Users can read their subjects"
on public.subjects for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their subjects" on public.subjects;
create policy "Users can insert their subjects"
on public.subjects for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their subjects" on public.subjects;
create policy "Users can update their subjects"
on public.subjects for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their subjects" on public.subjects;
create policy "Users can delete their subjects"
on public.subjects for delete
using (auth.uid() = user_id);

drop policy if exists "Users can read their questions" on public.questions;
create policy "Users can read their questions"
on public.questions for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their questions" on public.questions;
create policy "Users can insert their questions"
on public.questions for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their questions" on public.questions;
create policy "Users can update their questions"
on public.questions for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their questions" on public.questions;
create policy "Users can delete their questions"
on public.questions for delete
using (auth.uid() = user_id);

drop policy if exists "Users can read their pinned questions" on public.pinned_questions;
create policy "Users can read their pinned questions"
on public.pinned_questions for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their pinned questions" on public.pinned_questions;
create policy "Users can insert their pinned questions"
on public.pinned_questions for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their pinned questions" on public.pinned_questions;
create policy "Users can delete their pinned questions"
on public.pinned_questions for delete
using (auth.uid() = user_id);

drop policy if exists "Users can read their revision summaries" on public.revision_summaries;
create policy "Users can read their revision summaries"
on public.revision_summaries for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their revision summaries" on public.revision_summaries;
create policy "Users can insert their revision summaries"
on public.revision_summaries for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their revision summaries" on public.revision_summaries;
create policy "Users can update their revision summaries"
on public.revision_summaries for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their revision summaries" on public.revision_summaries;
create policy "Users can delete their revision summaries"
on public.revision_summaries for delete
using (auth.uid() = user_id);

drop policy if exists "Users can read their flashcards" on public.flashcards;
create policy "Users can read their flashcards"
on public.flashcards for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their flashcards" on public.flashcards;
create policy "Users can insert their flashcards"
on public.flashcards for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their flashcards" on public.flashcards;
create policy "Users can update their flashcards"
on public.flashcards for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their flashcards" on public.flashcards;
create policy "Users can delete their flashcards"
on public.flashcards for delete
using (auth.uid() = user_id);

drop policy if exists "Users can read their exam plans" on public.exam_plans;
create policy "Users can read their exam plans"
on public.exam_plans for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their exam plans" on public.exam_plans;
create policy "Users can insert their exam plans"
on public.exam_plans for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their exam plans" on public.exam_plans;
create policy "Users can update their exam plans"
on public.exam_plans for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their exam plans" on public.exam_plans;
create policy "Users can delete their exam plans"
on public.exam_plans for delete
using (auth.uid() = user_id);

create index if not exists questions_user_created_idx on public.questions(user_id, created_at desc);
create index if not exists subjects_user_name_idx on public.subjects(user_id, name);
create index if not exists pinned_questions_user_created_idx on public.pinned_questions(user_id, created_at desc);
create index if not exists revision_summaries_user_question_idx on public.revision_summaries(user_id, question_id);
create index if not exists flashcards_user_created_idx on public.flashcards(user_id, created_at desc);
create index if not exists flashcards_user_question_idx on public.flashcards(user_id, question_id);
create index if not exists flashcards_user_subject_idx on public.flashcards(user_id, subject);
create index if not exists exam_plans_user_exam_date_idx on public.exam_plans(user_id, exam_date);
