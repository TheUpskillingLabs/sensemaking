# Contributing

- Branch from `main` and open a PR against it. PRs are merged with merge commits, not squash.
- Before you open a PR, run `npm run typecheck` and `npm run build`. If you change anything in `supabase/`, apply it to OLOS-dev first and run `supabase/tests/rls.sql`. Say in the PR what you checked and what you saw.
- **Database:** add new migrations under `supabase/migrations/`. Every object gets the `sensemaking_` prefix. Never alter, drop or add policies to an existing OLOS table.
- **Secrets:** this repo is public. Only the Supabase URL and the anon key are used, and both come from env vars. Never commit or use the service role key.
- **House style:** the brand is **The Upskilling Labs**, or "The Labs". Never use an acronym. Capitalize program terms: Build Cycle, Pod, Poderator, Upskiller, Mentor, Organizer. Keep language plain and warm.
- The Triangulator-inator lives on `tabled/triangulator`, with its own contributing guide.
