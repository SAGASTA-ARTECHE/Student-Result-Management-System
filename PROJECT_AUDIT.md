# SRMS project audit — findings from Project.zip

## Summary
The app is a React 19 + TypeScript + Vite project. The current `npm run lint` (TypeScript check) passed on the original supplied project before the Supabase files were added. The supplied archive contains a large `node_modules` directory; do not submit that directory as source code.

## What is present
- `src/App.tsx`: app shell, login gate, role dashboards and navigation.
- `src/components/**`: admin, lecturer and student screens for students, modules, marks, results, reports, ratings, audit trail, backups, and database/test consoles.
- `src/data/initialData.ts`: demonstration/seed records.
- `src/data/db.ts`: large local JSON storage layer using `localStorage`.
- `src/services/authService.ts`: client-side login/register/reset logic.
- `src/services/calculationService.ts`: result calculation logic.
- `src/types/index.ts`: TypeScript domain models.
- Vite and TypeScript project configuration.

## Main gaps / risks
1. **No real database connection.** No Supabase dependency/client, `.env` setup for Supabase, schema migration, or SQL files existed in the uploaded archive.
2. **LocalStorage is not a shared database.** Each browser/device has its own records; clearing browser data can remove them. Changes are not automatically shared with another user.
3. **Authentication is not production-safe.** `authService.ts` compares the password to `user.password_hash` in browser-accessible data; in the supplied code the field may hold plaintext. Demo password shortcuts are hard-coded in frontend code. Use Supabase Auth instead.
4. **Authorization must not rely on hidden screens.** Role-based navigation in React is a usability feature, not a security boundary. Enforce authorization with PostgreSQL RLS policies and, for privileged operations, trusted server/database functions.
5. **Business rules are not yet database-enforced.** Mark/weight checks should exist in SQL constraints and trusted result-calculation logic, not only frontend validation.
6. **Demo date/data.** The local seed data includes academic-year values such as 2024/2025; update these to the institution's current academic period as appropriate.
7. **“Database console”, triggers, stored procedures, concurrency and cloud sync features may be simulations.** A UI that displays trigger definitions or cloud status is not proof that real PostgreSQL triggers, procedures, backups or cloud sync are running.
8. **Backup/security.** Browser-exported JSON is not a secure disaster-recovery strategy. Add controlled server/database backups and protect student records.
9. **No supplied database setup/migration.** The uploaded project contains no `.sql` or Supabase migration file.
10. **No actual credentials supplied.** A working cloud connection cannot be verified without a Supabase project URL and publishable/anon key configured locally. Do not send secret service-role keys in chat or frontend code.

## Supabase additions in this upgrade
- `supabase/schema.sql`: relational PostgreSQL tables, checks, indexes and initial RLS policies.
- `src/lib/supabase.ts`: Supabase browser client using Vite environment variables.
- `src/services/supabaseDataService.ts`: async examples for students, modules, marks and results.
- `.env.example`: required environment variable names.
- `SUPABASE_SETUP.md`: setup and remaining migration steps.

**Important:** this is a staged integration. Existing screens continue using `src/data/db.ts` until each service/component is migrated from synchronous localStorage calls to asynchronous Supabase calls. It would be inaccurate to call the entire application fully Supabase-connected before that refactor and testing.
