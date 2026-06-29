// Shared map application for the per-collection route pages (run.html /
// skimo.html). Each page sets window.RUNSKITIROL_PAGE = { collection: "run" }
// before loading this script, so only that collection's data is fetched.

const PAGE = (typeof window !== "undefined" && window.RUNSKITIROL_PAGE) || {};
const COLLECTION = PAGE.collection === "skimo" ? "skimo" : "run";

const COLLECTION_LABELS = { run: "RUN", skimo: "SKIMO" };
const COLLECTION_STYLES = {
  run: { color: "#e35f28", weight: 3, opacity: 0.85 },
  skimo: { color: "#2077b4", weight: 3, opacity: 0.85 },
};
const SELECTED_STYLE = { weight: 6, opacity: 1 };

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

const canvasRenderer = L.canvas({ padding: 0.5 });
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
    populateTagOptions(allRoutes);
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
  return {
    q: ui.search.value.trim().toLowerCase(),
    dmin: parseNumber(ui.dmin.value),
    dmax: parseNumber(ui.dmax.value),
    emin: parseNumber(ui.emin.value),
    emax: parseNumber(ui.emax.value),
    tag: ui.tag.value,
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

  if (f.tag && !(Array.isArray(route.tags) && route.tags.includes(f.tag))) return false;

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
  return `
    <div class="route-popup">
      <span class="route-badge ${escapeHtml(route.collection)}">${escapeHtml(
        COLLECTION_LABELS[route.collection] || route.collection
      )}</span>
      <h3>${escapeHtml(route.name)}</h3>
      <p class="popup-meta">${formatDistance(route)} &middot; ${formatClimb(route)}</p>
      <div class="popup-links">
        <a class="route-link" href="${escapeAttr(route.komoot_url)}" target="_blank" rel="noopener">Komoot route</a>
        ${blog}
      </div>
    </div>
  `;
}

// --- Filter bar UI ---------------------------------------------------------

function buildFilterBar() {
  const bar = document.getElementById("topbar");
  bar.classList.add("topbar");
  bar.innerHTML = `
    <a class="brand" href="index.html" aria-label="Back to overview">Run.Ski.Tirol</a>
    <nav class="collection-switch" aria-label="Collection">
      <a href="run.html" data-collection="run">RUN</a>
      <a href="skimo.html" data-collection="skimo">SKIMO</a>
    </nav>
    <div class="filters">
      <input id="f-search" type="search" placeholder="Search by name" aria-label="Search routes by name">
      <span class="range" role="group" aria-label="Distance range (km)">
        <label>Distance km</label>
        <input id="f-dmin" type="number" min="0" inputmode="numeric" placeholder="min" aria-label="Minimum distance km">
        <span aria-hidden="true">–</span>
        <input id="f-dmax" type="number" min="0" inputmode="numeric" placeholder="max" aria-label="Maximum distance km">
      </span>
      <span class="range" role="group" aria-label="Climb range (m)">
        <label>Climb m</label>
        <input id="f-emin" type="number" min="0" inputmode="numeric" placeholder="min" aria-label="Minimum climb m">
        <span aria-hidden="true">–</span>
        <input id="f-emax" type="number" min="0" inputmode="numeric" placeholder="max" aria-label="Maximum climb m">
      </span>
      <select id="f-tag" aria-label="Filter by tag">
        <option value="">All tags</option>
      </select>
      <button id="f-reset" type="button">Reset</button>
    </div>
    <span class="results-count" id="results-count" aria-live="polite"></span>
  `;

  const active = bar.querySelector(`.collection-switch a[data-collection="${COLLECTION}"]`);
  if (active) active.classList.add("is-active");

  return {
    search: bar.querySelector("#f-search"),
    dmin: bar.querySelector("#f-dmin"),
    dmax: bar.querySelector("#f-dmax"),
    emin: bar.querySelector("#f-emin"),
    emax: bar.querySelector("#f-emax"),
    tag: bar.querySelector("#f-tag"),
    reset: bar.querySelector("#f-reset"),
    count: bar.querySelector("#results-count"),
  };
}

function wireFilterEvents() {
  const onInput = debounce(() => applyFilters(), 200);
  ui.search.addEventListener("input", onInput);
  [ui.dmin, ui.dmax, ui.emin, ui.emax].forEach((el) =>
    el.addEventListener("input", onInput)
  );
  ui.tag.addEventListener("change", () => applyFilters());
  ui.reset.addEventListener("click", () => {
    [ui.search, ui.dmin, ui.dmax, ui.emin, ui.emax].forEach((el) => (el.value = ""));
    ui.tag.value = "";
    applyFilters({ fit: true });
  });
}

function populateTagOptions(routes) {
  const tags = new Set();
  routes.forEach((route) => (route.tags || []).forEach((tag) => tags.add(tag)));
  const sorted = [...tags].sort((a, b) => a.localeCompare(b));
  sorted.forEach((tag) => {
    const option = document.createElement("option");
    option.value = tag;
    option.textContent = tag;
    ui.tag.appendChild(option);
  });
  if (sorted.length === 0) {
    ui.tag.disabled = true;
    ui.tag.title = "No tags available yet";
  }
}

// --- URL state -------------------------------------------------------------

function applyStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  if (params.has("q")) ui.search.value = params.get("q");
  if (params.has("dmin")) ui.dmin.value = params.get("dmin");
  if (params.has("dmax")) ui.dmax.value = params.get("dmax");
  if (params.has("emin")) ui.emin.value = params.get("emin");
  if (params.has("emax")) ui.emax.value = params.get("emax");
  if (params.has("tag")) ui.tag.value = params.get("tag");

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
  set("dmin", ui.dmin.value.trim());
  set("dmax", ui.dmax.value.trim());
  set("emin", ui.emin.value.trim());
  set("emax", ui.emax.value.trim());
  set("tag", filters.tag);
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
