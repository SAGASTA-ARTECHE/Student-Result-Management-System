
-- SRMS Supabase schema (PostgreSQL)
-- Run this entire file in Supabase Dashboard > SQL Editor.
create extension if not exists pgcrypto;

create type public.app_role as enum ('ADMINISTRATOR','LECTURER','STUDENT');
create type public.student_status as enum ('ACTIVE','SUSPENDED','EXCLUDED','GRADUATED');
create type public.result_status as enum ('DISTINCTION','PASS','FAIL','EXCLUSION');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  email text unique not null,
  role public.app_role not null default 'STUDENT',
  status text not null default 'ACTIVE' check (status in ('ACTIVE','INACTIVE')),
  created_at timestamptz not null default now()
);

create table public.students (
  student_id text primary key,
  profile_id uuid unique references public.profiles(id) on delete set null,
  full_name text not null,
  course text not null,
  email text not null unique,
  phone_number text,
  year_of_study int not null default 1 check (year_of_study between 1 and 8),
  academic_year text not null,
  status public.student_status not null default 'ACTIVE',
  created_at timestamptz not null default now()
);

create table public.lecturers (
  lecturer_id text primary key,
  profile_id uuid unique references public.profiles(id) on delete set null,
  full_name text not null,
  email text not null unique,
  department text not null,
  office_number text,
  created_at timestamptz not null default now()
);

create table public.modules (
  module_id text primary key,
  module_code text not null unique,
  module_name text not null,
  description text not null default '',
  credits int not null default 15 check (credits > 0),
  semester text not null check (semester in ('Semester 1','Semester 2','Summer')),
  academic_year text not null,
  lecturer_id text references public.lecturers(lecturer_id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.registrations (
  registration_id uuid primary key default gen_random_uuid(),
  student_id text not null references public.students(student_id) on delete cascade,
  module_id text not null references public.modules(module_id) on delete cascade,
  academic_year text not null,
  semester text not null,
  registration_date date not null default current_date,
  unique(student_id,module_id,academic_year,semester)
);

create table public.assessment_marks (
  mark_id uuid primary key default gen_random_uuid(),
  student_id text not null references public.students(student_id) on delete cascade,
  module_id text not null references public.modules(module_id) on delete cascade,
  assessment_name text not null,
  mark numeric(5,2) not null check (mark between 0 and 100),
  assessment_weight numeric(5,2) not null check (assessment_weight > 0 and assessment_weight <= 100),
  date_captured timestamptz not null default now(),
  captured_by uuid references public.profiles(id) on delete set null
);

create table public.final_results (
  result_id uuid primary key default gen_random_uuid(),
  student_id text not null references public.students(student_id) on delete cascade,
  module_id text not null references public.modules(module_id) on delete cascade,
  final_mark numeric(5,2) not null check (final_mark between 0 and 100),
  grade text not null,
  status public.result_status not null,
  academic_year text not null,
  semester text not null,
  calculated_at timestamptz not null default now(),
  unique(student_id,module_id,academic_year,semester)
);

create table public.academic_rules (
  rule_id uuid primary key default gen_random_uuid(),
  rule_name text not null unique,
  minimum_mark numeric(5,2) not null check (minimum_mark between 0 and 100),
  maximum_mark numeric(5,2) not null check (maximum_mark between 0 and 100),
  status public.result_status not null,
  grade_letter text not null,
  description text not null default '',
  check (minimum_mark <= maximum_mark)
);

create table public.academic_rule_config (
  id boolean primary key default true check (id),
  distinction_threshold numeric(5,2) not null default 75,
  pass_threshold numeric(5,2) not null default 50,
  fail_threshold numeric(5,2) not null default 0,
  exclusion_threshold numeric(5,2) not null default 35,
  max_failed_modules_for_exclusion int not null default 3,
  coursework_default_weight numeric(5,2) not null default 20,
  midterm_default_weight numeric(5,2) not null default 30,
  final_exam_default_weight numeric(5,2) not null default 50,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);
insert into public.academic_rule_config(id) values (true) on conflict do nothing;

create table public.course_ratings (
  rating_id uuid primary key default gen_random_uuid(),
  student_id text not null references public.students(student_id) on delete cascade,
  module_id text not null references public.modules(module_id) on delete cascade,
  lecturer_id text not null references public.lecturers(lecturer_id) on delete cascade,
  is_anonymous boolean not null default false,
  teaching_score int not null check (teaching_score between 1 and 5),
  fairness_score int not null check (fairness_score between 1 and 5),
  materials_score int not null check (materials_score between 1 and 5),
  timeliness_score int not null check (timeliness_score between 1 and 5),
  overall_score numeric(3,2) not null check (overall_score between 1 and 5),
  comment text,
  academic_year text not null,
  semester text not null,
  created_at timestamptz not null default now(),
  unique(student_id,module_id,academic_year,semester)
);

create table public.audit_logs (
  audit_id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  username text not null,
  user_role public.app_role not null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  old_value jsonb,
  new_value jsonb,
  description text not null,
  created_at timestamptz not null default now()
);

create index registrations_student_idx on public.registrations(student_id);
create index registrations_module_idx on public.registrations(module_id);
create index marks_student_module_idx on public.assessment_marks(student_id,module_id);
create index results_student_idx on public.final_results(student_id);
create index audit_created_at_idx on public.audit_logs(created_at desc);

-- Helpers used by row-level security. SECURITY DEFINER avoids recursive RLS checks.
create or replace function public.current_app_role()
returns public.app_role language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.current_student_id()
returns text language sql stable security definer set search_path = public
as $$ select student_id from public.students where profile_id = auth.uid() limit 1 $$;

create or replace function public.current_lecturer_id()
returns text language sql stable security definer set search_path = public
as $$ select lecturer_id from public.lecturers where profile_id = auth.uid() limit 1 $$;

alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.lecturers enable row level security;
alter table public.modules enable row level security;
alter table public.registrations enable row level security;
alter table public.assessment_marks enable row level security;
alter table public.final_results enable row level security;
alter table public.academic_rules enable row level security;
alter table public.academic_rule_config enable row level security;
alter table public.course_ratings enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles: users can see their own profile; administrators can manage profiles.
create policy "profiles_read_self_or_admin" on public.profiles for select to authenticated
using (id = auth.uid() or public.current_app_role() = 'ADMINISTRATOR');
create policy "profiles_admin_insert" on public.profiles for insert to authenticated
with check (public.current_app_role() = 'ADMINISTRATOR' or id = auth.uid());
create policy "profiles_admin_update" on public.profiles for update to authenticated
using (public.current_app_role() = 'ADMINISTRATOR') with check (public.current_app_role() = 'ADMINISTRATOR');

-- Academic directory visibility for authenticated users; mutations are admin-only.
create policy "students_read_scope" on public.students for select to authenticated
using (public.current_app_role() = 'ADMINISTRATOR' or profile_id = auth.uid()
  or exists (select 1 from public.registrations r join public.modules m on m.module_id=r.module_id
             where r.student_id=students.student_id and m.lecturer_id=public.current_lecturer_id()));
create policy "students_admin_all" on public.students for all to authenticated
using (public.current_app_role() = 'ADMINISTRATOR') with check (public.current_app_role() = 'ADMINISTRATOR');

create policy "lecturers_read_auth" on public.lecturers for select to authenticated using (true);
create policy "lecturers_admin_all" on public.lecturers for all to authenticated
using (public.current_app_role() = 'ADMINISTRATOR') with check (public.current_app_role() = 'ADMINISTRATOR');

create policy "modules_read_auth" on public.modules for select to authenticated using (true);
create policy "modules_admin_all" on public.modules for all to authenticated
using (public.current_app_role() = 'ADMINISTRATOR') with check (public.current_app_role() = 'ADMINISTRATOR');
create policy "modules_lecturer_update_assigned" on public.modules for update to authenticated
using (lecturer_id = public.current_lecturer_id()) with check (lecturer_id = public.current_lecturer_id());

create policy "registrations_read_scope" on public.registrations for select to authenticated
using (public.current_app_role()='ADMINISTRATOR' or student_id=public.current_student_id()
 or exists(select 1 from public.modules m where m.module_id=registrations.module_id and m.lecturer_id=public.current_lecturer_id()));
create policy "registrations_admin_all" on public.registrations for all to authenticated
using (public.current_app_role()='ADMINISTRATOR') with check (public.current_app_role()='ADMINISTRATOR');
create policy "registrations_student_insert" on public.registrations for insert to authenticated
with check (student_id=public.current_student_id());

create policy "marks_read_scope" on public.assessment_marks for select to authenticated
using (public.current_app_role()='ADMINISTRATOR' or student_id=public.current_student_id()
 or exists(select 1 from public.modules m where m.module_id=assessment_marks.module_id and m.lecturer_id=public.current_lecturer_id()));
create policy "marks_lecturer_insert" on public.assessment_marks for insert to authenticated
with check (public.current_app_role()='ADMINISTRATOR' or exists(select 1 from public.modules m where m.module_id=assessment_marks.module_id and m.lecturer_id=public.current_lecturer_id()));
create policy "marks_lecturer_update" on public.assessment_marks for update to authenticated
using (public.current_app_role()='ADMINISTRATOR' or exists(select 1 from public.modules m where m.module_id=assessment_marks.module_id and m.lecturer_id=public.current_lecturer_id()))
with check (public.current_app_role()='ADMINISTRATOR' or exists(select 1 from public.modules m where m.module_id=assessment_marks.module_id and m.lecturer_id=public.current_lecturer_id()));
create policy "marks_admin_delete" on public.assessment_marks for delete to authenticated
using (public.current_app_role()='ADMINISTRATOR');

create policy "results_read_scope" on public.final_results for select to authenticated
using (public.current_app_role()='ADMINISTRATOR' or student_id=public.current_student_id()
 or exists(select 1 from public.modules m where m.module_id=final_results.module_id and m.lecturer_id=public.current_lecturer_id()));
create policy "results_admin_write" on public.final_results for all to authenticated
using (public.current_app_role()='ADMINISTRATOR') with check (public.current_app_role()='ADMINISTRATOR');

create policy "rules_read_auth" on public.academic_rules for select to authenticated using (true);
create policy "rules_admin_all" on public.academic_rules for all to authenticated
using (public.current_app_role()='ADMINISTRATOR') with check (public.current_app_role()='ADMINISTRATOR');
create policy "config_read_auth" on public.academic_rule_config for select to authenticated using (true);
create policy "config_admin_all" on public.academic_rule_config for all to authenticated
using (public.current_app_role()='ADMINISTRATOR') with check (public.current_app_role()='ADMINISTRATOR');

create policy "ratings_read_auth" on public.course_ratings for select to authenticated using (true);
create policy "ratings_student_insert" on public.course_ratings for insert to authenticated
with check (student_id=public.current_student_id());
create policy "ratings_student_update_own" on public.course_ratings for update to authenticated
using (student_id=public.current_student_id()) with check (student_id=public.current_student_id());
create policy "ratings_admin_all" on public.course_ratings for all to authenticated
using (public.current_app_role()='ADMINISTRATOR') with check (public.current_app_role()='ADMINISTRATOR');

create policy "audit_admin_read" on public.audit_logs for select to authenticated
using (public.current_app_role()='ADMINISTRATOR');
create policy "audit_authenticated_insert" on public.audit_logs for insert to authenticated
with check (actor_id=auth.uid());

-- IMPORTANT: Create the first administrator through Supabase Auth, then set role
-- manually in SQL Editor using that user's auth UUID:
-- update public.profiles set role='ADMINISTRATOR' where email='your-admin-email@example.com';
