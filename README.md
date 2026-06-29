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

## Basemap

The baseline map uses the free hosted OpenTopoMap layer and defaults to Tirol.

## Project Workflow

- `PLAN.md`: product and implementation plan.
- `ENGINEERING_LOOP.md`: minimal Linear-centered agent loop for PM triage, execution, and human review.
- `docs/data-contract.md`: route data contract and override workflow.

See `PLAN.md` for the full implementation plan.
