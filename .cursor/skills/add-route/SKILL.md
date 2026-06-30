---
name: add-route
description: >-
  Add a new route to the runskitirol map. Use when the user says "add route",
  "new route", provides a Komoot tour URL, or mentions adding a blog post to
  the map.
---

# Add Route to Map

Add a new trail running or skimo route to the interactive map by fetching data
from Komoot and scraping metadata from the blog post.

## Workflow

### 1. Gather inputs

You need three things from the user:

| Input | How to get it | Example |
|-------|---------------|---------|
| **Komoot tour URL** | User provides it | `https://www.komoot.com/tour/3072813126` |
| **Blog post URL** | User provides it | `https://www.runskitirol.com/trails/judenkopf-round` |
| **Collection** | Infer from blog URL path: `/trails/` → `run`, `/skimo/` → `skimo` | `run` |

If the user only provides one URL, ask for the other. Extract the tour ID from
the Komoot URL (the number after `/tour/`).

### 2. Dry run first

Always do a dry run first so the user can verify the data before writing:

```bash
python .cursor/skills/add-route/scripts/add_route.py \
  --tour-id TOUR_ID \
  --blog-url BLOG_URL \
  --collection COLLECTION \
  --dry-run
```

Show the user the output. Check:
- **Ratings** were extracted (5 values: technical_difficulty, fitness, objective_danger, landscape, busy)
- **Region** was extracted (if null, ask the user or pass `--region NAME`)
- **Difficulty** was extracted (if null for skimo routes, ask the user)

If region is missing, re-run with `--region`:

```bash
python .cursor/skills/add-route/scripts/add_route.py \
  --tour-id TOUR_ID \
  --blog-url BLOG_URL \
  --collection COLLECTION \
  --region "Stubai" \
  --dry-run
```

### 3. Run for real

Once the user confirms the dry run looks good, run without `--dry-run`:

```bash
python .cursor/skills/add-route/scripts/add_route.py \
  --tour-id TOUR_ID \
  --blog-url BLOG_URL \
  --collection COLLECTION \
  --region "REGION"
```

This appends to three files (never modifies existing entries):
- `data/route-overrides.json`
- `data/routes.{collection}.json`
- `data/routes.{collection}.geojson`

### 4. Commit and push

Commit the changes and open a PR:

```bash
git checkout -b add-route-SLUG
git add data/
git commit -m "Add route: ROUTE_NAME"
git push -u origin add-route-SLUG
gh pr create --title "Add route: ROUTE_NAME" --body "Adds ROUTE_NAME to the COLLECTION map."
```

## Safety

The script **refuses to run** if the tour ID already exists in any data file.
This prevents accidental overwrites of existing routes.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Blog post 404 | Check the URL is correct and the post is published |
| Ratings not extracted | The blog post may not have the standard rating format; ask the user for ratings manually |
| Region is null | Pass `--region` flag with the region name |
| "already exists" error | The route is already in the map — no action needed |
