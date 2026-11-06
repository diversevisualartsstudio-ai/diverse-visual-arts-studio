# Deployment and configuration guide

## GitHub Pages demo mode

The site is intentionally able to run without a live backend. This avoids broken pages when the repo is first published to GitHub Pages. If `config.js` still contains empty values, the app works in a local demo mode with sample data instead of failing on page load.

## When you are ready for live data

1. Fill `config.js` with your Supabase project URL and anon key.
2. Run the SQL migration in `supabase/migrations/202611060001_dvas_portal.sql`.
3. Configure Supabase Auth and add a real admin role assignment.
4. Deploy the `supabase/functions/dvas-assistant` function and set the IBM secrets.
5. In GitHub Pages settings, publish from the `main` branch at `/ (root)`.

This keeps the deployment stable while ensuring a production-ready setup path exists.

