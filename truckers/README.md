# Truckers Need Help Too

A mobile-first driver support app by DiverseVisualArtsStudioLLC, inspired by GODCARE Podcast and OneLoveOneBeat.

## Build and preview

1. Clone this repository and open a terminal in its root.
2. Run `python3 -m http.server 8000`.
3. Open `http://localhost:8000/truckers/`. The app uses plain HTML, CSS and JavaScript, with no install or build command.
4. Log a trip, rest stop and support contact. Reload and check that they are still present. Export a pay CSV from the Pay screen.
5. Allow the service worker to finish installing on the first online visit, then disconnect and reload the app to check the offline shell. External directories and social links require internet access.

## Publish

Commit the changes under `truckers/` on the site's existing publishing branch. Open the [GitHub Pages app](https://diversevisualartsstudio-ai.github.io/diverse-visual-arts-studio/truckers/) after deployment.

## Data

Records stay in the browser. The pay tracker shows estimates from the values a driver enters and exports CSV files for backup and payroll conversations. Parking links are search and information resources. Drivers enter their own confirmation dates. The cropped app hero is derived from the supplied OneLoveOneBeat/GODCARE campaign poster.
