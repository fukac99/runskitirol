const TIROL_CENTER = [47.253, 11.398];
const TIROL_ZOOM = 9;

// Mapbox configuration.
// The access token is provided at runtime via config.js (which is gitignored
// so the token never lands in the repository). Copy config.example.js to
// config.js and paste your token there. See README for setup and deployment.
// If no token is available, the map falls back to the free Esri basemap.
const RUNTIME_CONFIG =
  typeof window !== "undefined" && window.RUNSKITIROL_CONFIG
    ? window.RUNSKITIROL_CONFIG
    : {};
const MAPBOX_ACCESS_TOKEN = RUNTIME_CONFIG.mapboxToken ?? "";
const MAPBOX_STYLE = RUNTIME_CONFIG.mapboxStyle ?? "mapbox/outdoors-v12";

const hasMapboxToken =
  typeof MAPBOX_ACCESS_TOKEN === "string" && MAPBOX_ACCESS_TOKEN.trim().length > 0;

// 1x1 transparent PNG used in place of broken tiles so failed requests do not
// show error icons.
const BLANK_TILE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQAY3Y2wAAAAAElFTkSuQmCC";

const map = L.map("map", {
  attributionControl: true,
  zoomControl: true,
  scrollWheelZoom: true,
});

// Primary basemap: Mapbox Outdoors (topographic style tuned for trails).
// Served as 512px raster tiles, so tileSize/zoomOffset are set accordingly.
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

// Reliable, free, no-API-key topographic basemap. Acts as the fallback when no
// Mapbox token is configured or when Mapbox tiles fail to load.
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

// OpenTopoMap gives a nice hillshade/contour terrain look but is less reliable.
const openTopo = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
  maxNativeZoom: 17,
  maxZoom: 19,
  errorTileUrl: BLANK_TILE,
  attribution:
    'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
});

// Standard OpenStreetMap streets as a final, very reliable fallback.
const osmStreets = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  errorTileUrl: BLANK_TILE,
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
});

const defaultLayer = mapboxOutdoors ?? esriTopo;
defaultLayer.addTo(map);

const baseLayers = {};
if (mapboxOutdoors) {
  baseLayers["Mapbox Outdoors"] = mapboxOutdoors;
}
baseLayers["Outdoor topo"] = esriTopo;
baseLayers["OpenTopoMap"] = openTopo;
baseLayers["Streets"] = osmStreets;

L.control.layers(baseLayers, null, { collapsed: true }).addTo(map);

map.setView(TIROL_CENTER, TIROL_ZOOM);

// Auto-fallback: if a layer fails to deliver tiles (bad/expired token, quota,
// or an unreliable provider), swap to the reliable Esri topo layer so the map
// never stays blank.
function attachAutoFallback(layer, threshold = 6) {
  if (!layer || layer === esriTopo) {
    return;
  }
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
