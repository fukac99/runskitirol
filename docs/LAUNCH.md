# Launch Plan: Squarespace Embed Replacement

## Overview

Replace the existing Komoot embeds on runskitirol.com (Squarespace) with the
custom interactive map hosted on GitHub Pages.

**Live URL:** `https://fukac99.github.io/runskitirol/`

---

## Where to Embed

### Main collection pages

These replace the existing Komoot embed on the `/trails` and `/skimo` landing
pages.

**Trails page** — full RUN map with filters:

```html
<iframe
  src="https://fukac99.github.io/runskitirol/run.html?embed=1"
  width="100%"
  height="600"
  frameborder="0"
  loading="lazy"
  style="border:0; border-radius:8px;"
></iframe>
```

**Skimo page** — full SKIMO map with filters:

```html
<iframe
  src="https://fukac99.github.io/runskitirol/skimo.html?embed=1"
  width="100%"
  height="600"
  frameborder="0"
  loading="lazy"
  style="border:0; border-radius:8px;"
></iframe>
```

> Without `?embed=1` the filter bar is shown. Use it for standalone pages;
> omit it for Squarespace embeds where the chrome would be distracting.

### Individual blog post pages

Each blog post can embed a single-route map that shows only that route.
Add a **Code Block** in Squarespace and paste the corresponding snippet.

Use `?route=<slug>&embed=1`. The slug must match the route's `slug` field in the
data. The full list is in the tables below.

**Example** (Judenkopf round):

```html
<iframe
  src="https://fukac99.github.io/runskitirol/run.html?route=judenkopf-round&embed=1"
  width="100%"
  height="400"
  frameborder="0"
  loading="lazy"
  style="border:0; border-radius:8px;"
></iframe>
```

---

## Single-Route Embed URLs

Each URL below can be used in a Squarespace Code Block as an iframe `src`.
They show a single route with no filter bar (embed mode).

### RUN routes (89)

| Route | Embed URL |
| ----- | --------- |
| A low altitude Achensee loop | `https://fukac99.github.io/runskitirol/run.html?route=a-low-altitude-achensee-loop&embed=1` |
| A round around Martinswand | `https://fukac99.github.io/runskitirol/run.html?route=a-round-around-martinswand&embed=1` |
| A short Halltal round | `https://fukac99.github.io/runskitirol/run.html?route=a-short-halltal-round&embed=1` |
| Achensee Loop | `https://fukac99.github.io/runskitirol/run.html?route=achensee-loop&embed=1` |
| Alm traverse from Mutters to Fulpmes | `https://fukac99.github.io/runskitirol/run.html?route=alm-traverse-from-mutters-to-fulpmes&embed=1` |
| Alpbach Ridge Round | `https://fukac99.github.io/runskitirol/run.html?route=alpbach-ridge-round&embed=1` |
| Berliner Höhenweg - Part 1/2 | `https://fukac99.github.io/runskitirol/run.html?route=berliner-h-henweg-part-1-2&embed=1` |
| Berliner Höhenweg - Part 2/2 | `https://fukac99.github.io/runskitirol/run.html?route=berliner-h-henweg-part-2-2&embed=1` |
| Brandjochspitze (2559m) - South Ridge | `https://fukac99.github.io/runskitirol/run.html?route=brandjochspitze-2559m-south-ridge&embed=1` |
| Debanttalrunde | `https://fukac99.github.io/runskitirol/run.html?route=debanttalrunde&embed=1` |
| East Karwendel loop with Lamsenspitze (2508m) | `https://fukac99.github.io/runskitirol/run.html?route=east-karwendel-loop-with-lamsenspitze-2508m&embed=1` |
| Easy round in Heiming | `https://fukac99.github.io/runskitirol/run.html?route=easy-round-in-heiming&embed=1` |
| Ehrwalder Sonnenspitze (2416m) | `https://fukac99.github.io/runskitirol/run.html?route=ehrwalder-sonnenspitze-2416m&embed=1` |
| Exploring Arztal | `https://fukac99.github.io/runskitirol/run.html?route=exploring-arztal&embed=1` |
| Fallbach Waterfall | `https://fukac99.github.io/runskitirol/run.html?route=fallbach-waterfall&embed=1` |
| Forcella del Lago Lagazuoi loop | `https://fukac99.github.io/runskitirol/run.html?route=forcella-del-lago-lagazuoi-loop&embed=1` |
| Freiungen Höhenweg | `https://fukac99.github.io/runskitirol/run.html?route=freiungen-h-henweg&embed=1` |
| From Wattens to Geier (2857m) and Lizum Reckner (2886m) and back | `https://fukac99.github.io/runskitirol/run.html?route=from-wattens-to-geier-2857m-and-lizum-reckner-2886m-and-back&embed=1` |
| Gahwinden Round | `https://fukac99.github.io/runskitirol/run.html?route=gahwinden-round&embed=1` |
| Gamsroas – 10-Summit Loop | `https://fukac99.github.io/runskitirol/run.html?route=gamsroas-10-summit-loop&embed=1` |
| Gratlspitze ridge and Kundl Klamm | `https://fukac99.github.io/runskitirol/run.html?route=gratlspitze-ridge-and-kundl-klamm&embed=1` |
| Grawa Alm to Blaue Lacke | `https://fukac99.github.io/runskitirol/run.html?route=grawa-alm-to-blaue-lacke&embed=1` |
| Guffertspitze (2194m) West Ridge | `https://fukac99.github.io/runskitirol/run.html?route=guffertspitze-2194m-west-ridge&embed=1` |
| Haidersee - Bruggeralm - Schafberg | `https://fukac99.github.io/runskitirol/run.html?route=haidersee-bruggeralm-schafberg&embed=1` |
| Jaufenkamm | `https://fukac99.github.io/runskitirol/run.html?route=jaufenkamm&embed=1` |
| Judenkopf round | `https://fukac99.github.io/runskitirol/run.html?route=judenkopf-round&embed=1` |
| Kalkköggel round through Alpenklubscharte | `https://fukac99.github.io/runskitirol/run.html?route=kalkk-ggel-round-through-alpenklubscharte&embed=1` |
| Karwendelmarsch with variations | `https://fukac99.github.io/runskitirol/run.html?route=karwendelmarsch-with-variations&embed=1` |
| Knappensteig Loop | `https://fukac99.github.io/runskitirol/run.html?route=knappensteig-loop&embed=1` |
| Lanser Alm - Sistranser Alm - Aldranser Alm | `https://fukac99.github.io/runskitirol/run.html?route=lanser-alm-sistranser-alm-aldranser-alm&embed=1` |
| Lechtaler Höhenweg - Day 1 | `https://fukac99.github.io/runskitirol/run.html?route=lechtaler-h-henweg-day-1&embed=1` |
| Lechtaler Höhenweg - Day 2 | `https://fukac99.github.io/runskitirol/run.html?route=lechtaler-h-henweg-day-2&embed=1` |
| Long valleys of Karwendel | `https://fukac99.github.io/runskitirol/run.html?route=long-valleys-of-karwendel&embed=1` |
| Loop around Obernberger See | `https://fukac99.github.io/runskitirol/run.html?route=loop-around-obernberger-see&embed=1` |
| Loop in Ötztal over Piccard Brucke | `https://fukac99.github.io/runskitirol/run.html?route=loop-in-tztal-over-piccard-brucke&embed=1` |
| Loop to Montscheinspitze | `https://fukac99.github.io/runskitirol/run.html?route=loop-to-montscheinspitze&embed=1` |
| Lüsener Fernerkogel (3298m) - North Ridge | `https://fukac99.github.io/runskitirol/run.html?route=l-sener-fernerkogel-3298m-north-ridge&embed=1` |
| Mittagskopf and Zäunlkopf loop from Scharnitz | `https://fukac99.github.io/runskitirol/run.html?route=mittagskopf-and-z-unlkopf-loop-from-scharnitz&embed=1` |
| Mountain round in Axamer Lizum | `https://fukac99.github.io/runskitirol/run.html?route=mountain-round-in-axamer-lizum&embed=1` |
| Naunspitze (1633m) South-west Ridge | `https://fukac99.github.io/runskitirol/run.html?route=naunspitze-1633m-south-west-ridge&embed=1` |
| Naviser Almenrunde | `https://fukac99.github.io/runskitirol/run.html?route=naviser-almenrunde&embed=1` |
| Nordkette East | `https://fukac99.github.io/runskitirol/run.html?route=nordkette-east&embed=1` |
| North ridge of Obernberg valley | `https://fukac99.github.io/runskitirol/run.html?route=north-ridge-of-obernberg-valley&embed=1` |
| Nürenberger Hütte to Sulzenau Hütte | `https://fukac99.github.io/runskitirol/run.html?route=n-renberger-h-tte-to-sulzenau-h-tte&embed=1` |
| Ridge of Dente del Sief | `https://fukac99.github.io/runskitirol/run.html?route=ridge-of-dente-del-sief&embed=1` |
| Round around Alta Badia ski resort | `https://fukac99.github.io/runskitirol/run.html?route=round-around-alta-badia-ski-resort&embed=1` |
| Salfeinssee Ridge Loop | `https://fukac99.github.io/runskitirol/run.html?route=salfeinssee-ridge-loop&embed=1` |
| Sass Dlacia to Cortina d'Ampezzo | `https://fukac99.github.io/runskitirol/run.html?route=sass-dlacia-to-cortina-d-ampezzo&embed=1` |
| Schlaitner Berge | `https://fukac99.github.io/runskitirol/run.html?route=schlaitner-berge&embed=1` |
| Schöberspitzen & Jochgrubenkopf loop | `https://fukac99.github.io/runskitirol/run.html?route=sch-berspitzen-jochgrubenkopf-loop&embed=1` |
| Sellrainer Hüttenrunde | `https://fukac99.github.io/runskitirol/run.html?route=sellrainer-h-ttenrunde&embed=1` |
| Serleskamm | `https://fukac99.github.io/runskitirol/run.html?route=serleskamm&embed=1` |
| Short technical loop in Wilder Kaiser | `https://fukac99.github.io/runskitirol/run.html?route=short-technical-loop-in-wilder-kaiser&embed=1` |
| South side of Rotwand (2806m) | `https://fukac99.github.io/runskitirol/run.html?route=south-side-of-rotwand-2806m&embed=1` |
| Stanser Joch Loop | `https://fukac99.github.io/runskitirol/run.html?route=stanser-joch-loop&embed=1` |
| Sunset at Kellerjoch | `https://fukac99.github.io/runskitirol/run.html?route=sunset-at-kellerjoch&embed=1` |
| Technical trails in Stubai west | `https://fukac99.github.io/runskitirol/run.html?route=technical-trails-in-stubai-west&embed=1` |
| Telfs Round | `https://fukac99.github.io/runskitirol/run.html?route=telfs-round&embed=1` |
| Thaurer Alm - Vintlalm - Rumer Alm | `https://fukac99.github.io/runskitirol/run.html?route=thaurer-alm-vintlalm-rumer-alm&embed=1` |
| The "Munde Runde" | `https://fukac99.github.io/runskitirol/run.html?route=the-munde-runde&embed=1` |
| The 12 Summits of Lake Achen | `https://fukac99.github.io/runskitirol/run.html?route=the-12-summits-of-lake-achen&embed=1` |
| The Alms around Elferspitze | `https://fukac99.github.io/runskitirol/run.html?route=the-alms-around-elferspitze&embed=1` |
| The Arnspitze Traverse | `https://fukac99.github.io/runskitirol/run.html?route=the-arnspitze-traverse&embed=1` |
| The Bierkette | `https://fukac99.github.io/runskitirol/run.html?route=the-bierkette&embed=1` |
| The Blaser Round | `https://fukac99.github.io/runskitirol/run.html?route=the-blaser-round&embed=1` |
| The Elmauer Halt and Elmauer Tor Loop | `https://fukac99.github.io/runskitirol/run.html?route=the-elmauer-halt-and-elmauer-tor-loop&embed=1` |
| The Gleirschklamm round | `https://fukac99.github.io/runskitirol/run.html?route=the-gleirschklamm-round&embed=1` |
| The Hohe Fürleg (2570m) Crossing | `https://fukac99.github.io/runskitirol/run.html?route=the-hohe-f-rleg-2570m-crossing&embed=1` |
| The Inntaler Höhenweg: West Part | `https://fukac99.github.io/runskitirol/run.html?route=the-inntaler-h-henweg-west-part&embed=1` |
| The Malgrübler to Largoz ridge | `https://fukac99.github.io/runskitirol/run.html?route=the-malgr-bler-to-largoz-ridge&embed=1` |
| The Pendling Express | `https://fukac99.github.io/runskitirol/run.html?route=the-pendling-express&embed=1` |
| The Schnapskofel | `https://fukac99.github.io/runskitirol/run.html?route=the-schnapskofel&embed=1` |
| The Seblaskreuz to Brennerspitze Ridge | `https://fukac99.github.io/runskitirol/run.html?route=the-seblaskreuz-to-brennerspitze-ridge&embed=1` |
| The Start of Stubaier Höhenweg | `https://fukac99.github.io/runskitirol/run.html?route=the-start-of-stubaier-h-henweg&embed=1` |
| The Unnutz Round | `https://fukac99.github.io/runskitirol/run.html?route=the-unnutz-round&embed=1` |
| The Ups Express | `https://fukac99.github.io/runskitirol/run.html?route=the-ups-express&embed=1` |
| The second half of Stubaier Höhenweg | `https://fukac99.github.io/runskitirol/run.html?route=the-second-half-of-stubaier-h-henweg&embed=1` |
| Toblacher Kreuz (2305m) from Lake Antorno | `https://fukac99.github.io/runskitirol/run.html?route=toblacher-kreuz-2305m-from-lake-antorno&embed=1` |
| Traverse over Gilfert (2506m) | `https://fukac99.github.io/runskitirol/run.html?route=traverse-over-gilfert-2506m&embed=1` |
| Tuxer Sonnenspitzen Express | `https://fukac99.github.io/runskitirol/run.html?route=tuxer-sonnenspitzen-express&embed=1` |
| Two summits from Maurach: Bärenkopf & Ebner Joch | `https://fukac99.github.io/runskitirol/run.html?route=two-summits-from-maurach-b-renkopf-ebner-joch&embed=1` |
| Venediger Höhenweg | `https://fukac99.github.io/runskitirol/run.html?route=venediger-h-henweg&embed=1` |
| Via Mandani | `https://fukac99.github.io/runskitirol/run.html?route=via-mandani&embed=1` |
| Vomperloch | `https://fukac99.github.io/runskitirol/run.html?route=vomperloch&embed=1` |
| Weißspitze Round | `https://fukac99.github.io/runskitirol/run.html?route=wei-spitze-round&embed=1` |
| Wennig - Handschuhspitze Round | `https://fukac99.github.io/runskitirol/run.html?route=wennig-handschuhspitze-round&embed=1` |
| Wettersteinrunde | `https://fukac99.github.io/runskitirol/run.html?route=wettersteinrunde&embed=1` |
| Zirler Schützensteig Loop | `https://fukac99.github.io/runskitirol/run.html?route=zirler-sch-tzensteig-loop&embed=1` |

### SKIMO routes (73)

| Route | Embed URL |
| ----- | --------- |
| Ampferstein (2556 m) from Axamer Lizum | `https://fukac99.github.io/runskitirol/skimo.html?route=ampferstein-2556-m-from-axamer-lizum&embed=1` |
| Archbrandköpfl (2058m) from Inzing | `https://fukac99.github.io/runskitirol/skimo.html?route=archbrandk-pfl-2058m-from-inzing&embed=1` |
| Axamer Kögele (2097m) | `https://fukac99.github.io/runskitirol/skimo.html?route=axamer-k-gele-2097m&embed=1` |
| Brandenburger Haus from Vent | `https://fukac99.github.io/runskitirol/skimo.html?route=brandenburger-haus-from-vent&embed=1` |
| Dawinkopf (2970m) from Grins | `https://fukac99.github.io/runskitirol/skimo.html?route=dawinkopf-2970m-from-grins&embed=1` |
| Egger Berg (2280 m) from Vinaders | `https://fukac99.github.io/runskitirol/skimo.html?route=egger-berg-2280-m-from-vinaders&embed=1` |
| Essener Spitze (3200m) from Obergurgel | `https://fukac99.github.io/runskitirol/skimo.html?route=essener-spitze-3200m-from-obergurgel&embed=1` |
| Forcella del Nevaio (2624m) from Lago Misurina | `https://fukac99.github.io/runskitirol/skimo.html?route=forcella-del-nevaio-2624m-from-lago-misurina&embed=1` |
| Fotscher Express | `https://fukac99.github.io/runskitirol/skimo.html?route=fotscher-express&embed=1` |
| Gaiskogel (2820m) North-face from Haggen | `https://fukac99.github.io/runskitirol/skimo.html?route=gaiskogel-2820m-north-face-from-haggen&embed=1` |
| Gilfert (2506 m) from Hausstatt | `https://fukac99.github.io/runskitirol/skimo.html?route=gilfert-2506-m-from-hausstatt&embed=1` |
| Glungezer (2677m) and Sonnenspitze (2639m) from Halsmarter | `https://fukac99.github.io/runskitirol/skimo.html?route=glungezer-2677m-and-sonnenspitze-2639m-from-halsmarter&embed=1` |
| Große Keilspitze (2739 m) from Dolomitenhütte | `https://fukac99.github.io/runskitirol/skimo.html?route=gro-e-keilspitze-2739-m-from-dolomitenh-tte&embed=1` |
| Grubenkopf (2337 m) from Obernberg | `https://fukac99.github.io/runskitirol/skimo.html?route=grubenkopf-2337-m-from-obernberg&embed=1` |
| Gsallkopf (3278m) from Kaunerberg | `https://fukac99.github.io/runskitirol/skimo.html?route=gsallkopf-3278m-from-kaunerberg&embed=1` |
| Hintere Sonnenwand (3106m) from St. Sigmund im Sellrain | `https://fukac99.github.io/runskitirol/skimo.html?route=hintere-sonnenwand-3106m-from-st-sigmund-im-sellrain&embed=1` |
| Hintere Ölgrubenspitze (3296m) from Kaunertal | `https://fukac99.github.io/runskitirol/skimo.html?route=hintere-lgrubenspitze-3296m-from-kaunertal&embed=1` |
| Hinterer Daunkopf (3225 m) from Mutterbergalm | `https://fukac99.github.io/runskitirol/skimo.html?route=hinterer-daunkopf-3225-m-from-mutterbergalm&embed=1` |
| Hirzer (2725 m) from Gasthof Hanneburger | `https://fukac99.github.io/runskitirol/skimo.html?route=hirzer-2725-m-from-gasthof-hanneburger&embed=1` |
| Hochtennspitze (2549m) from Axamer Lizum | `https://fukac99.github.io/runskitirol/skimo.html?route=hochtennspitze-2549m-from-axamer-lizum&embed=1` |
| Hoher Seeblaskogel (3235 m) from Lüsens | `https://fukac99.github.io/runskitirol/skimo.html?route=hoher-seeblaskogel-3235-m-from-l-sens&embed=1` |
| Innere Sommerwand (3082 m) from Franz Senn Hütte | `https://fukac99.github.io/runskitirol/skimo.html?route=innere-sommerwand-3082-m-from-franz-senn-h-tte&embed=1` |
| Jochgrubenkopf (2453m) from Kasern | `https://fukac99.github.io/runskitirol/skimo.html?route=jochgrubenkopf-2453m-from-kasern&embed=1` |
| K2 (3253m) from Mandarfen | `https://fukac99.github.io/runskitirol/skimo.html?route=k2-3253m-from-mandarfen&embed=1` |
| Kellerjoch (2344m) with North couloir from Kellerjochbahn | `https://fukac99.github.io/runskitirol/skimo.html?route=kellerjoch-2344m-with-north-couloir-from-kellerjochbahn&embed=1` |
| Kraspesspitze (2954m) and Weitkarspitze (2947m) through west couloirs from Kühtai to Haggen | `https://fukac99.github.io/runskitirol/skimo.html?route=kraspesspitze-2954m-and-weitkarspitze-2947m-through-west-couloirs-from-k-htai-to-haggen&embed=1` |
| Krovenzreib'n from Lager Walchen | `https://fukac99.github.io/runskitirol/skimo.html?route=krovenzreib-n-from-lager-walchen&embed=1` |
| Lampsenspitze (2875 m) from Praxmar | `https://fukac99.github.io/runskitirol/skimo.html?route=lampsenspitze-2875-m-from-praxmar&embed=1` |
| Largoz (2214 m) East face from Volderberg | `https://fukac99.github.io/runskitirol/skimo.html?route=largoz-2214-m-east-face-from-volderberg&embed=1` |
| Linker Fernerkogel (3277 m) from Mandarfen | `https://fukac99.github.io/runskitirol/skimo.html?route=linker-fernerkogel-3277-m-from-mandarfen&embed=1` |
| Lämpermahdspitze (2595 m) from Maria Waldrast | `https://fukac99.github.io/runskitirol/skimo.html?route=l-mpermahdspitze-2595-m-from-maria-waldrast&embed=1` |
| Längentaler Weißer Kogel (3217 m) from Lüsens | `https://fukac99.github.io/runskitirol/skimo.html?route=l-ngentaler-wei-er-kogel-3217-m-from-l-sens&embed=1` |
| Lüsener Spitze (3231 m) from Lüsens | `https://fukac99.github.io/runskitirol/skimo.html?route=l-sener-spitze-3231-m-from-l-sens&embed=1` |
| Lüsener Villerspitze (3027m) via Roter Kogel (2832m) from Lüsenstal | `https://fukac99.github.io/runskitirol/skimo.html?route=l-sener-villerspitze-3027m-via-roter-kogel-2832m-from-l-senstal&embed=1` |
| Mitterzeigerkopf (2629 m) from Kühtai | `https://fukac99.github.io/runskitirol/skimo.html?route=mitterzeigerkopf-2629-m-from-k-htai&embed=1` |
| Mittlere Schwenzerspitze (2882 m) from Obergurgl | `https://fukac99.github.io/runskitirol/skimo.html?route=mittlere-schwenzerspitze-2882-m-from-obergurgl&embed=1` |
| Monte Cevedale (3769 m) from Sulden | `https://fukac99.github.io/runskitirol/skimo.html?route=monte-cevedale-3769-m-from-sulden&embed=1` |
| Muttekopf (2774 m) from Hochimst | `https://fukac99.github.io/runskitirol/skimo.html?route=muttekopf-2774-m-from-hochimst&embed=1` |
| Mölser Sonnenspitze (2489 m) | `https://fukac99.github.io/runskitirol/skimo.html?route=m-lser-sonnenspitze-2489-m&embed=1` |
| Nördlicher Klammerschober (2448 m) through Mölstal | `https://fukac99.github.io/runskitirol/skimo.html?route=n-rdlicher-klammerschober-2448-m-through-m-lstal&embed=1` |
| Oberstkogel (2728 m) North Couloir from Praxmar | `https://fukac99.github.io/runskitirol/skimo.html?route=oberstkogel-2728-m-north-couloir-from-praxmar&embed=1` |
| Ochsenkopf (2148 m) and Bärenkopf (1991 m) from Pertisau | `https://fukac99.github.io/runskitirol/skimo.html?route=ochsenkopf-2148-m-and-b-renkopf-1991-m-from-pertisau&embed=1` |
| Ottenspitze-Ultenspitze (2179 m) from Schmirntal | `https://fukac99.github.io/runskitirol/skimo.html?route=ottenspitze-ultenspitze-2179-m-from-schmirntal&embed=1` |
| Padasterkogel (2301m) from Trins | `https://fukac99.github.io/runskitirol/skimo.html?route=padasterkogel-2301m-from-trins&embed=1` |
| Pfoner Kreuzjöchl (2640 m) from Oberellbögen | `https://fukac99.github.io/runskitirol/skimo.html?route=pfoner-kreuzj-chl-2640-m-from-oberellb-gen&embed=1` |
| Pirchkogel (2828m) from Kühtai | `https://fukac99.github.io/runskitirol/skimo.html?route=pirchkogel-2828m-from-k-htai&embed=1` |
| Rappenspitze (2223 m) and Lunstkopf (2142 m) from Pertisau | `https://fukac99.github.io/runskitirol/skimo.html?route=rappenspitze-2223-m-and-lunstkopf-2142-m-from-pertisau&embed=1` |
| Reither Spitze (2374m) from Seefeld | `https://fukac99.github.io/runskitirol/skimo.html?route=reither-spitze-2374m-from-seefeld&embed=1` |
| Rofanspitze (2259 m) from Maurach | `https://fukac99.github.io/runskitirol/skimo.html?route=rofanspitze-2259-m-from-maurach&embed=1` |
| Rofelewand (3353m) from Pitztal | `https://fukac99.github.io/runskitirol/skimo.html?route=rofelewand-3353m-from-pitztal&embed=1` |
| Rosskopf (2305m) from Scheibe | `https://fukac99.github.io/runskitirol/skimo.html?route=rosskopf-2305m-from-scheibe&embed=1` |
| Rosslaufspitze (2248m) round from Innerst | `https://fukac99.github.io/runskitirol/skimo.html?route=rosslaufspitze-2248m-round-from-innerst&embed=1` |
| Rostizkogel (3375m) from Mandarfen | `https://fukac99.github.io/runskitirol/skimo.html?route=rostizkogel-3375m-from-mandarfen&embed=1` |
| Ruderhofspitze (3473 m) Southface from Mutterbergalm | `https://fukac99.github.io/runskitirol/skimo.html?route=ruderhofspitze-3473-m-southface-from-mutterbergalm&embed=1` |
| Schafseitenspitze (2604m) from Navis | `https://fukac99.github.io/runskitirol/skimo.html?route=schafseitenspitze-2604m-from-navis&embed=1` |
| Seblaskreuz (2353m) from Oberbergtal | `https://fukac99.github.io/runskitirol/skimo.html?route=seblaskreuz-2353m-from-oberbergtal&embed=1` |
| Silleskogel (2418m) from Valsertal | `https://fukac99.github.io/runskitirol/skimo.html?route=silleskogel-2418m-from-valsertal&embed=1` |
| Spring days between Pitztal and Vernagthütte (2755m) - Day 1 | `https://fukac99.github.io/runskitirol/skimo.html?route=spring-days-between-pitztal-and-vernagth-tte-2755m-day-1&embed=1` |
| Spring days between Pitztal and Vernagthütte (2755m) - Day 2 | `https://fukac99.github.io/runskitirol/skimo.html?route=spring-days-between-pitztal-and-vernagth-tte-2755m-day-2&embed=1` |
| Steinernes Lamm (2528m) from Schmirn | `https://fukac99.github.io/runskitirol/skimo.html?route=steinernes-lamm-2528m-from-schmirn&embed=1` |
| Steinmandlspitze (2347m) from Fernpass | `https://fukac99.github.io/runskitirol/skimo.html?route=steinmandlspitze-2347m-from-fernpass&embed=1` |
| The Geier Round from Navis | `https://fukac99.github.io/runskitirol/skimo.html?route=the-geier-round-from-navis&embed=1` |
| The Orient Express | `https://fukac99.github.io/runskitirol/skimo.html?route=the-orient-express&embed=1` |
| The "Gacher Tod" Couloir from Halltal | `https://fukac99.github.io/runskitirol/skimo.html?route=the-gacher-tod-couloir-from-halltal&embed=1` |
| Traverse of Hinterer Brunnenkogel (3.325m) | `https://fukac99.github.io/runskitirol/skimo.html?route=traverse-of-hinterer-brunnenkogel-3-325m&embed=1` |
| Tullenkogel (2552m) from Assling | `https://fukac99.github.io/runskitirol/skimo.html?route=tullenkogel-2552m-from-assling&embed=1` |
| Vennspitze (2390 m) and Padauner Berg (2230 m) from Padaun | `https://fukac99.github.io/runskitirol/skimo.html?route=vennspitze-2390-m-and-padauner-berg-2230-m-from-padaun&embed=1` |
| Vorderer Wilder Turm (3177m) from Franz-Senn-Hütte | `https://fukac99.github.io/runskitirol/skimo.html?route=vorderer-wilder-turm-3177m-from-franz-senn-h-tte&embed=1` |
| Waze Spitze (3533m) from Pitztal | `https://fukac99.github.io/runskitirol/skimo.html?route=waze-spitze-3533m-from-pitztal&embed=1` |
| Westliche Schöberspitze (2580m) from Schmirn | `https://fukac99.github.io/runskitirol/skimo.html?route=westliche-sch-berspitze-2580m-from-schmirn&embed=1` |
| Winnebacher Weißkogel (3182 m) from Lüsens | `https://fukac99.github.io/runskitirol/skimo.html?route=winnebacher-wei-kogel-3182-m-from-l-sens&embed=1` |
| Zischgeles (3003m) from Praxmar | `https://fukac99.github.io/runskitirol/skimo.html?route=zischgeles-3003m-from-praxmar&embed=1` |
| Zuckerhütl (3507m) from Schaufeljoch | `https://fukac99.github.io/runskitirol/skimo.html?route=zuckerh-tl-3507m-from-schaufeljoch&embed=1` |

---

## Squarespace Integration Notes

### Adding a Code Block

1. In the Squarespace editor, click **+ Add Block** > **Code**.
2. Paste the `<iframe>` snippet.
3. Toggle **Display Source** off.
4. Save and preview.

### Responsive sizing

The `width="100%"` makes the iframe fill its container. Adjust `height` to suit
the page layout:

- **600px** — good default for the main collection pages (shows full Tirol).
- **400px** — compact for single-route embeds inside blog posts.
- Squarespace's fluid grid handles mobile automatically; the iframe scales with
  the column width.

### Mobile considerations

- Touch/pinch zoom works out of the box (Leaflet default).
- The embed mode hides the filter bar, preventing it from eating mobile screen space.
- Popups are positioned automatically by Leaflet and work on small screens.

---

## Launch Checklist

### Before launch

- [ ] Merge all open PRs to `main` (especially RUN-7 embed mode support).
- [ ] Verify GitHub Pages is enabled and serving from `main` (or `gh-pages`).
- [ ] If using Mapbox, ensure `config.js` is deployed (via GitHub Actions secret
      or a committed domain-restricted token).
- [ ] Open the live URLs and verify both collection maps load:
  - `https://fukac99.github.io/runskitirol/run.html`
  - `https://fukac99.github.io/runskitirol/skimo.html`
- [ ] Test a single-route embed in the browser:
  - `https://fukac99.github.io/runskitirol/run.html?route=judenkopf-round&embed=1`
- [ ] Test an invalid slug shows the "Route not found" fallback:
  - `https://fukac99.github.io/runskitirol/run.html?route=nonexistent&embed=1`
- [ ] Check desktop layout (filter bar, popups, base layer switcher).
- [ ] Check mobile layout (responsive width, touch zoom, popup readability).

### Switchover

- [ ] Replace the Komoot embed on the `/trails` landing page with the RUN iframe snippet.
- [ ] Replace the Komoot embed on the `/skimo` landing page with the SKIMO iframe snippet.
- [ ] Add single-route embeds to individual blog posts (use the table above).
- [ ] Publish and verify each page.

### After launch

- [ ] Spot-check 3–5 blog post embeds on desktop and mobile.
- [ ] Monitor for JavaScript errors in the browser console.
- [ ] Keep the old Komoot collection links noted for rollback.

---

## Rollback

If something goes wrong after switching:

1. **Squarespace**: edit each page and replace the `<iframe>` Code Block with the
   previous Komoot embed code. No code deployment needed.
2. **GitHub Pages**: the map app remains available at its URL regardless of what
   Squarespace shows, so there is no downside to leaving it deployed.
3. The old Komoot collection pages remain accessible at their original URLs — they
   are not affected by this change.

The rollback is purely a Squarespace content edit, making it low-risk and
instantly reversible.
