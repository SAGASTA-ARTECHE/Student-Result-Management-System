# SRMS — Supabase setup and review

## Current state of the supplied project

The existing React/Vite application has many UI screens and a local data layer at
`src/data/db.ts`. That data layer reads and writes JSON to browser `localStorage`.
The login flow in `src/services/authService.ts` also performs password comparisons
in the browser. This is suitable only for a local prototype, not a secure deployed
multi-user system. The app currently has no Supabase client, schema migration,
or database SQL file.

The additions in this package provide the Supabase client, initial asynchronous
data-access examples, and a PostgreSQL schema with Row Level Security policies.
They are the foundation for the migration, but existing screens still call the
old synchronous `db` object unless their service calls are explicitly changed.
Do not represent the whole app as cloud-connected until that migration is complete.

## Frontend and backend

- Frontend: `src/App.tsx`, `src/components/**`, `src/index.css`; React screens,
  forms, dashboards and navigation.
- Existing prototype data layer: `src/data/db.ts`; currently `localStorage`.
- Authentication prototype: `src/services/authService.ts`; currently local browser logic.
- Supabase client: `src/lib/supabase.ts`.
- Example cloud data access: `src/services/supabaseDataService.ts`.
- Backend/database: Supabase Auth + PostgreSQL + Row Level Security, configured by
  `supabase/schema.sql`.

## Run locally

1. Install Node.js LTS.
2. Open this `Project` folder in VS Code.
3. Run `npm install`.
4. In the Supabase dashboard create a project.
5. Open SQL Editor, paste and run `supabase/schema.sql`.
6. Copy `.env.example` to `.env.local`.
7. Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from Supabase
   Project Settings > API. Use the publishable/anon client key only in the browser.
   NEVER use the `service_role` key in a frontend `.env` variable.
8. Run `npm run dev`, then open http://localhost:3000.

The app's existing local prototype screens can still start without credentials,
but cloud calls require valid Supabase credentials and migration of those screens
to the new asynchronous service layer.

## Creating the first administrator

1. In Supabase Authentication, create the administrator user.
2. Copy that user's UUID from Authentication > Users.
3. In SQL Editor, update the profile's role after its profile row exists:
   `update public.profiles set role='ADMINISTRATOR' where email='your-admin-email@example.com';`
4. If the profile row does not exist, create it using the exact auth user UUID,
   username and email:
   `insert into public.profiles(id, username, email, role) values ('AUTH-USER-UUID','admin','your-admin-email@example.com','ADMINISTRATOR');`

Never expose service-role keys in browser code. RLS is mandatory; do not disable it
to make errors disappear.

## Important remaining work before production

- Replace `AuthService.login/register/resetPassword` with Supabase Auth methods
  (`signInWithPassword`, `signUp`, `signOut`, password reset) and load the profile
  role from `profiles`.
- Convert all synchronous `db.*` calls to awaited Supabase queries. React components
  must handle loading, errors, and empty states.
- Migrate CRUD for students, lecturers, modules, registrations, marks, results,
  ratings, academic rules, backups and audit logs.
- Add server-side or PostgreSQL-controlled result calculation. Do not trust marks,
  grades, role, or final results submitted by the browser.
- Tighten registration policies to verify the target module and allowed academic
  period. Test each RLS policy using separate administrator, lecturer and student
  accounts.
- Add automated tests and a deployment environment; verify the app with actual
  Supabase credentials.

## Current login/demo credentials

The supplied project includes demo credential shortcuts in its source. Treat these
as prototype data only. Do not use them in production or store real passwords in
`localStorage`.
