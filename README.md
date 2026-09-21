# Nuisance

Private film and TV ratings for a small approved group. Next.js 16, Supabase and TMDb.

## Setup

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env.local` and set the three values. The TMDb read token stays server-side.
3. Apply the SQL files in `supabase/migrations` in filename order to the existing Supabase project. They are also recorded in Supabase migration history.
4. In Supabase Auth → URL Configuration, set the Site URL and allow `<origin>/auth/callback`. The current project allows `https://nuisance.se/auth/callback` and `http://localhost:3000/auth/callback`.
5. Run `pnpm dev`.

The app uses email magic links. Google Auth can be added when Google OAuth is configured in Supabase.

## Member approval

New profiles are inactive by default. After a person signs in for the first time, an operator approves them in the Supabase SQL Editor:

```sql
update public.profiles
set is_active = true, is_admin = true
where id = (select id from auth.users where email = 'your-email@example.com');
```

Set `is_admin = true` only for trusted reference-title administrators. For regular members, set just `is_active = true`. These columns cannot be changed through the app's Data API. Keep Supabase Auth signups and group approval under review as the group grows.

## Rating scale

`0` is the special bottom mark; `1` means not worth watching; `2.0` through `10.0` means worth watching, with one decimal. Each member can rate a title once and edit or delete their own rating. Reference titles represent integer scores 2 through 10; only admins can set them.

## Scripts

- `pnpm dev` — local server
- `pnpm build` — production build
- `pnpm lint` — ESLint
- `pnpm typecheck` — TypeScript

Film and TV data comes from TMDb. This product uses the TMDb API but is not endorsed or certified by TMDb.
