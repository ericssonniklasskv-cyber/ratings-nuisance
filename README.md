# Nuisance

Film and TV ratings with a separate trusted group score. Next.js 16, Supabase and TMDb.

## Setup

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env.local` and set the three values. The TMDb read token stays server-side.
3. Apply the SQL files in `supabase/migrations` in filename order to the existing Supabase project. They are also recorded in Supabase migration history.
4. In Supabase Auth → URL Configuration, set the Site URL and allow `<origin>/auth/callback`. The current project allows production, localhost, and `https://*-nuisance.vercel.app/auth/callback` for previews.
5. Run `pnpm dev`.

The app offers Google OAuth and email magic links. Google OAuth requires a Web application OAuth client in Google Auth Platform and the Google provider enabled in Supabase. No Google secret belongs in this repo or Vercel.

## Google OAuth setup

1. In Google Auth Platform, configure the consent screen and create an OAuth client of type **Web application**. Add `https://nuisance.se` and `http://localhost:3000` as Authorized JavaScript origins. Add `https://sjuaoddctstukfvmbbdn.supabase.co/auth/v1/callback` as the Authorized redirect URI. Google does not accept wildcard origins for Vercel previews.
2. In Supabase Authentication → Sign In / Providers → Google, enter the Google Client ID and Client Secret and enable the provider. Keep nonce checks enabled.
3. In Supabase Authentication → URL Configuration, keep Site URL `https://nuisance.se`. Allow `https://nuisance.se/auth/callback`, `http://localhost:3000/auth/callback`, and `https://*-nuisance.vercel.app/auth/callback`. The preview wildcard has already been added to the hosted project.

The app sends users back to the same origin that started sign-in. Its `/auth/callback` route exchanges the PKCE code for a cookie-backed session and returns to `/`. Every authenticated user can use the app immediately.

## Trusted group ratings

New profiles have `is_trusted_rater = false`. Any authenticated user can rate titles and see their own ratings. The official group score is calculated by the `official_group_ratings` database view from trusted users' ratings only. Ratings from other users remain visible individually but do not affect that score. When no trusted user has rated a title, the view returns no group score.

To mark a profile as trusted, run this in the Supabase SQL Editor after that user has signed in:

```sql
update public.profiles
set is_trusted_rater = true
where id = (select id from auth.users where email = 'your-email@example.com');
```

Change `is_trusted_rater` through the Supabase SQL Editor using a database administrator account. Regular clients can update their own display name and avatar URL, but cannot edit trust or admin flags. `is_admin` remains a separate role for reference-title management. The former `is_active` field is retained for historical data but no longer controls access.

## Rating scale

`0` is the special bottom mark; `1` means not worth watching; `2.0` through `10.0` means worth watching, with one decimal. Each member can rate a title once and edit or delete their own rating. Reference titles represent integer scores 2 through 10; only admins can set them.

## Scripts

- `pnpm dev` — local server
- `pnpm build` — production build
- `pnpm lint` — ESLint
- `pnpm typecheck` — TypeScript

Film and TV data comes from TMDb. This product uses the TMDb API but is not endorsed or certified by TMDb.
