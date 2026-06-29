#!/usr/bin/env python3
"""Export Run.Ski.Tirol Komoot collections into static data files."""

from __future__ import annotations

import json
import re
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


COLLECTIONS = [
    {
        "id": 3093627,
        "key": "run",
        "name": "RUN by runskitirol.com",
        "url": "https://www.komoot.com/collection/3093627/-run-by-runskitirol-com",
    },
    {
        "id": 3128981,
        "key": "skimo",
        "name": "SKIMO by runskitirol.com",
        "url": "https://www.komoot.com/collection/3128981/-skimo-by-runskitirol-com",
    },
]

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
OVERRIDES_PATH = DATA_DIR / "route-overrides.json"
ROUTES_JSON_PATH = DATA_DIR / "routes.json"
ROUTES_GEOJSON_PATH = DATA_DIR / "routes.geojson"


def routes_json_path(collection_key: str) -> Path:
    return DATA_DIR / f"routes.{collection_key}.json"


def routes_geojson_path(collection_key: str) -> Path:
    return DATA_DIR / f"routes.{collection_key}.geojson"


def write_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")


def routes_payload(exported_at: str, collections: list[dict[str, Any]], records: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "exported_at": exported_at,
        "source": "komoot",
        "collections": collections,
        "route_count": len(records),
        "routes": records,
    }


def geojson_payload(exported_at: str, features: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "type": "FeatureCollection",
        "properties": {
            "exported_at": exported_at,
            "source": "komoot",
            "route_count": len(features),
        },
        "features": features,
    }

HEADERS = {
    "Accept": "application/hal+json,application/json",
    "User-Agent": "runskitirol-route-map/0.1 (+https://www.runskitirol.com)",
}


def fetch_json(url: str) -> dict[str, Any]:
    request = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Komoot request failed: {url} ({exc.code}) {body}") from exc


def fetch_all_items(collection_id: int, endpoint: str) -> list[dict[str, Any]]:
    page = 0
    items: list[dict[str, Any]] = []

    while True:
        url = (
            f"https://api.komoot.de/v007/collections/{collection_id}/"
            f"{endpoint}/?page={page}&limit=100"
        )
        payload = fetch_json(url)
        items.extend(payload.get("_embedded", {}).get("items", []))

        page_info = payload.get("page") or {}
        total_pages = page_info.get("totalPages")
        next_link = payload.get("_links", {}).get("next", {}).get("href")

        if total_pages is not None:
            if page + 1 >= total_pages:
                break
        elif not next_link:
            break

        page += 1

    return items


def load_overrides() -> dict[str, dict[str, Any]]:
    if not OVERRIDES_PATH.exists():
        return {}

    with OVERRIDES_PATH.open() as file:
        payload = json.load(file)

    routes = payload.get("routes", {})
    if not isinstance(routes, dict):
        raise ValueError(f"{OVERRIDES_PATH.relative_to(ROOT)} must contain a routes object")

    return {str(route_id): data for route_id, data in routes.items()}


def slugify(value: str) -> str:
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def round_float(value: Any, digits: int) -> float | None:
    if value is None:
        return None
    return round(float(value), digits)


def build_route_record(
    collection: dict[str, Any],
    metadata: dict[str, Any],
    override: dict[str, Any],
) -> dict[str, Any]:
    route_id = str(metadata["id"])
    start_point = metadata.get("start_point") or {}
    slug = override.get("slug") or slugify(metadata["name"])

    return {
        "id": route_id,
        "slug": slug,
        "name": metadata["name"],
        "collection": collection["key"],
        "collection_name": collection["name"],
        "collection_url": collection["url"],
        "sport": metadata.get("sport"),
        "type": metadata.get("type"),
        "distance_m": round_float(metadata.get("distance"), 1),
        "distance_km": round_float((metadata.get("distance") or 0) / 1000, 2),
        "duration_s": metadata.get("duration"),
        "elevation_up_m": round_float(metadata.get("elevation_up"), 1),
        "elevation_down_m": round_float(metadata.get("elevation_down"), 1),
        "start_lat": start_point.get("lat"),
        "start_lng": start_point.get("lng"),
        "start_alt_m": start_point.get("alt"),
        "date": metadata.get("date"),
        "changed_at": metadata.get("changed_at"),
        "komoot_url": f"https://www.komoot.com/tour/{route_id}",
        "blog_url": override.get("blog_url"),
        "region": override.get("region"),
        "tags": override.get("tags", []),
    }


def build_feature(record: dict[str, Any], geometry: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "type": "Feature",
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [point["lng"], point["lat"], point.get("alt")]
                for point in geometry
            ],
        },
        "properties": {
            "id": record["id"],
            "slug": record["slug"],
            "name": record["name"],
            "collection": record["collection"],
            "distance_km": record["distance_km"],
            "elevation_up_m": record["elevation_up_m"],
            "komoot_url": record["komoot_url"],
            "blog_url": record["blog_url"],
            "region": record["region"],
            "tags": record["tags"],
        },
    }


def export_collection(
    collection: dict[str, Any],
    overrides: dict[str, dict[str, Any]],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    metadata_items = fetch_all_items(collection["id"], "compilation")
    line_items = fetch_all_items(collection["id"], "compilation_lines_extended")
    lines_by_id = {str(item["id"]): item for item in line_items}

    records = []
    features = []
    missing_geometry = []

    for metadata in metadata_items:
        route_id = str(metadata["id"])
        line = lines_by_id.get(route_id)
        if not line:
            missing_geometry.append(route_id)
            continue

        record = build_route_record(collection, metadata, overrides.get(route_id, {}))
        records.append(record)
        features.append(build_feature(record, line.get("geometry", [])))

    if missing_geometry:
        missing = ", ".join(missing_geometry)
        raise RuntimeError(f"Missing geometry for {collection['key']} route IDs: {missing}")

    return records, features


def main() -> int:
    DATA_DIR.mkdir(exist_ok=True)
    overrides = load_overrides()
    exported_at = datetime.now(timezone.utc).isoformat()

    records: list[dict[str, Any]] = []
    features: list[dict[str, Any]] = []
    written_paths: list[Path] = []

    for collection in COLLECTIONS:
        collection_records, collection_features = export_collection(collection, overrides)
        records.extend(collection_records)
        features.extend(collection_features)
        print(
            f"Exported {len(collection_records)} routes from "
            f"{collection['key']} collection {collection['id']}"
        )

        # Per-collection files so each map page loads only its own routes.
        per_json = routes_json_path(collection["key"])
        per_geojson = routes_geojson_path(collection["key"])
        write_json(per_json, routes_payload(exported_at, [collection], collection_records))
        write_json(per_geojson, geojson_payload(exported_at, collection_features))
        written_paths.extend([per_json, per_geojson])

    # Combined files, kept for back-compat and validation.
    write_json(ROUTES_JSON_PATH, routes_payload(exported_at, COLLECTIONS, records))
    write_json(ROUTES_GEOJSON_PATH, geojson_payload(exported_at, features))
    written_paths.extend([ROUTES_JSON_PATH, ROUTES_GEOJSON_PATH])

    overridden_ids = set(overrides)
    exported_ids = {record["id"] for record in records}
    stale_overrides = sorted(overridden_ids - exported_ids)
    if stale_overrides:
        print(f"Warning: stale overrides for missing route IDs: {', '.join(stale_overrides)}")

    for path in written_paths:
        print(f"Wrote {path.relative_to(ROOT)}")
    print(f"Total routes: {len(records)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
