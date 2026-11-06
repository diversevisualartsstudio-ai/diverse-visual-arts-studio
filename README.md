# DVAS Portal

Static GitHub Pages frontend with Supabase Auth/database integration scaffolding and a protected IBM watsonx.ai Edge Function.

## Setup

Follow [SETUP.md](SETUP.md) to configure Supabase authentication, database row-level security, the assistant function, GitHub Pages, and a custom domain. The portal intentionally does not include credentials. `config.js` contains placeholders until you add your Supabase project values; IBM credentials must be stored as Supabase Edge Function secrets.

## Features

- Supabase email/password sign-up, verification, sign-in, and sign-out.
- Client project intake stored in a Supabase database with role-based RLS.
- Role-gated client, investor, and admin portal views.
- Server-side watsonx.ai integration scaffold; no IBM key is exposed in the browser.
- Custom domain and DNS setup checklist.

The investor figures and chart are illustrative placeholders, not actual financial records. The project list is database-backed after configuration.
