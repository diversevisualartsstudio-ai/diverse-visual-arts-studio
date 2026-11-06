# DVAS Portal

This repository includes a static GitHub Pages portal for the Diverse Visual Arts Studio. It contains:

- a secure-feeling login flow
- client workspace intake form
- investor dashboard
- admin audit console
- IBM Bob assistant interaction
- project queue tracking in local browser storage

## Local preview

Open `index.html` directly in a browser, or use a local static server:

```bash
python -m http.server 8000
```

Then visit http://localhost:8000

## GitHub Pages deployment

1. Push this repository to GitHub.
2. Open GitHub Repository -> Settings -> Pages.
3. Set Source to `Deploy from a branch`.
4. Select branch `main` and folder `/ (root)`.
5. Save.

Your static site will be published at:

https://diversevisualartsstudio-ai.github.io/diverse-visual-arts-studio/

## Custom domain setup

If you have a custom domain, add a `CNAME` file to the root of the repo with the domain name only, for example:

```text
portal.dvas.studio
```

Then add the corresponding DNS record at your domain provider:

- Type: CNAME
- Name: `www` or the host you want
- Value: `diversevisualartsstudio-ai.github.io`

## Notes

This is a static front-end implementation. Because GitHub Pages does not support a server-side backend directly, the project submission flow and login flow are implemented with browser-side localStorage for demo and prototype use. For production use, you would connect the form to a secure backend or service such as Supabase, Firebase, Netlify Functions, or a custom API.
