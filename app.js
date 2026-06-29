const ROUTES_JSON_URL = "data/routes.json";
const ROUTES_GEOJSON_URL = "data/routes.geojson";

const collectionStyles = {
  run: {
    color: "#e35f28",
    weight: 3,
    opacity: 0.82,
  },
  skimo: {
    color: "#2077b4",
    weight: 3,
    opacity: 0.82,
  },
};

const AUSTRIA_BOUNDS = L.latLngBounds(
  L.latLng(46.0, 9.4),
  L.latLng(49.2, 17.2)
);

const map = L.map("map", {
  maxBounds: AUSTRIA_BOUNDS.pad(0.35),
  minZoom: 6,
  scrollWheelZoom: true,
});

L.tileLayer("https://mapsneu.wien.gv.at/basemap/bmapgelaende/grau/google3857/{z}/{y}/{x}.jpeg", {
  maxZoom: 19,
  minZoom: 6,
  attribution: '<a href="https://www.basemap.at/">basemap.at</a>',
}).addTo(map);

const loadStatus = document.querySelector("#load-status");
const routeStats = document.querySelector("#route-stats");
const totalCount = document.querySelector("#total-count");
const runCount = document.querySelector("#run-count");
const skimoCount = document.querySelector("#skimo-count");
const selectedRoute = document.querySelector("#selected-route");
const routeList = document.querySelector("#route-list");

const routeLayers = new Map();
let activeLayer = null;

loadRoutes();

async function loadRoutes() {
  try {
    const [routesData, geojsonData] = await Promise.all([
      fetchJson(ROUTES_JSON_URL),
      fetchJson(ROUTES_GEOJSON_URL),
    ]);

    const routes = routesData.routes || [];
    const routeById = new Map(routes.map((route) => [route.id, route]));

    renderStats(routes, routesData.route_count);
    renderRouteList(routes);
    renderMap(geojsonData, routeById);

    loadStatus.textContent = `Loaded ${routes.length} routes from generated static data.`;
  } catch (error) {
    console.error(error);
    loadStatus.textContent = "Route data could not be loaded. Start a local web server and try again.";
  }
}

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status}`);
  }

  return response.json();
}

function renderStats(routes, exportedCount) {
  const counts = routes.reduce(
    (accumulator, route) => {
      accumulator[route.collection] = (accumulator[route.collection] || 0) + 1;
      return accumulator;
    },
    { run: 0, skimo: 0 }
  );

  totalCount.textContent = exportedCount || routes.length;
  runCount.textContent = counts.run || 0;
  skimoCount.textContent = counts.skimo || 0;
  routeStats.hidden = false;
}

function renderMap(geojsonData, routeById) {
  const routesLayer = L.geoJSON(geojsonData, {
    style: (feature) => {
      const route = routeById.get(feature.properties.id) || feature.properties;
      return collectionStyles[route.collection] || collectionStyles.run;
    },
    onEachFeature: (feature, layer) => {
      const route = routeById.get(feature.properties.id) || feature.properties;

      routeLayers.set(route.id, layer);
      layer.bindPopup(renderPopup(route));
      layer.on("click", () => selectRoute(route, layer));
      layer.on("mouseover", () => layer.setStyle({ weight: 5, opacity: 1 }));
      layer.on("mouseout", () => {
        if (layer !== activeLayer) {
          layer.setStyle(collectionStyles[route.collection] || collectionStyles.run);
        }
      });
    },
  }).addTo(map);

  const bounds = routesLayer.getBounds();
  if (bounds.isValid()) {
    map.fitBounds(bounds, { padding: [28, 28] });
  } else {
    map.setView([47.2692, 11.4041], 9);
  }
}

function renderRouteList(routes) {
  const fragment = document.createDocumentFragment();

  routes.forEach((route) => {
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = `
      <span class="route-list-name">${escapeHtml(route.name)}</span>
      <span class="route-list-meta">${formatCollection(route.collection)} · ${formatDistance(route)} · ${formatElevation(route)}</span>
    `;
    button.addEventListener("click", () => {
      const layer = routeLayers.get(route.id);
      selectRoute(route, layer);
      if (layer) {
        map.fitBounds(layer.getBounds(), { maxZoom: 13, padding: [32, 32] });
        layer.openPopup();
      }
    });
    fragment.appendChild(button);
  });

  routeList.replaceChildren(fragment);
}

function selectRoute(route, layer) {
  if (activeLayer) {
    const previousRoute = activeLayer.feature && activeLayer.feature.properties;
    activeLayer.setStyle(collectionStyles[previousRoute.collection] || collectionStyles.run);
  }

  activeLayer = layer || null;

  if (activeLayer) {
    activeLayer.setStyle({ weight: 6, opacity: 1 });
    activeLayer.bringToFront();
  }

  selectedRoute.innerHTML = `
    <span class="route-badge ${escapeHtml(route.collection)}">${escapeHtml(formatCollection(route.collection))}</span>
    <h2>Selected Route</h2>
    <h3>${escapeHtml(route.name)}</h3>
    <p class="route-meta">${formatDistance(route)} · ${formatElevation(route)}</p>
    <a class="route-link" href="${escapeAttribute(route.komoot_url)}" target="_blank" rel="noopener">Open on Komoot</a>
  `;
}

function renderPopup(route) {
  return `
    <div class="route-popup">
      <strong class="route-badge ${escapeHtml(route.collection)}">${escapeHtml(formatCollection(route.collection))}</strong>
      <h3>${escapeHtml(route.name)}</h3>
      <div class="popup-meta">${formatDistance(route)} · ${formatElevation(route)}</div>
      <a class="route-link" href="${escapeAttribute(route.komoot_url)}" target="_blank" rel="noopener">Komoot route</a>
    </div>
  `;
}

function formatCollection(collection) {
  return String(collection || "route").toUpperCase();
}

function formatDistance(route) {
  const distance = Number(route.distance_km);
  return Number.isFinite(distance) ? `${distance.toFixed(1)} km` : "Distance unknown";
}

function formatElevation(route) {
  const elevation = Number(route.elevation_up_m);
  return Number.isFinite(elevation) ? `${Math.round(elevation)} m up` : "Elevation unknown";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
