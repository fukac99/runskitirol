# Run.Ski.Tirol Route Map

Static map app for the Run.Ski.Tirol trails page, intended to be hosted for free on GitHub Pages and embedded in Squarespace.

The current browser app is intentionally a minimal Tirol-centered basemap. Route overlays and custom data are kept out of the UI until the baseline map interaction feels good.

## Upstream Source

Routes are exported from these Komoot collections:

- RUN: https://www.komoot.com/collection/3093627/-run-by-runskitirol-com
- SKIMO: https://www.komoot.com/collection/3128981/-skimo-by-runskitirol-com

The import uses these discovered JSON endpoint patterns:

```text
https://api.komoot.de/v007/collections/{collection_id}/compilation/?page=0&limit=100
https://api.komoot.de/v007/collections/{collection_id}/compilation_lines_extended/?page=0&limit=100
```

## Data Export

Regenerate the baseline static data files:

```bash
python3 scripts/export-komoot-routes.py
```

Generated files:

- `data/routes.json`: route metadata for search, filters, cards, and links.
- `data/routes.geojson`: route line geometry for the map.

Manual metadata that is not available from Komoot, such as blog URLs, tags, and regions, belongs in `data/route-overrides.json`.

See `docs/data-contract.md` for the full route data contract, required and optional fields, stable route ID/slug rules, and the override workflow.

## Local Preview

The map is a static GitHub Pages-ready app with no build step. Preview it from the repository root with a local web server:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000/ in a browser.

## Pages

The app is split into per-collection map pages so each one only downloads the routes it needs:

- `index.html`: landing page linking to the two maps.
- `run.html`: RUN (trail running) routes. Loads `data/routes.run.*` only.
- `skimo.html`: SKIMO (ski mountaineering) routes. Loads `data/routes.skimo.*` only.

Each map page is map-only with a top filter bar:

- Search by route name.
- Distance range (km) and climb range (m, ascent).
- Tag filter (populated from route tags once they are added via overrides).
- A results counter ("Showing N of M routes"). Clearing all filters shows every route in the collection.
- Click a route on the map to see its details (distance, climb, Komoot link, and blog link when available).

Filter and selection state is shareable via URL parameters: `q`, `dmin`, `dmax`, `emin`, `emax`, `tag`, and `route=<slug>` to focus a single route.

## Basemap

The map defaults to Tirol and offers a layer switcher. The primary basemap is **Mapbox Outdoors**, a topographic style tuned for trails. The other layers are free, no-API-key fallbacks:

- **Mapbox Outdoors** (default, requires a token): topographic style. Shown only when a Mapbox access token is configured.
- **Outdoor topo**: Esri World Topo Map. Free, reliable, no API key. Used as the automatic fallback if Mapbox tiles fail or no token is set.
- **OpenTopoMap**: nicer hillshade/contour terrain look, but less reliable. Falls back to Outdoor topo if its tiles fail.
- **Streets**: standard OpenStreetMap, very reliable.

### Mapbox token

The token is loaded at runtime from `config.js`, which is gitignored so it is never committed to the repository.

1. Create a free token at https://account.mapbox.com/access-tokens/.
2. In the Mapbox dashboard, restrict the token to your site's domain(s) (URL restrictions) so it cannot be abused — it is served publicly on the static page.
3. Copy the template and add your token:

```bash
cp config.example.js config.js
```

```js
// config.js
window.RUNSKITIROL_CONFIG = {
  mapboxToken: "pk.your_token_here",
  mapboxStyle: "mapbox/outdoors-v12",
};
```

If `config.js` is missing or the token is empty, invalid, or over quota, the map automatically falls back to the free Esri Outdoor topo layer, so it never goes blank.

Mapbox's free tier covers 50,000 web map loads per month; usage and billing are managed in the Mapbox dashboard. Mapbox's terms require keeping the Mapbox and OpenStreetMap attribution visible (already included in the map).

### Deploying to GitHub Pages with a token

Because `config.js` is gitignored, it is not deployed automatically. To serve Mapbox tiles in production, choose one:

- Store the token as a repository secret and generate `config.js` during a GitHub Pages deploy workflow (recommended — keeps the token out of git).
- Or commit a `config.js` with a domain-restricted public token (simpler, but the token lives in the repo).

Without either, the deployed site still works using the free Esri fallback basemap.

### Embedding

The map supports single-route and reduced-chrome modes for embedding in Squarespace or other sites.

**Show all routes (full map):**

```html
<iframe src="https://fukac99.github.io/runskitirol/run.html?embed=1" width="100%" height="500" frameborder="0"></iframe>
```

**Show a single route:**

```html
<iframe src="https://fukac99.github.io/runskitirol/run.html?route=judenkopf-round&embed=1" width="100%" height="400" frameborder="0"></iframe>
```

Parameters:

- `embed=1` — hides the filter bar for a clean iframe experience.
- `route=<slug>` — focuses on a single route, hiding all others and fitting the map to its bounds. The slug matches the route's `slug` field in the data.

Both parameters work on `run.html` and `skimo.html`.

## Project Workflow

- `PLAN.md`: product and implementation plan.
- `ENGINEERING_LOOP.md`: minimal Linear-centered agent loop for PM triage, execution, and human review.
- `docs/data-contract.md`: route data contract and override workflow.

See `PLAN.md` for the full implementation plan.
