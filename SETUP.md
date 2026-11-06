# Deployment & integration setup

The portal is a static GitHub Pages frontend with a Supabase backend. The login form, project intake, and AI assistant remain disabled until you configure the external services below. No provider secrets belong in GitHub Pages or `config.js`.

## 1. Create Supabase backend and secure project intake

1. Create a Supabase project and copy its Project URL and publishable (or legacy anon) key from **Project Settings → API**.
2. In the Supabase SQL Editor, run `supabase/migrations/202611060001_dvas_portal.sql`.
3. Set the first admin only after creating that account, using the commented bootstrap SQL at the bottom of the migration. Never let a user choose their own admin role.
4. Copy `config.example.js` to `config.js` locally, fill in the Supabase URL and public anon/publishable key, and commit `config.js` to the Pages site. The anon key is designed for browser use; Row Level Security is the protection boundary. Never expose a service-role key.
5. The migration enables RLS: clients see their own projects, investors can read project snapshots, and admins can read/update all projects. Verify these policies in Supabase before using real client data.

The repository's `config.js` is a placeholder until you add your Supabase project values. Do not use real personal or confidential project data until the policies, email confirmation, and access roles have been tested.

## 2. Authentication

Supabase Auth handles email/password registration, email verification, sign-in, and session management. In **Authentication → URL Configuration**, set the Site URL to your Pages URL and add it to the Redirect URLs. For a custom domain, add that origin too. Configure SMTP before inviting external users. New accounts receive the `client` role; the role is not user-selectable. Admin role assignment is a trusted SQL operation shown above.

This frontend integration is not a substitute for a security review. Consider MFA enforcement, account recovery, rate limits, privacy requirements, and organization-specific access controls before production use.

## 3. Live IBM watsonx.ai assistant

The assistant makes requests only through a Supabase Edge Function; IBM credentials are never sent to the browser.

1. In `supabase/functions/dvas-assistant`, deploy the `dvas-assistant` function using the Supabase CLI or dashboard.
2. Set Edge Function secrets (never commit these): `WATSONX_API_KEY`, `WATSONX_PROJECT_ID`, `WATSONX_URL` (your IBM Cloud region endpoint, e.g. `https://us-south.ml.cloud.ibm.com`), and optionally `WATSONX_MODEL_ID`.
3. Set `DASHBOARD_ORIGIN` to the exact deployed site origin, such as `https://diversevisualartsstudio-ai.github.io`, and redeploy. The function checks the Supabase user session and calls watsonx.ai server-side.
4. Test with a non-sensitive prompt and review Supabase Function logs. The function returns generic errors to the browser and does not send user credentials to IBM.

This wires a watsonx.ai text-generation model; it does not claim to call a separate IBM Bob product API. Choose a model available to your IBM project and verify its current API/model requirements in IBM's documentation.

## 4. Custom domain checklist

A real domain name is needed before a CNAME can be configured; none was supplied, so no `CNAME` file is added yet.

1. Register or select a domain you control, for example `portal.example.com`.
2. In **Repository → Settings → Pages**, add that exact hostname under **Custom domain**. Wait for DNS validation before enabling **Enforce HTTPS**.
3. At your DNS provider, create a CNAME record for the chosen subdomain pointing to `diversevisualartsstudio-ai.github.io`. For an apex/root domain, use the GitHub Pages A/AAAA records documented by GitHub instead of a CNAME.
4. Once configured, add the hostname as a Supabase Auth redirect URL and set the Edge Function `DASHBOARD_ORIGIN` to `https://portal.example.com`.
5. Add a root `CNAME` file containing only the actual hostname after it is known. Do not use the example placeholder as a live record.

DNS can take time to propagate. Confirm the GitHub Pages HTTPS status and test sign-in, project access by role, and assistant CORS from the final hostname.

## GitHub Pages

In **Repository → Settings → Pages**, select branch `main` and folder `/(root)` as the publishing source. The static site URL is `https://diversevisualartsstudio-ai.github.io/diverse-visual-arts-studio/`. Pages can host only the frontend; Supabase hosts authentication, database, and Edge Functions.
