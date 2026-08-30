// Per-route line colors for the map pages.
//
// Every route gets one color from a fixed categorical palette. The assignment
// is a greedy graph coloring: routes that run close to each other are pushed
// onto colors that are far apart perceptually, while routes in different
// valleys are free to reuse the same color.
//
// This file has no DOM or Leaflet dependency so the assignment can be checked
// outside the browser.

(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.RUNSKITIROL_COLORS = api;
})(typeof self !== "undefined" ? self : this, function () {
  // Saturated, mid-dark hues. Pale colors are avoided because the routes are
  // drawn over light topographic tiles (beige rock, white glaciers).
  //
  // Ten colors rather than twelve: adding more forces in near-duplicates such
  // as azure next to blue, and two overlapping routes in near-duplicate colors
  // read worse than two distant routes sharing a color. The teal is the brand
  // dark teal, which also sits far enough from the green.
  const PALETTE = [
    "#e6194b", // red
    "#4363d8", // blue
    "#f58231", // orange
    "#3cb44b", // green
    "#911eb4", // purple
    "#155e63", // dark teal
    "#9a6324", // brown
    "#f032e6", // magenta
    "#000075", // navy
    "#800000", // maroon
  ];

  // Distance at which a neighbouring route counts for half as much. Two routes
  // this far apart are rarely on screen together at trail-reading zoom.
  const PROXIMITY_KM = 8;

  // Beyond this the two routes are treated as unrelated and may share a color.
  // Without a hard cutoff the many far-away routes add up and swamp the few
  // neighbours that actually matter.
  const NEIGHBOUR_RADIUS_KM = 25;

  const KM_PER_DEGREE = 111.32;

  function srgbToLinear(channel) {
    return channel <= 0.04045
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  }

  // OKLab keeps euclidean distance close to perceived difference, which is what
  // "these two lines look alike" means here.
  function hexToOklab(hex) {
    const r = srgbToLinear(parseInt(hex.slice(1, 3), 16) / 255);
    const g = srgbToLinear(parseInt(hex.slice(3, 5), 16) / 255);
    const b = srgbToLinear(parseInt(hex.slice(5, 7), 16) / 255);

    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

    return [
      0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    ];
  }

  function oklabDistance(a, b) {
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  }

  const PALETTE_LAB = PALETTE.map(hexToOklab);

  // similarity[i][j] is 1 for identical colors and 0 for the most contrasting
  // pair in the palette, so the cost function below is palette-independent.
  const SIMILARITY = (() => {
    let widest = 0;
    for (let i = 0; i < PALETTE_LAB.length; i += 1) {
      for (let j = i + 1; j < PALETTE_LAB.length; j += 1) {
        widest = Math.max(widest, oklabDistance(PALETTE_LAB[i], PALETTE_LAB[j]));
      }
    }
    return PALETTE_LAB.map((a) =>
      PALETTE_LAB.map((b) => 1 - oklabDistance(a, b) / widest)
    );
  })();

  function boundsOfCoordinates(coordinates) {
    let south = Infinity;
    let west = Infinity;
    let north = -Infinity;
    let east = -Infinity;

    for (const point of coordinates) {
      const lng = Number(point[0]);
      const lat = Number(point[1]);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      if (lat < south) south = lat;
      if (lat > north) north = lat;
      if (lng < west) west = lng;
      if (lng > east) east = lng;
    }

    if (south === Infinity) return null;
    return { south, west, north, east };
  }

  // Gap between two bounding boxes, in kilometers, and 0 when they overlap.
  // Overlapping boxes are the case that matters most: those routes share a
  // valley and must not look alike.
  function boundsGapKm(a, b) {
    const latGap = Math.max(0, a.south - b.north, b.south - a.north);
    const lngGap = Math.max(0, a.west - b.east, b.west - a.east);
    const midLat = ((a.south + a.north) / 2 + (b.south + b.north) / 2) / 2;
    const lngScale = Math.cos((midLat * Math.PI) / 180);
    return Math.hypot(latGap * KM_PER_DEGREE, lngGap * KM_PER_DEGREE * lngScale);
  }

  // A neighbour's pull on the decision fades with distance, to nothing at the
  // cutoff. Squared falloff keeps the nearest routes clearly dominant.
  function proximityWeight(km) {
    if (km >= NEIGHBOUR_RADIUS_KM) return 0;
    const ratio = km / PROXIMITY_KM;
    return 1 / (1 + ratio * ratio);
  }

  /**
   * Assign a palette color to every GeoJSON route feature.
   *
   * @param {Array} features GeoJSON LineString features with properties.id.
   * @returns {Map<string, string>} route id -> hex color.
   */
  function assignRouteColors(features) {
    const routes = [];

    (features || []).forEach((feature) => {
      const id =
        feature && feature.properties && feature.properties.id != null
          ? String(feature.properties.id)
          : null;
      const coordinates =
        feature && feature.geometry && feature.geometry.coordinates;
      if (!id || !Array.isArray(coordinates)) return;
      const bounds = boundsOfCoordinates(coordinates);
      if (bounds) routes.push({ id, bounds });
    });

    // Sorting by id first makes every later tie-break deterministic, so a route
    // keeps its color between page loads.
    routes.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

    const gaps = routes.map(() => []);
    routes.forEach((route, i) => {
      for (let j = i + 1; j < routes.length; j += 1) {
        const km = boundsGapKm(route.bounds, routes[j].bounds);
        gaps[i][j] = km;
        gaps[j][i] = km;
      }
      gaps[i][i] = 0;
    });

    const neighbourCounts = routes.map((_, i) =>
      routes.reduce(
        (total, _route, j) =>
          i !== j && gaps[i][j] <= NEIGHBOUR_RADIUS_KM ? total + 1 : total,
        0
      )
    );

    const order = routes.map((_, i) => i);
    order.sort((a, b) => neighbourCounts[b] - neighbourCounts[a] || a - b);

    const assigned = new Array(routes.length).fill(-1);
    const uses = new Array(PALETTE.length).fill(0);
    const fairShare = Math.max(1, routes.length / PALETTE.length);

    order.forEach((index) => {
      let best = 0;
      let bestCost = Infinity;

      for (let candidate = 0; candidate < PALETTE.length; candidate += 1) {
        // Score the single worst confusion this color would create rather than
        // the sum: one hard-to-tell-apart neighbour is the whole problem, and a
        // sum would let a crowd of harmless distant routes outvote it.
        let worst = 0;
        let total = 0;
        let neighbours = 0;

        for (let other = 0; other < routes.length; other += 1) {
          const taken = assigned[other];
          if (taken < 0) continue;
          const weight = proximityWeight(gaps[index][other]);
          if (weight === 0) continue;
          const penalty = SIMILARITY[candidate][taken] * weight;
          if (penalty > worst) worst = penalty;
          total += penalty;
          neighbours += 1;
        }

        const cost =
          worst +
          // Small secondary terms: prefer fewer mediocre clashes overall, then
          // spread usage so the map does not drift toward a few colors.
          0.1 * (neighbours ? total / neighbours : 0) +
          0.05 * (uses[candidate] / fairShare);

        if (cost < bestCost) {
          bestCost = cost;
          best = candidate;
        }
      }

      assigned[index] = best;
      uses[best] += 1;
    });

    const colors = new Map();
    routes.forEach((route, i) => {
      colors.set(route.id, PALETTE[assigned[i]]);
    });
    return colors;
  }

  return { PALETTE, assignRouteColors, boundsGapKm, hexToOklab, oklabDistance };
});
