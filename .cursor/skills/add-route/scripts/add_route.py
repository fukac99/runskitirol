#!/usr/bin/env python3
"""Add a single new route to the map data files.

Usage:
    python add_route.py --tour-id 3072813126 --blog-url https://www.runskitirol.com/trails/example --collection run

Fetches route metadata and geometry from the Komoot API, scrapes ratings and
region from the blog post, and appends to route-overrides.json, the per-
collection routes JSON, and the per-collection GeoJSON.

Safety: refuses to overwrite existing route entries.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[4]  # .cursor/skills/add-route/scripts/ -> repo root
DATA_DIR = ROOT / "data"
OVERRIDES_PATH = DATA_DIR / "route-overrides.json"

KOMOOT_HEADERS = {
    "Accept": "application/hal+json,application/json",
    "User-Agent": "runskitirol-route-map/0.2 (+https://www.runskitirol.com)",
}
HTML_HEADERS = {
    "User-Agent": "runskitirol-route-map/0.2 (+https://www.runskitirol.com)",
    "Accept": "text/html,application/xhtml+xml",
}

COLLECTION_IDS = {"run": 3093627, "skimo": 3128981}
COLLECTION_META = {
    "run": {
        "id": 3093627,
        "key": "run",
        "name": "RUN by runskitirol.com",
        "url": "https://www.komoot.com/collection/3093627/-run-by-runskitirol-com",
    },
    "skimo": {
        "id": 3128981,
        "key": "skimo",
        "name": "SKIMO by runskitirol.com",
        "url": "https://www.komoot.com/collection/3128981/-skimo-by-runskitirol-com",
    },
}

RATING_PATTERN = re.compile(
    r"(Technical difficulty|Fitness|Objective danger|Landscape|Busy)\s*:\s*(\d+)\s*/\s*10",
    re.IGNORECASE,
)
DIFFICULTY_PATTERN = re.compile(
    r"^\s*(easy|medium|hard|very hard|severe)\s*$",
    re.IGNORECASE | re.MULTILINE,
)
RATING_KEY_MAP = {
    "technical difficulty": "technical_difficulty",
    "fitness": "fitness",
    "objective danger": "objective_danger",
    "landscape": "landscape",
    "busy": "busy",
}


def fetch_json(url: str) -> dict[str, Any]:
    req = urllib.request.Request(url, headers=KOMOOT_HEADERS)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def fetch_html(url: str) -> str:
    req = urllib.request.Request(url, headers=HTML_HEADERS)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def slugify(value: str) -> str:
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def round_float(value: Any, digits: int) -> float | None:
    if value is None:
        return None
    return round(float(value), digits)


# ── Komoot API ──────────────────────────────────────────────────────────────

def fetch_tour_metadata(tour_id: str) -> dict[str, Any]:
    url = f"https://api.komoot.de/v007/tours/{tour_id}"
    return fetch_json(url)


def fetch_tour_coordinates(tour_id: str) -> list[dict[str, Any]]:
    url = f"https://api.komoot.de/v007/tours/{tour_id}/coordinates"
    data = fetch_json(url)
    return data.get("items", [])


# ── Blog scraping ───────────────────────────────────────────────────────────

def scrape_blog_post(url: str) -> dict[str, Any]:
    html = fetch_html(url)
    text = re.sub(r"<[^>]+>", " ", html)

    ratings: dict[str, int] = {}
    for m in RATING_PATTERN.finditer(text):
        key = RATING_KEY_MAP.get(m.group(1).lower())
        if key:
            ratings[key] = int(m.group(2))

    difficulty = None
    dm = DIFFICULTY_PATTERN.search(text)
    if dm:
        difficulty = dm.group(1).strip().lower()

    region = None
    for m in re.finditer(
        r'<a[^>]+href="/(?:trails|skimo)\?(?:tag|category)=([^"&]+)"[^>]*>([^<]+)</a>',
        html,
        re.IGNORECASE,
    ):
        tag = m.group(2).strip()
        if tag.lower() not in ("trail running", "skimo", "trails"):
            region = tag
            break

    return {"ratings": ratings, "difficulty": difficulty, "region": region}


# ── Data file operations (append-only) ─────────────────────────────────────

def load_json(path: Path) -> dict[str, Any]:
    with path.open() as f:
        return json.load(f)


def write_json(path: Path, data: Any) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def build_route_record(
    tour_id: str,
    metadata: dict[str, Any],
    collection: dict[str, Any],
    blog_url: str,
    blog_data: dict[str, Any],
) -> dict[str, Any]:
    start_point = metadata.get("start_point") or {}
    slug = slugify(metadata["name"])

    return {
        "id": tour_id,
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
        "komoot_url": f"https://www.komoot.com/tour/{tour_id}",
        "blog_url": blog_url,
        "difficulty": blog_data.get("difficulty"),
        "ratings": blog_data.get("ratings") or None,
        "region": blog_data.get("region"),
    }


def build_feature(record: dict[str, Any], coordinates: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "type": "Feature",
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [pt["lng"], pt["lat"], pt.get("alt")]
                for pt in coordinates
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
            "difficulty": record["difficulty"],
            "ratings": record["ratings"],
            "region": record["region"],
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Add a new route to the map")
    parser.add_argument("--tour-id", required=True, help="Komoot tour ID")
    parser.add_argument("--blog-url", required=True, help="Blog post URL")
    parser.add_argument("--collection", required=True, choices=["run", "skimo"])
    parser.add_argument("--region", help="Override region (skip blog scrape for region)")
    parser.add_argument("--dry-run", action="store_true", help="Print what would be added without writing")
    args = parser.parse_args()

    tour_id = str(args.tour_id)
    collection = COLLECTION_META[args.collection]
    routes_path = DATA_DIR / f"routes.{args.collection}.json"
    geojson_path = DATA_DIR / f"routes.{args.collection}.geojson"

    # ── Guard: refuse to modify existing entries ────────────────────────
    routes_data = load_json(routes_path)
    existing_ids = {r["id"] for r in routes_data.get("routes", [])}
    if tour_id in existing_ids:
        print(f"ERROR: Route {tour_id} already exists in {routes_path.name}. Refusing to overwrite.", file=sys.stderr)
        return 1

    overrides_data = load_json(OVERRIDES_PATH) if OVERRIDES_PATH.exists() else {"routes": {}}
    if tour_id in overrides_data.get("routes", {}):
        print(f"ERROR: Route {tour_id} already exists in route-overrides.json. Refusing to overwrite.", file=sys.stderr)
        return 1

    # ── Fetch from Komoot ───────────────────────────────────────────────
    print(f"Fetching tour {tour_id} from Komoot API...")
    metadata = fetch_tour_metadata(tour_id)
    print(f"  Name: {metadata['name']}")
    print(f"  Distance: {(metadata.get('distance', 0) / 1000):.1f} km")
    print(f"  Elevation: +{metadata.get('elevation_up', 0):.0f}m / -{metadata.get('elevation_down', 0):.0f}m")

    print(f"Fetching coordinates...")
    coordinates = fetch_tour_coordinates(tour_id)
    print(f"  Got {len(coordinates)} points")

    # ── Scrape blog post ────────────────────────────────────────────────
    print(f"Scraping blog post: {args.blog_url}")
    blog_data = scrape_blog_post(args.blog_url)
    if args.region:
        blog_data["region"] = args.region
    print(f"  Ratings: {blog_data.get('ratings', {})}")
    print(f"  Difficulty: {blog_data.get('difficulty')}")
    print(f"  Region: {blog_data.get('region')}")

    # ── Build records ───────────────────────────────────────────────────
    record = build_route_record(tour_id, metadata, collection, args.blog_url, blog_data)
    feature = build_feature(record, coordinates)

    if args.dry_run:
        print("\n=== DRY RUN — would add: ===")
        print(f"\nRoute record:\n{json.dumps(record, indent=2, ensure_ascii=False)}")
        print(f"\nOverride entry:\n{json.dumps({tour_id: {k: v for k, v in {'blog_url': args.blog_url, 'ratings': blog_data.get('ratings'), 'difficulty': blog_data.get('difficulty'), 'region': blog_data.get('region')}.items() if v}}, indent=2)}")
        print(f"\nGeoJSON feature: {len(coordinates)} coordinate points")
        return 0

    # ── Append to route-overrides.json ──────────────────────────────────
    override_entry: dict[str, Any] = {"blog_url": args.blog_url}
    if blog_data.get("ratings"):
        override_entry["ratings"] = blog_data["ratings"]
    if blog_data.get("difficulty"):
        override_entry["difficulty"] = blog_data["difficulty"]
    if blog_data.get("region"):
        override_entry["region"] = blog_data["region"]

    overrides_data["routes"][tour_id] = override_entry
    overrides_data["routes"] = dict(sorted(overrides_data["routes"].items()))
    write_json(OVERRIDES_PATH, overrides_data)
    print(f"\nAppended to {OVERRIDES_PATH.relative_to(ROOT)}")

    # ── Append to routes.{collection}.json ──────────────────────────────
    routes_data["routes"].append(record)
    routes_data["route_count"] = len(routes_data["routes"])
    routes_data["exported_at"] = datetime.now(timezone.utc).isoformat()
    write_json(routes_path, routes_data)
    print(f"Appended to {routes_path.relative_to(ROOT)}")

    # ── Append to routes.{collection}.geojson ───────────────────────────
    geojson_data = load_json(geojson_path)
    geojson_data["features"].append(feature)
    geojson_data["properties"]["route_count"] = len(geojson_data["features"])
    geojson_data["properties"]["exported_at"] = datetime.now(timezone.utc).isoformat()
    write_json(geojson_path, geojson_data)
    print(f"Appended to {geojson_path.relative_to(ROOT)}")

    print(f"\nDone! Added \"{metadata['name']}\" ({tour_id}) to {args.collection}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
