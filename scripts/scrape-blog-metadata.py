#!/usr/bin/env python3
"""Scrape blog post metadata from runskitirol.com and build route-overrides.json.

Extracts ratings (technical difficulty, fitness, objective danger, landscape,
busy), difficulty category, and blog-post tags for every published post on
/trails and /skimo.  Matches each post to a Komoot route ID by name and writes
a comprehensive route-overrides.json.
"""

from __future__ import annotations

import json
import re
import sys
import time
import urllib.request
from html.parser import HTMLParser
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
OVERRIDES_PATH = DATA_DIR / "route-overrides.json"

COLLECTIONS = [
    {"key": "run", "listing": "https://www.runskitirol.com/trails"},
    {"key": "skimo", "listing": "https://www.runskitirol.com/skimo"},
]

HEADERS = {
    "User-Agent": "runskitirol-route-map/0.2 (+https://www.runskitirol.com)",
    "Accept": "text/html,application/xhtml+xml",
}


def fetch_html(url: str) -> str:
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


# ---------------------------------------------------------------------------
# Step 1 – collect all blog-post URLs from listing pages
# ---------------------------------------------------------------------------

def scrape_listing_urls(base_url: str) -> list[dict[str, str]]:
    """Return [{"title": ..., "url": ...}, ...] for all posts on all pages."""
    posts: list[dict[str, str]] = []
    page = 1
    while True:
        url = base_url if page == 1 else f"{base_url}?page={page}"
        print(f"  listing page {page}: {url}")
        html = fetch_html(url)

        found = re.findall(
            r'<a[^>]+href="((?:https://www\.runskitirol\.com)?/(?:trails|skimo)/[a-z0-9][a-z0-9\-]*)"[^>]*>',
            html,
        )
        if not found:
            break

        for href in found:
            full = href if href.startswith("http") else f"https://www.runskitirol.com{href}"
            if full not in {p["url"] for p in posts}:
                posts.append({"url": full})

        page += 1
        time.sleep(0.3)

    return posts


# ---------------------------------------------------------------------------
# Step 2 – scrape individual blog-post pages
# ---------------------------------------------------------------------------

RATING_PATTERN = re.compile(
    r"(Technical difficulty|Fitness|Objective danger|Landscape|Busy)\s*:\s*(\d+)\s*/\s*10",
    re.IGNORECASE,
)

DIFFICULTY_PATTERN = re.compile(
    r"^\s*(easy|medium|hard|very hard|severe|trail running)\s*$",
    re.IGNORECASE | re.MULTILINE,
)


def extract_title(html: str) -> str | None:
    m = re.search(r"<h1[^>]*>(.*?)</h1>", html, re.DOTALL)
    if m:
        text = re.sub(r"<[^>]+>", "", m.group(1)).strip()
        return text
    return None


def extract_ratings(text: str) -> dict[str, int]:
    ratings: dict[str, int] = {}
    key_map = {
        "technical difficulty": "technical_difficulty",
        "fitness": "fitness",
        "objective danger": "objective_danger",
        "landscape": "landscape",
        "busy": "busy",
    }
    for m in RATING_PATTERN.finditer(text):
        key = key_map.get(m.group(1).lower())
        if key:
            ratings[key] = int(m.group(2))
    return ratings


def extract_difficulty(text: str) -> str | None:
    m = DIFFICULTY_PATTERN.search(text)
    if m:
        return m.group(1).strip().lower()
    return None


def extract_blog_tags(html: str) -> list[str]:
    """Extract tags from the bottom of the post (Squarespace tag links)."""
    tags: list[str] = []
    for m in re.finditer(
        r'<a[^>]+href="/(?:trails|skimo)\?(?:tag|category)=([^"&]+)"[^>]*>([^<]+)</a>',
        html,
        re.IGNORECASE,
    ):
        tag = m.group(2).strip().lower()
        if tag and tag not in tags:
            tags.append(tag)

    if not tags:
        tag_section = re.findall(
            r'class="[^"]*tag[^"]*"[^>]*>([^<]{2,30})</(?:a|span)>',
            html,
            re.IGNORECASE,
        )
        for t in tag_section:
            t = t.strip().lower()
            if t and t not in tags and t not in ("read more", "next", "previous"):
                tags.append(t)

    return sorted(set(tags))


def strip_html(html: str) -> str:
    return re.sub(r"<[^>]+>", " ", html)


def scrape_post(url: str) -> dict[str, Any]:
    html = fetch_html(url)
    text = strip_html(html)

    title = extract_title(html)
    ratings = extract_ratings(text)
    difficulty = extract_difficulty(text)
    blog_tags = extract_blog_tags(html)

    return {
        "url": url,
        "title": title,
        "ratings": ratings,
        "difficulty": difficulty,
        "tags": blog_tags,
    }


# ---------------------------------------------------------------------------
# Step 3 – match posts to Komoot route IDs
# ---------------------------------------------------------------------------

def normalize_name(name: str) -> str:
    import html as html_mod
    name = html_mod.unescape(name)
    name = name.lower()
    name = re.sub(r"[^\w\s]", "", name)
    name = re.sub(r"\s+", " ", name).strip()
    return name


def match_posts_to_routes(
    posts: list[dict[str, Any]],
    routes: list[dict[str, Any]],
) -> dict[str, dict[str, Any]]:
    """Return {route_id: post_data} for matched posts."""
    norm_routes: dict[str, list[dict[str, Any]]] = {}
    for r in routes:
        key = normalize_name(r["name"])
        norm_routes.setdefault(key, []).append(r)

    matched: dict[str, dict[str, Any]] = {}
    unmatched: list[str] = []

    for post in posts:
        title = post.get("title")
        if not title:
            unmatched.append(post["url"])
            continue

        norm_title = normalize_name(title)
        candidates = norm_routes.get(norm_title)

        if not candidates:
            for key, rs in norm_routes.items():
                if norm_title in key or key in norm_title:
                    candidates = rs
                    break

        if not candidates:
            title_words = set(norm_title.split())
            best_score = 0
            best_rs = None
            for key, rs in norm_routes.items():
                key_words = set(key.split())
                overlap = len(title_words & key_words)
                total = max(len(title_words), len(key_words))
                score = overlap / total if total else 0
                if score > best_score and score >= 0.6:
                    best_score = score
                    best_rs = rs
            if best_rs:
                candidates = best_rs

        if candidates:
            for r in candidates:
                matched[r["id"]] = post
        else:
            unmatched.append(f"{title} ({post['url']})")

    if unmatched:
        print(f"\n  WARNING: {len(unmatched)} unmatched posts:")
        for u in unmatched:
            print(f"    - {u}")

    return matched


# ---------------------------------------------------------------------------
# Step 4 – build route-overrides.json
# ---------------------------------------------------------------------------

def build_overrides(
    matched: dict[str, dict[str, Any]],
    existing: dict[str, dict[str, Any]],
) -> dict[str, dict[str, Any]]:
    overrides: dict[str, dict[str, Any]] = {}

    for route_id, post in matched.items():
        entry: dict[str, Any] = {}
        old = existing.get(route_id, {})

        entry["blog_url"] = post["url"]

        if post["ratings"]:
            entry["ratings"] = post["ratings"]

        if post["difficulty"]:
            entry["difficulty"] = post["difficulty"]

        tags = post.get("tags", [])
        if old.get("tags"):
            tags = old["tags"]
        if tags:
            entry["tags"] = tags

        if old.get("region"):
            entry["region"] = old["region"]
        if old.get("slug"):
            entry["slug"] = old["slug"]

        overrides[route_id] = entry

    for route_id, old in existing.items():
        if route_id not in overrides:
            overrides[route_id] = old

    return overrides


def main() -> int:
    all_routes: list[dict[str, Any]] = []
    for key in ("run", "skimo"):
        path = DATA_DIR / f"routes.{key}.json"
        with open(path) as f:
            data = json.load(f)
        all_routes.extend(data.get("routes", []))
    print(f"Loaded {len(all_routes)} routes from data files\n")

    existing_overrides: dict[str, dict[str, Any]] = {}
    if OVERRIDES_PATH.exists():
        with open(OVERRIDES_PATH) as f:
            existing_overrides = json.load(f).get("routes", {})

    all_posts: list[dict[str, Any]] = []
    for coll in COLLECTIONS:
        print(f"Scraping {coll['key']} listings...")
        listing = scrape_listing_urls(coll["listing"])
        print(f"  found {len(listing)} post URLs\n")

        print(f"Scraping {coll['key']} post details...")
        for i, entry in enumerate(listing):
            print(f"  [{i+1}/{len(listing)}] {entry['url']}")
            post = scrape_post(entry["url"])
            post["collection"] = coll["key"]
            all_posts.append(post)
            time.sleep(0.3)
        print()

    print(f"Total posts scraped: {len(all_posts)}")

    matched = match_posts_to_routes(all_posts, all_routes)
    print(f"Matched {len(matched)} posts to routes\n")

    overrides = build_overrides(matched, existing_overrides)

    payload = {
        "routes": dict(sorted(overrides.items())),
    }
    OVERRIDES_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    print(f"Wrote {OVERRIDES_PATH.relative_to(ROOT)} with {len(overrides)} entries")

    return 0


if __name__ == "__main__":
    sys.exit(main())
