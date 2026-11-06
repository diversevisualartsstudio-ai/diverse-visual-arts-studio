# diverse-visual-arts-studio

AI agent-powered design studio using IBM watsonx Orchestrate, IBM Bob, and cybersecurity pipelines.

## GitHub Pages status

This repository is configured to work in a safe GitHub Pages demo mode by default.

- If `config.js` contains empty values, the portal loads in demo mode.
- Demo mode keeps the site functional without Supabase or IBM credentials.
- When you are ready to enable live auth, storage, and AI, replace the empty values in `config.js`, set up Supabase, and deploy the Edge Function.

## Live demo

The site can be previewed directly as a static page on GitHub Pages without needing a backend configured.

## Production setup

See `SETUP.md` for the secure live setup path involving:

- Supabase Auth
- RLS-protected project tables
- IBM watsonx AI Edge Function
- GitHub Pages hosting
- custom domain configuration

