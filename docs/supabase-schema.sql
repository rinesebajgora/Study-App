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
  next_review_at timestamptz,
  interval_days numeric not null default 0,
  ease_factor numeric not null default 2.5,
  created_at timestamptz not null default now()
);

alter table public.flashcards
add column if not exists review_count integer not null default 0;

alter table public.flashcards
add column if not exists reviewed_at timestamptz;

alter table public.flashcards
add column if not exists next_review_at timestamptz;

alter table public.flashcards
add column if not exists interval_days numeric not null default 0;

alter table public.flashcards
add column if not exists ease_factor numeric not null default 2.5;

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

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null default 'General',
  title text not null,
  source_type text not null check (source_type in ('note', 'subject', 'material')),
  questions jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  score integer not null check (score between 0 and 100),
  correct_answers integer not null check (correct_answers >= 0),
  total_questions integer not null check (total_questions > 0),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  completed_at timestamptz not null default now()
);

create table if not exists public.quiz_attempt_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id text not null,
  question_text text not null,
  question_type text not null check (question_type in ('multiple_choice', 'true_false', 'open')),
  topic text not null default 'General',
  selected_answer text not null,
  correct_answer text not null,
  is_correct boolean not null,
  created_at timestamptz not null default now()
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
alter table public.quizzes enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_attempt_answers enable row level security;

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

drop policy if exists "Users can read their quizzes" on public.quizzes;
create policy "Users can read their quizzes" on public.quizzes for select using (auth.uid() = user_id);
drop policy if exists "Users can insert their quizzes" on public.quizzes;
create policy "Users can insert their quizzes" on public.quizzes for insert with check (auth.uid() = user_id);
drop policy if exists "Users can delete their quizzes" on public.quizzes;
create policy "Users can delete their quizzes" on public.quizzes for delete using (auth.uid() = user_id);

drop policy if exists "Users can read their quiz attempts" on public.quiz_attempts;
create policy "Users can read their quiz attempts" on public.quiz_attempts for select using (auth.uid() = user_id);
drop policy if exists "Users can insert their quiz attempts" on public.quiz_attempts;
create policy "Users can insert their quiz attempts" on public.quiz_attempts for insert with check (auth.uid() = user_id);

drop policy if exists "Users can read their quiz answers" on public.quiz_attempt_answers;
create policy "Users can read their quiz answers" on public.quiz_attempt_answers for select using (auth.uid() = user_id);
drop policy if exists "Users can insert their quiz answers" on public.quiz_attempt_answers;
create policy "Users can insert their quiz answers" on public.quiz_attempt_answers for insert with check (auth.uid() = user_id);

create index if not exists questions_user_created_idx on public.questions(user_id, created_at desc);
create index if not exists subjects_user_name_idx on public.subjects(user_id, name);
create index if not exists pinned_questions_user_created_idx on public.pinned_questions(user_id, created_at desc);
create index if not exists revision_summaries_user_question_idx on public.revision_summaries(user_id, question_id);
create index if not exists flashcards_user_created_idx on public.flashcards(user_id, created_at desc);
create index if not exists flashcards_user_question_idx on public.flashcards(user_id, question_id);
create index if not exists flashcards_user_subject_idx on public.flashcards(user_id, subject);
create index if not exists flashcards_user_next_review_idx on public.flashcards(user_id, next_review_at);
create index if not exists exam_plans_user_exam_date_idx on public.exam_plans(user_id, exam_date);
create index if not exists quizzes_user_created_idx on public.quizzes(user_id, created_at desc);
create index if not exists quiz_attempts_user_completed_idx on public.quiz_attempts(user_id, completed_at desc);
create index if not exists quiz_answers_user_topic_idx on public.quiz_attempt_answers(user_id, topic);
