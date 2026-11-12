# DVA Revenue Orchestrator — MVP

A responsive landing page and browser-based project intake experience for DiverseVisualArtsStudioLLC.

## What is included
- Public-facing studio landing page and service catalog.
- Project intake for client, business, email, service, scope, timeline, budget, and industry.
- Browser speech-to-text (where supported) and text-to-speech.
- Rule-based service classification and package discovery suggestions.
- Automatic human-review flag for explicit sensitive checkbox or detected sensitive terms.
- Proposal/discovery summary, copy action, and downloadable JSON intake record.
- Responsive layout for desktop and mobile.

## Run locally
Open `index.html` in a modern browser, or serve the repository root with any static web server and visit `/revenue-orchestrator/`.

## Important MVP boundaries
This is a front-end demonstration. It does **not** transmit or persist form submissions. The generated intake stays in the browser until the user copies or downloads it. It does not currently connect to IBM watsonx Orchestrate / IBM Bob, Watson Speech services, CRM, calendar, invoicing, or payment processing. Browser voice features are not the IBM Watson Speech services integration.

Do not enter passwords, API keys, access tokens, confidential network diagrams, patient records, or other sensitive information. The security flag is a routing demonstration, not a secure data-handling control. Sensitive requests require a separately configured and tested human-review process.

## IBM integration plan
1. Configure the watsonx Orchestrate tenant, agent, skills, and authenticated API endpoint.
2. Store API credentials as server-side deployment secrets; never place them in browser JavaScript.
3. Add a backend API to validate intake, classify intent, and call the configured watsonx Orchestrate endpoint.
4. Add authenticated CRM, calendar, and invoicing adapters.
5. Add a secure human-review queue with access controls and audit events.
6. Replace browser speech demo with Watson Speech to Text / Text to Speech after service credentials and consent UX are configured.

## Deployment
The parent repository is configured for GitHub Pages. When its Pages source publishes the repository root, this app is available at:

`https://diversevisualartsstudio-ai.github.io/diverse-visual-arts-studio/revenue-orchestrator/`

GitHub Actions workflow validation is provided separately. A successful code check does not prove that IBM services or external integrations are connected.