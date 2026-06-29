// Shared map application for the per-collection route pages (run.html /
// skimo.html). Each page sets window.RUNSKITIROL_PAGE = { collection: "run" }
// before loading this script, so only that collection's data is fetched.

const PAGE = (typeof window !== "undefined" && window.RUNSKITIROL_PAGE) || {};
const COLLECTION = PAGE.collection === "skimo" ? "skimo" : "run";

const COLLECTION_LABELS = { run: "RUN", skimo: "SKIMO" };
const COLLECTION_STYLES = {
  run: { color: "#e35f28", weight: 4, opacity: 0.85 },
  skimo: { color: "#2077b4", weight: 4, opacity: 0.85 },
};
const SELECTED_STYLE = { weight: 7, opacity: 1 };

const ROUTES_JSON_URL = `data/routes.${COLLECTION}.json`;
const ROUTES_GEOJSON_URL = `data/routes.${COLLECTION}.geojson`;

// --- Mapbox / basemap configuration (shared with the baseline map) ---------

const RUNTIME_CONFIG =
  typeof window !== "undefined" && window.RUNSKITIROL_CONFIG
    ? window.RUNSKITIROL_CONFIG
    : {};
const MAPBOX_ACCESS_TOKEN = RUNTIME_CONFIG.mapboxToken ?? "";
const MAPBOX_STYLE = RUNTIME_CONFIG.mapboxStyle ?? "mapbox/outdoors-v12";
const hasMapboxToken =
  typeof MAPBOX_ACCESS_TOKEN === "string" && MAPBOX_ACCESS_TOKEN.trim().length > 0;

const BLANK_TILE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQAY3Y2wAAAAAElFTkSuQmCC";

const TIROL_CENTER = [47.253, 11.398];
const TIROL_ZOOM = 9;

const map = L.map("map", {
  attributionControl: true,
  zoomControl: true,
  scrollWheelZoom: true,
  preferCanvas: true,
});

const mapboxOutdoors = hasMapboxToken
  ? L.tileLayer(
      `https://api.mapbox.com/styles/v1/${MAPBOX_STYLE}/tiles/512/{z}/{x}/{y}{r}?access_token=${MAPBOX_ACCESS_TOKEN}`,
      {
        tileSize: 512,
        zoomOffset: -1,
        maxZoom: 19,
        errorTileUrl: BLANK_TILE,
        attribution:
          '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors <a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a>',
      }
    )
  : null;

const esriTopo = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
  {
    maxZoom: 19,
    maxNativeZoom: 19,
    errorTileUrl: BLANK_TILE,
    attribution:
      'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, USGS, and the GIS community',
  }
);

const openTopo = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
  maxNativeZoom: 17,
  maxZoom: 19,
  errorTileUrl: BLANK_TILE,
  attribution:
    'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
});

const osmStreets = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  errorTileUrl: BLANK_TILE,
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
});

(mapboxOutdoors ?? esriTopo).addTo(map);

const baseLayers = {};
if (mapboxOutdoors) baseLayers["Mapbox Outdoors"] = mapboxOutdoors;
baseLayers["Outdoor topo"] = esriTopo;
baseLayers["OpenTopoMap"] = openTopo;
baseLayers["Streets"] = osmStreets;
L.control.layers(baseLayers, null, { collapsed: true }).addTo(map);

map.setView(TIROL_CENTER, TIROL_ZOOM);

function attachAutoFallback(layer, threshold = 6) {
  if (!layer || layer === esriTopo) return;
  let errorCount = 0;
  layer.on("add", () => {
    errorCount = 0;
  });
  layer.on("tileerror", () => {
    errorCount += 1;
    if (errorCount >= threshold && map.hasLayer(layer)) {
      map.removeLayer(layer);
      esriTopo.addTo(map);
    }
  });
}
attachAutoFallback(mapboxOutdoors);
attachAutoFallback(openTopo);

// --- Route state -----------------------------------------------------------

// tolerance widens the clickable/tappable area around each line beyond its
// drawn width, so thin routes are still easy to select (especially on touch).
const canvasRenderer = L.canvas({ padding: 0.5, tolerance: 8 });
const routesLayer = L.geoJSON(null, {
  renderer: canvasRenderer,
  style: () => COLLECTION_STYLES[COLLECTION],
});
const layerById = new Map();
const recordById = new Map();
let allRoutes = [];
let activeLayer = null;

const ui = buildFilterBar();
wireFilterEvents();

loadRoutes();

// --- Data loading and rendering -------------------------------------------

async function loadRoutes() {
  try {
    const [routesData, geojsonData] = await Promise.all([
      fetchJson(ROUTES_JSON_URL),
      fetchJson(ROUTES_GEOJSON_URL),
    ]);

    allRoutes = routesData.routes || [];
    allRoutes.forEach((route) => recordById.set(route.id, route));

    routesLayer.addData(geojsonData);
    routesLayer.eachLayer((layer) => {
      const id = layer.feature && layer.feature.properties && layer.feature.properties.id;
      const route = recordById.get(id) || (layer.feature && layer.feature.properties);
      if (!route) return;
      layerById.set(route.id, layer);
      layer.bindPopup(renderPopup(route), { minWidth: 200 });
      layer.on("click", () => selectRoute(route.id));
    });
    routesLayer.addTo(map);

    fitToVisible(true);
    populateRegionOptions(allRoutes);
    initSliderRanges(allRoutes);
    applyStateFromUrl();
  } catch (error) {
    console.error(error);
    ui.count.textContent = "Route data could not be loaded. Run a local web server and reload.";
  }
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);
  return response.json();
}

// --- Filtering -------------------------------------------------------------

function readFilters() {
  const dmin = Number(ui.dmin.value);
  const dmax = Number(ui.dmax.value);
  const emin = Number(ui.emin.value);
  const emax = Number(ui.emax.value);
  return {
    q: ui.search.value.trim().toLowerCase(),
    dmin: dmin > Number(ui.dmin.min) ? dmin : null,
    dmax: dmax < Number(ui.dmax.max) ? dmax : null,
    emin: emin > Number(ui.emin.min) ? emin : null,
    emax: emax < Number(ui.emax.max) ? emax : null,
    region: ui.region.value,
    minTech: parseNumber(ui.rTech.value),
    minFitness: parseNumber(ui.rFitness.value),
    minDanger: parseNumber(ui.rDanger.value),
    minScenery: parseNumber(ui.rScenery.value),
    maxBusy: parseNumber(ui.rBusy.value),
  };
}

function routeMatches(route, f) {
  if (f.q && !String(route.name || "").toLowerCase().includes(f.q)) return false;

  const distance = Number(route.distance_km);
  if (f.dmin != null && !(distance >= f.dmin)) return false;
  if (f.dmax != null && !(distance <= f.dmax)) return false;

  const climb = Number(route.elevation_up_m);
  if (f.emin != null && !(climb >= f.emin)) return false;
  if (f.emax != null && !(climb <= f.emax)) return false;

  if (f.region && route.region !== f.region) return false;

  const r = route.ratings || {};
  if (f.minTech != null && !(r.technical_difficulty >= f.minTech)) return false;
  if (f.minFitness != null && !(r.fitness >= f.minFitness)) return false;
  if (f.minDanger != null && !(r.objective_danger >= f.minDanger)) return false;
  if (f.minScenery != null && !(r.landscape >= f.minScenery)) return false;
  if (f.maxBusy != null && !(r.busy <= f.maxBusy)) return false;

  return true;
}

function applyFilters(options = {}) {
  const filters = readFilters();
  let visible = 0;

  allRoutes.forEach((route) => {
    const layer = layerById.get(route.id);
    if (!layer) return;
    const show = routeMatches(route, filters);
    if (show) {
      if (!routesLayer.hasLayer(layer)) routesLayer.addLayer(layer);
      visible += 1;
    } else if (routesLayer.hasLayer(layer)) {
      if (activeLayer === layer) clearSelection();
      routesLayer.removeLayer(layer);
    }
  });

  ui.count.textContent = `Showing ${visible} of ${allRoutes.length} routes`;
  if (!options.skipUrl) writeStateToUrl(filters);
  if (options.fit) fitToVisible(false);
}

function fitToVisible(initial) {
  const bounds = routesLayer.getBounds();
  if (bounds && bounds.isValid()) {
    map.fitBounds(bounds, { padding: [28, 28] });
  } else if (initial) {
    map.setView(TIROL_CENTER, TIROL_ZOOM);
  }
}

// --- Selection and details -------------------------------------------------

function selectRoute(id, options = {}) {
  const layer = layerById.get(id);
  const route = recordById.get(id);
  if (!layer || !route) return;

  if (!routesLayer.hasLayer(layer)) routesLayer.addLayer(layer);
  if (activeLayer && activeLayer !== layer) {
    activeLayer.setStyle(COLLECTION_STYLES[COLLECTION]);
  }
  activeLayer = layer;
  layer.setStyle(SELECTED_STYLE);
  layer.bringToFront();

  if (options.zoom) {
    map.fitBounds(layer.getBounds(), { maxZoom: 14, padding: [40, 40] });
  }
  if (options.openPopup !== false) layer.openPopup();
}

function clearSelection() {
  if (activeLayer) {
    activeLayer.setStyle(COLLECTION_STYLES[COLLECTION]);
    activeLayer = null;
  }
}

function renderPopup(route) {
  const blog = route.blog_url
    ? `<a class="route-link" href="${escapeAttr(route.blog_url)}" target="_blank" rel="noopener">Blog post</a>`
    : "";
  const region = route.region
    ? `<span class="popup-region">${escapeHtml(route.region)}</span>`
    : "";
  const difficulty = route.difficulty
    ? `<span class="popup-difficulty">${escapeHtml(route.difficulty)}</span>`
    : "";
  const meta = [formatDistance(route), formatClimb(route)].join(" &middot; ");
  const ratings = renderRatings(route.ratings);
  return `
    <div class="route-popup">
      <div class="popup-header">${difficulty}${region}</div>
      <h3>${escapeHtml(route.name)}</h3>
      <p class="popup-meta">${meta}</p>
      ${ratings}
      <div class="popup-links">
        ${blog}
      </div>
    </div>
  `;
}

function renderRatings(ratings) {
  if (!ratings) return "";
  const items = [
    ["Tech", ratings.technical_difficulty],
    ["Fitness", ratings.fitness],
    ["Danger", ratings.objective_danger],
    ["Scenery", ratings.landscape],
    ["Busy", ratings.busy],
  ];
  const bars = items
    .filter(([, v]) => v != null)
    .map(([label, value]) => {
      const pct = (value / 10) * 100;
      return `<div class="rating-row"><span class="rating-label">${label}</span><span class="rating-bar"><span class="rating-fill" style="width:${pct}%"></span></span><span class="rating-val">${value}</span></div>`;
    })
    .join("");
  return `<div class="popup-ratings">${bars}</div>`;
}

// --- Filter bar UI ---------------------------------------------------------

function buildFilterBar() {
  const bar = document.getElementById("topbar");
  bar.classList.add("topbar");
  bar.innerHTML = `
    <div class="filters">
      <input id="f-search" type="search" placeholder="Search by name" aria-label="Search routes by name">
      <span class="range-slider" role="group" aria-label="Distance range (km)">
        <span class="range-slider__header">
          <label>Distance km</label>
          <span class="range-slider__values"><span id="f-dmin-val">0</span> – <span id="f-dmax-val">0</span></span>
        </span>
        <span class="range-slider__track">
          <input id="f-dmin" type="range" min="0" max="100" value="0" aria-label="Minimum distance km">
          <input id="f-dmax" type="range" min="0" max="100" value="100" aria-label="Maximum distance km">
        </span>
      </span>
      <span class="range-slider" role="group" aria-label="Climb range (m)">
        <span class="range-slider__header">
          <label>Climb m</label>
          <span class="range-slider__values"><span id="f-emin-val">0</span> – <span id="f-emax-val">0</span></span>
        </span>
        <span class="range-slider__track">
          <input id="f-emin" type="range" min="0" max="3000" value="0" aria-label="Minimum climb m">
          <input id="f-emax" type="range" min="0" max="3000" value="3000" aria-label="Maximum climb m">
        </span>
      </span>
      <select id="f-region" aria-label="Filter by region">
        <option value="">All regions</option>
      </select>
      <div class="rating-filters" role="group" aria-label="Rating filters (minimum)">
        <label class="rating-filters__label">Min ratings</label>
        <select id="f-tech" aria-label="Min technical difficulty"><option value="">Tech</option></select>
        <select id="f-fitness" aria-label="Min fitness"><option value="">Fitness</option></select>
        <select id="f-danger" aria-label="Min danger"><option value="">Danger</option></select>
        <select id="f-scenery" aria-label="Min scenery"><option value="">Scenery</option></select>
        <select id="f-busy" aria-label="Max busy"><option value="">Busy</option></select>
      </div>
      <button id="f-reset" type="button">Reset</button>
    </div>
    <span class="results-count" id="results-count" aria-live="polite"></span>
  `;

  const refs = {
    search: bar.querySelector("#f-search"),
    dmin: bar.querySelector("#f-dmin"),
    dmax: bar.querySelector("#f-dmax"),
    emin: bar.querySelector("#f-emin"),
    emax: bar.querySelector("#f-emax"),
    dminVal: bar.querySelector("#f-dmin-val"),
    dmaxVal: bar.querySelector("#f-dmax-val"),
    eminVal: bar.querySelector("#f-emin-val"),
    emaxVal: bar.querySelector("#f-emax-val"),
    region: bar.querySelector("#f-region"),
    rTech: bar.querySelector("#f-tech"),
    rFitness: bar.querySelector("#f-fitness"),
    rDanger: bar.querySelector("#f-danger"),
    rScenery: bar.querySelector("#f-scenery"),
    rBusy: bar.querySelector("#f-busy"),
    reset: bar.querySelector("#f-reset"),
    count: bar.querySelector("#results-count"),
  };

  [refs.rTech, refs.rFitness, refs.rDanger, refs.rScenery, refs.rBusy].forEach((sel) => {
    for (let i = 1; i <= 10; i++) {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = i;
      sel.appendChild(opt);
    }
  });

  return refs;
}

function syncSliderLabels() {
  ui.dminVal.textContent = ui.dmin.value;
  ui.dmaxVal.textContent = ui.dmax.value;
  ui.eminVal.textContent = ui.emin.value;
  ui.emaxVal.textContent = ui.emax.value;
}

function clampSliders(minEl, maxEl) {
  if (Number(minEl.value) > Number(maxEl.value)) {
    minEl.value = maxEl.value;
  }
}

function wireFilterEvents() {
  const onInput = debounce(() => applyFilters(), 200);
  ui.search.addEventListener("input", onInput);
  [ui.dmin, ui.dmax].forEach((el) =>
    el.addEventListener("input", () => {
      clampSliders(ui.dmin, ui.dmax);
      syncSliderLabels();
      onInput();
    })
  );
  [ui.emin, ui.emax].forEach((el) =>
    el.addEventListener("input", () => {
      clampSliders(ui.emin, ui.emax);
      syncSliderLabels();
      onInput();
    })
  );
  ui.region.addEventListener("change", () => applyFilters());
  [ui.rTech, ui.rFitness, ui.rDanger, ui.rScenery, ui.rBusy].forEach((sel) =>
    sel.addEventListener("change", () => applyFilters())
  );
  ui.reset.addEventListener("click", () => {
    ui.search.value = "";
    ui.dmin.value = ui.dmin.min;
    ui.dmax.value = ui.dmax.max;
    ui.emin.value = ui.emin.min;
    ui.emax.value = ui.emax.max;
    ui.region.value = "";
    [ui.rTech, ui.rFitness, ui.rDanger, ui.rScenery, ui.rBusy].forEach((s) => (s.value = ""));
    syncSliderLabels();
    applyFilters({ fit: true });
  });
}

function initSliderRanges(routes) {
  if (!routes.length) return;
  const distances = routes.map((r) => Number(r.distance_km)).filter(Number.isFinite);
  const climbs = routes.map((r) => Number(r.elevation_up_m)).filter(Number.isFinite);

  const floorTo = (v, step) => Math.floor(v / step) * step;
  const ceilTo = (v, step) => Math.ceil(v / step) * step;

  const dMin = floorTo(Math.min(...distances), 5);
  const dMax = ceilTo(Math.max(...distances), 5);
  const eMin = floorTo(Math.min(...climbs), 100);
  const eMax = ceilTo(Math.max(...climbs), 100);

  [ui.dmin, ui.dmax].forEach((el) => { el.min = dMin; el.max = dMax; });
  ui.dmin.value = dMin;
  ui.dmax.value = dMax;

  [ui.emin, ui.emax].forEach((el) => { el.min = eMin; el.max = eMax; });
  ui.emin.value = eMin;
  ui.emax.value = eMax;

  syncSliderLabels();
}

function populateRegionOptions(routes) {
  const regions = new Set();
  routes.forEach((route) => { if (route.region) regions.add(route.region); });
  const sorted = [...regions].sort((a, b) => a.localeCompare(b));
  sorted.forEach((region) => {
    const option = document.createElement("option");
    option.value = region;
    option.textContent = region;
    ui.region.appendChild(option);
  });
}

// --- URL state -------------------------------------------------------------

function applyStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  if (params.has("q")) ui.search.value = params.get("q");
  if (params.has("dmin")) ui.dmin.value = params.get("dmin");
  if (params.has("dmax")) ui.dmax.value = params.get("dmax");
  if (params.has("emin")) ui.emin.value = params.get("emin");
  if (params.has("emax")) ui.emax.value = params.get("emax");
  if (params.has("region")) ui.region.value = params.get("region");
  if (params.has("tech")) ui.rTech.value = params.get("tech");
  if (params.has("fitness")) ui.rFitness.value = params.get("fitness");
  if (params.has("danger")) ui.rDanger.value = params.get("danger");
  if (params.has("scenery")) ui.rScenery.value = params.get("scenery");
  if (params.has("busy")) ui.rBusy.value = params.get("busy");

  syncSliderLabels();
  applyFilters({ skipUrl: true });

  const slug = params.get("route");
  if (slug) {
    const route = allRoutes.find((r) => r.slug === slug);
    if (route) selectRoute(route.id, { zoom: true });
  }
}

function writeStateToUrl(filters) {
  const params = new URLSearchParams(window.location.search);
  const set = (key, value) => {
    if (value === "" || value == null) params.delete(key);
    else params.set(key, value);
  };
  set("q", ui.search.value.trim());
  set("dmin", filters.dmin);
  set("dmax", filters.dmax);
  set("emin", filters.emin);
  set("emax", filters.emax);
  set("region", filters.region);
  set("tech", filters.minTech);
  set("fitness", filters.minFitness);
  set("danger", filters.minDanger);
  set("scenery", filters.minScenery);
  set("busy", filters.maxBusy);
  const query = params.toString();
  const url = query ? `${window.location.pathname}?${query}` : window.location.pathname;
  window.history.replaceState(null, "", url);
}

// --- Formatting helpers ----------------------------------------------------

function parseNumber(value) {
  const trimmed = String(value).trim();
  if (trimmed === "") return null;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
}

function formatDistance(route) {
  const distance = Number(route.distance_km);
  return Number.isFinite(distance) ? `${distance.toFixed(1)} km` : "Distance unknown";
}

function formatClimb(route) {
  const climb = Number(route.elevation_up_m);
  return Number.isFinite(climb) ? `${Math.round(climb)} m climb` : "Climb unknown";
}

function debounce(fn, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
