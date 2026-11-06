# Live setup

The portal requires an external Supabase project for real authentication and shared project storage. The UI will not fall back to a fake/demo login when the service is unconfigured.

1. Create a Supabase project and keep its service-role key private.
2. Run `supabase/migrations/202611060001_dvas_portal.sql` in that project's SQL editor.
3. Set `supabaseUrl` and the public anon/publishable key in `config.js`. These values are intended for browser use; never place a service-role key in the repository.
4. Configure Supabase Auth email confirmation and allowed redirect URLs for the exact GitHub Pages site URL.
5. The migration creates new accounts with the `client` role. Promote the trusted administrator through the Supabase SQL editor using the bootstrap statement documented at the end of the migration. Do not expose admin role assignment in the browser.
6. Deploy `supabase/functions/dvas-assistant` and configure the IBM watsonx secrets there if the assistant is needed. The assistant is unavailable until configured.
7. In repository Settings → Pages, publish from the `main` branch and root folder. Use the resulting default `github.io` URL; there is no custom-domain configuration in this setup.
8. Test sign-up, email confirmation, sign-in, project submission, role-based access, refresh, and sign-out with separate accounts before sharing.

## Current limitations

Revenue, security, and SLA dashboard values are placeholders until connected to trusted data sources. Do not enter sensitive client information until the backend policies and production access requirements have been reviewed.
