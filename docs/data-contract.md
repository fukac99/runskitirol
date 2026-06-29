# Route Data Contract

This repository uses Komoot as the upstream source for route geometry and baseline route metadata. The exporter in `scripts/export-komoot-routes.py` writes generated files for the static app and merges hand-maintained metadata from `data/route-overrides.json`.

Do not edit generated route data by hand. Add local metadata such as blog links, regions, tags, or stable slug overrides in `data/route-overrides.json`, then rerun the exporter.

## Files

### `data/routes.json`

Generated route metadata used for search, filters, cards, links, and route-specific URLs.

Top-level fields:

- `exported_at` (required string): UTC ISO-8601 timestamp for the export run.
- `source` (required string): source system identifier. Currently `komoot`.
- `collections` (required array): Komoot collection definitions exported by the importer.
- `route_count` (required number): number of records in `routes`.
- `routes` (required array): route records.

Route record fields:

- `id` (required string): Komoot tour ID, serialized as a string. This is the primary route identifier.
- `slug` (required string): stable app-facing route slug. Used for links such as `?route=judenkopf-round`.
- `name` (required string): route name from Komoot.
- `collection` (required string): short collection key, currently `run` or `skimo`.
- `collection_name` (required string): display name for the source collection.
- `collection_url` (required string): Komoot collection URL.
- `komoot_url` (required string): Komoot tour URL derived from `id`.
- `distance_m` (required number): route distance in meters.
- `distance_km` (required number): route distance in kilometers, rounded for display/filtering.
- `elevation_up_m` (required number): ascent in meters.
- `elevation_down_m` (required number): descent in meters.
- `duration_s` (required number): Komoot duration in seconds. Komoot may provide `0`.
- `start_lat` (required number): start latitude.
- `start_lng` (required number): start longitude.
- `tags` (required array of strings): local filter tags. Defaults to `[]`.
- `blog_url` (optional string or `null`): Run.Ski.Tirol blog URL from overrides.
- `region` (optional string or `null`): local region label from overrides.
- `sport` (optional string or `null`): Komoot sport value.
- `type` (optional string or `null`): Komoot tour type.
- `start_alt_m` (optional number or `null`): start altitude in meters.
- `date` (optional string or `null`): Komoot route date.
- `changed_at` (optional string or `null`): Komoot changed timestamp.

### `data/routes.geojson`

Generated GeoJSON used to draw route lines on the map.

Top-level fields:

- `type` (required string): always `FeatureCollection`.
- `properties.exported_at` (required string): UTC ISO-8601 timestamp for the export run.
- `properties.source` (required string): source system identifier. Currently `komoot`.
- `properties.route_count` (required number): number of route features.
- `features` (required array): one feature per exported route.

Feature fields:

- `type` (required string): always `Feature`.
- `geometry.type` (required string): always `LineString`.
- `geometry.coordinates` (required array): ordered route points as `[longitude, latitude, altitude]`.
- `properties.id` (required string): same route ID as `routes.json`.
- `properties.slug` (required string): same slug as `routes.json`.
- `properties.name` (required string): same name as `routes.json`.
- `properties.collection` (required string): same collection key as `routes.json`.
- `properties.distance_km` (required number): same rounded distance as `routes.json`.
- `properties.elevation_up_m` (required number): same ascent as `routes.json`.
- `properties.komoot_url` (required string): same Komoot URL as `routes.json`.
- `properties.tags` (required array of strings): same tags as `routes.json`.
- `properties.blog_url` (optional string or `null`): same blog URL as `routes.json`.
- `properties.region` (optional string or `null`): same region as `routes.json`.

### Per-collection files

The exporter also writes one pair of files per collection so each map page downloads only the routes it needs:

- `data/routes.run.json` and `data/routes.run.geojson`
- `data/routes.skimo.json` and `data/routes.skimo.geojson`

Each per-collection file uses the exact same schema as the combined `routes.json` / `routes.geojson`, but contains only the routes for that collection. The combined files are still written for validation and back-compat. Do not edit any of these generated files by hand.

### `data/route-overrides.json`

Hand-edited metadata merged into generated route records. This is the only data file that should normally be edited manually.

Top-level fields:

- `routes` (required object): real overrides keyed by Komoot route ID.
- `_examples` (optional object): examples for maintainers. The importer ignores this section.

Each key under `routes` must be an existing Komoot tour ID exported from the configured RUN or SKIMO collections. Unknown IDs are reported as stale overrides after export.

Supported route override fields:

- `slug` (optional string): app-facing slug override. Use this to preserve an existing public URL when the Komoot title changes.
- `blog_url` (optional string): canonical Run.Ski.Tirol blog post URL for this route.
- `region` (optional string): route region used for display and filtering.
- `tags` (optional array of strings): route tags used for filtering.

Example:

```json
{
  "routes": {
    "1878119644": {
      "slug": "munde-runde",
      "blog_url": "https://www.runskitirol.com/blog/munde-runde",
      "region": "Mieminger Kette",
      "tags": ["trail-running", "ridge", "long-run"]
    }
  },
  "_examples": {
    "1234567890": {
      "slug": "example-route",
      "blog_url": "https://www.runskitirol.com/blog/example-route",
      "region": "Example Region",
      "tags": ["example-tag"]
    }
  }
}
```

## Route IDs And Slugs

Route IDs come from Komoot tour IDs and are the stable join key between Komoot metadata, Komoot geometry, local overrides, `routes.json`, and `routes.geojson`.

Slugs are the stable public identifier for app URLs. By default, the exporter creates a slug from the current Komoot route name. If a route has already been linked from Run.Ski.Tirol, Squarespace, social posts, or other public pages, preserve that URL by adding a `slug` override in `data/route-overrides.json`.

When a Komoot title changes:

1. Keep the existing route ID.
2. Add or keep a `slug` override if the old slug is already public.
3. Rerun `python3 scripts/export-komoot-routes.py`.
4. Do not edit `data/routes.json` or `data/routes.geojson` manually.

If a route is replaced with a new Komoot tour, it gets a new route ID. Move the override from the old ID to the new ID and decide whether to keep the old slug as an override.

## Override Workflow

Use overrides for metadata not available from Komoot:

- Add `blog_url` when a matching Run.Ski.Tirol blog post exists.
- Add `region` for display and filtering.
- Add `tags` for user-facing filters.
- Add `slug` only when the generated slug needs to remain stable or be more readable.

Workflow:

1. Find the Komoot route ID in `data/routes.json` or on the Komoot tour URL.
2. Edit only `data/route-overrides.json`.
3. Add or update that route ID under `routes`.
4. Run `python3 scripts/export-komoot-routes.py`.
5. Check the exporter output for stale override warnings.
6. Review the generated diff in `data/routes.json` and `data/routes.geojson`.

Keep `_examples` for documentation only. Do not put fake route IDs under `routes`, because the exporter treats every `routes` key as a real route override and warns when the ID is not present in the current Komoot export.
