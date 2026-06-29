const TIROL_CENTER = [47.253, 11.398];
const TIROL_ZOOM = 9;

const map = L.map("map", {
  attributionControl: true,
  zoomControl: true,
  scrollWheelZoom: true,
});

L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
  maxNativeZoom: 17,
  maxZoom: 19,
  attribution:
    'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
}).addTo(map);

map.setView(TIROL_CENTER, TIROL_ZOOM);
