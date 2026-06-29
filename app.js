const TIROL_CENTER = [47.253, 11.398];
const TIROL_ZOOM = 9;

const map = L.map("map", {
  attributionControl: true,
  zoomControl: true,
  scrollWheelZoom: true,
});

L.tileLayer("https://mapsneu.wien.gv.at/basemap/geolandbasemap/normal/google3857/{z}/{y}/{x}.png", {
  maxZoom: 19,
  minZoom: 6,
  attribution: '<a href="https://www.basemap.at/">basemap.at</a>',
}).addTo(map);

map.setView(TIROL_CENTER, TIROL_ZOOM);
