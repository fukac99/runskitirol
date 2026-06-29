# Run.Ski.Tirol Route Map App Plan

## Goal

Build a free, static route explorer for the Run.Ski.Tirol trails page that can be embedded in Squarespace and replaces the current Komoot collection embed where needed.

The app should preserve the current strengths of the Komoot embed:

- Show all routes together on one map.
- Aggregate route start points when zoomed out.
- Show a single route when linked directly.
- Look good on a topo-style map.
- Embed cleanly in Squarespace.

It should add the missing capabilities:

- Filter routes by distance, elevation gain, region, tags, and other metadata.
- Link every route to its matching Run.Ski.Tirol blog post.
- Export route data programmatically from the existing Komoot collections.
- Stay 100% free to host and run.

## Upstream Route Source

Komoot collections:

- RUN: https://www.komoot.com/collection/3093627/-run-by-runskitirol-com
- SKIMO: https://www.komoot.com/collection/3128981/-skimo-by-runskitirol-com

These collections are the source of truth for route geometry and basic route metadata.

Discovered public JSON endpoint patterns:

```text
https://api.komoot.de/v007/collections/{collection_id}/compilation/?page=0&limit=100
https://api.komoot.de/v007/collections/{collection_id}/compilation_lines_extended/?page=0&limit=100
```

The `compilation` endpoint returns route metadata such as:

- route id
- route name
- distance
- duration
- elevation up/down
- sport
- start point

The `compilation_lines_extended` endpoint returns route geometry as ordered `lat`, `lng`, and `alt` points.

Important constraint: these endpoints appear public but are not a formally documented Komoot API. The app should not call them directly from every visitor's browser. Instead, use a local import script to periodically export and cache the data into static files committed to this repository.

## Hosting

Use GitHub Pages.

This keeps hosting free and works well because the app can be fully static:

- HTML
- CSS
- JavaScript
- static JSON/GeoJSON route files

No backend, database, paid server, or paid tile service should be required.

## Free Map Strategy

Use a fully free browser map stack:

- `Leaflet` for the interactive map.
- OpenStreetMap-based raster tiles for the initial free version.
- Marker clustering via a free Leaflet clustering plugin.
- Route polylines loaded from static GeoJSON.

This avoids paid Mapbox/MapTiler dependencies and API keys.

Tradeoff: fully free tiles will not give the same polished 3D terrain look as Komoot. The initial target should be a clean topo-like 2D map with route overlays. If a true 3D terrain look becomes essential later, that will likely require either a free-tier provider with usage limits or a more complex self-hosted tile setup.

## Data Files

Generated files:

```text
data/routes.geojson
data/routes.json
```

`routes.geojson` should contain the route line geometry:

- one GeoJSON `Feature` per Komoot tour
- `LineString` geometry
- route id and basic properties

`routes.json` should contain filter/search/card metadata:

- `id`
- `slug`
- `name`
- `collection`
- `collection_name`
- `distance_km`
- `elevation_up_m`
- `elevation_down_m`
- `duration_s`
- `sport`
- `start_lat`
- `start_lng`
- `tags`
- `region`
- `blog_url`
- `komoot_url`

Metadata not available from Komoot, such as `tags`, `region`, and `blog_url`, should be maintained in a small hand-edited file:

```text
data/route-overrides.json
```

The import script should merge Komoot data with these overrides.

## Import Script

Create a script:

```text
scripts/export-komoot-routes.py
```

Responsibilities:

1. Fetch route metadata from the Komoot `compilation` endpoint.
2. Fetch route geometry from the Komoot `compilation_lines_extended` endpoint.
3. Join both responses by Komoot route id.
4. Merge optional local overrides from `data/route-overrides.json`.
5. Write `data/routes.geojson`.
6. Write `data/routes.json`.
7. Print a short summary of exported route count and any missing overrides.

The script should use only Python standard library modules at first, so it remains free and simple:

- `json`
- `urllib.request`
- `pathlib`
- `datetime`

## App Features

Initial version:

- Full-screen embeddable map.
- Route list/sidebar.
- Search by route name.
- Filter by distance range.
- Filter by elevation gain range.
- Filter by tags.
- Click route on map to open popup.
- Click route in list to zoom to route.
- Popup links to:
  - Run.Ski.Tirol blog post, when known.
  - Komoot tour.
- URL parameter to show one route:

```text
?route=judenkopf-round
```

- URL parameter for embed mode:

```text
?embed=1
```

Embed mode should reduce chrome and optimize layout for Squarespace.

## Squarespace Embeds

Main trails page, all routes:

```html
<iframe
  src="https://USERNAME.github.io/runskitirol-route-map/?embed=1"
  width="100%"
  height="650"
  style="border:0;"
  loading="lazy"
></iframe>
```

Individual blog post, one route:

```html
<iframe
  src="https://USERNAME.github.io/runskitirol-route-map/?embed=1&route=judenkopf-round"
  width="100%"
  height="650"
  style="border:0;"
  loading="lazy"
></iframe>
```

## Repository Structure

```text
runskitirol-route-map/
  PLAN.md
  README.md
  index.html
  src/
    app.js
    styles.css
  data/
    routes.geojson
    routes.json
    route-overrides.json
  scripts/
    export-komoot-routes.py
```

## Implementation Phases

### Phase 1: Data Export

- Add the Python export script.
- Generate `routes.geojson` and `routes.json`.
- Add a small empty `route-overrides.json` structure.
- Confirm all 89 Komoot routes export.

### Phase 2: Static Map Prototype

- Add `index.html`, `src/app.js`, and `src/styles.css`.
- Load the generated route files.
- Render all routes on a Leaflet map.
- Add route click popups.
- Add start-point clustering.

### Phase 3: Filters And Links

- Add distance and elevation filters.
- Add tag and region filters.
- Add route search.
- Add blog links from `route-overrides.json`.
- Add `?route=` support for single-route embeds.

### Phase 4: GitHub Pages

- Push the folder to a GitHub repository.
- Enable GitHub Pages from the repository settings.
- Verify the public URL.
- Embed the public URL in a Squarespace Code Block.

## Open Questions

- Which GitHub username or organization should host the Pages site?
- What should the final repository name be?
- Should the route map live as a standalone repository or inside an existing site repository?
- How should blog post URLs be mapped: manually in `route-overrides.json`, scraped from Squarespace, or exported from a CMS source if available?
- Which free tile source is acceptable for production usage under its terms?
