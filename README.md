# Stakeholder Profiles

A small web app for **The Upskilling Labs** (The Labs). In Build Cycle C04, each participant writes three profiles of players in the DC field around The Labs: libraries, employers, workforce agencies, community groups, training providers and others. Facilitators, Poderators and Lab Leads read the profiles together on the sensemaking day, in the gallery, as a CSV and as printed cards.

**Independence is the point.** Participants can't see anyone else's profiles until they have submitted their own three. The database enforces this, not just the screen.

> The Triangulator-inator that used to live here is tabled on the [`tabled/triangulator`](../../tree/tabled/triangulator) branch. We'll return to it later.

## Data handling

Unlike the Triangulator, which kept everything in the browser, this app **stores profiles in the OLOS Supabase database**. Facilitators can see profiles at any time, including drafts. Other participants can see a profile once it's submitted and they have submitted their own three. Participants never see who wrote a profile, and printed cards never show an author.

## Run it locally

```bash
npm ci
cp .env.example .env.local   # fill in the URL and anon key
npm run dev
```

To work on screens without Supabase, run `npm run dev:mock`. It uses an in-memory fake, and `?as=participant|unlocked|facilitator|nonmember` picks who you are. Mock code is never included in a production build.

Checks: `npm run typecheck` and `npm run build`.

## Stack

Vite, React 18 and TypeScript (strict), `@supabase/supabase-js` v2 with PKCE, `react-router-dom` and plain CSS, including a print stylesheet. It's a single-page app with no server code. Access control lives in Postgres row-level security.

## Setup

1. **Vercel:** create a new project from this repo with framework Vite and the root directory left as the repo root. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. `vercel.json` rewrites every path to the app so deep links work.
2. **Supabase Auth, URL configuration:** add `https://<domain>/**` to the allowed redirect URLs. To sign in on Vercel previews, also add a wildcard for the preview URLs. **Don't change the Site URL**, because OLOS uses it.
3. **Google provider:** this is already set up for OLOS, so no change is needed.
4. **Migrations:** apply `supabase/migrations/*.sql` to the OLOS project. Do OLOS-dev first and run `supabase/tests/rls.sql` there, then do prod. The test script rolls itself back.
5. **Config:** the `sensemaking_config` row for `C04` is edited in the Supabase dashboard. It has two fields: `required_profiles` (default 3) and `submissions_open`. Turn `submissions_open` off to stop all new profiles and edits.

## Who can do what

| | Write profiles | Read others' submitted | Read drafts | Export CSV |
|---|---|---|---|---|
| OLOS member, fewer than 3 submitted | ✓ | — | own only | — |
| OLOS member, 3 or more submitted | ✓ | ✓ (no author) | own only | — |
| Facilitator (admin, owner, developer, Poderator, Lab Lead) | ✓ | ✓ (with author) | ✓ | ✓ |
| Google account without OLOS membership | — | — | — | — |

An OLOS member is anyone with a `participants` row that isn't archived or banned. Submitted profiles are locked for their authors.

## License

MIT. See [LICENSE](LICENSE).
