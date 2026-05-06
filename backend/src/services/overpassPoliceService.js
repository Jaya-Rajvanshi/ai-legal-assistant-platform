import axios from "axios";

/**
 * Public Overpass endpoints (rotate on failure — no API key).
 * @see https://wiki.openstreetmap.org/wiki/Overpass_API
 */
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.fr/api/interpreter",
];

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

/** Nominatim requires a descriptive User-Agent with app id + contact path. */
const HTTP_HEADERS = {
  "User-Agent":
    "NayaySetu/1.0 (Police Station Finder; +https://www.openstreetmap.org/copyright)",
  "Accept-Language": "en",
  Accept: "application/json",
};

function osmMapsUrl(lat, lon) {
  const z = 17;
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=${z}/${lat}/${lon}`;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function buildAddress(tags) {
  if (!tags) return "";
  if (tags["addr:full"]) return String(tags["addr:full"]);
  const street = [tags["addr:housenumber"], tags["addr:street"]]
    .filter(Boolean)
    .join(" ");
  const parts = [
    street || null,
    tags["addr:suburb"],
    tags["addr:city"],
    tags["addr:district"],
    tags["addr:postcode"],
    tags["addr:state"],
  ].filter(Boolean);
  return parts.join(", ");
}

function elementLatLon(el) {
  if (el.lat != null && el.lon != null) {
    return { lat: el.lat, lon: el.lon };
  }
  if (el.center?.lat != null && el.center?.lon != null) {
    return { lat: el.center.lat, lon: el.center.lon };
  }
  return null;
}

function elementName(tags) {
  return (
    tags?.name ||
    tags?.["name:en"] ||
    tags?.operator ||
    "Police station"
  );
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseOverpassJson(data) {
  if (data == null) return null;
  if (typeof data === "string") {
    const t = data.trim();
    if (t.startsWith("<") || t.startsWith("<!")) {
      return { error: "non_json", elements: [] };
    }
    try {
      return JSON.parse(t);
    } catch {
      return { error: "parse", elements: [] };
    }
  }
  if (typeof data === "object") return data;
  return null;
}

/**
 * Shrink huge geocode boxes (e.g. whole country) so Overpass stays fast and
 * less likely to return 429/504.
 */
function clampBbox(south, west, north, east, maxSpanDeg = 1.15) {
  let latSpan = north - south;
  let lonSpan = east - west;
  const midLat = (south + north) / 2;
  const midLon = (west + east) / 2;
  if (latSpan > maxSpanDeg) {
    latSpan = maxSpanDeg;
    south = midLat - latSpan / 2;
    north = midLat + latSpan / 2;
  }
  if (lonSpan > maxSpanDeg) {
    lonSpan = maxSpanDeg;
    west = midLon - lonSpan / 2;
    east = midLon + lonSpan / 2;
  }
  return { south, west, north, east, centerLat: midLat, centerLon: midLon };
}

async function postOverpassOnce(baseUrl, ql) {
  const body = new URLSearchParams();
  body.set("data", ql);

  return axios.post(baseUrl, body.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      ...HTTP_HEADERS,
    },
    timeout: 90000,
    responseType: "text",
    transformResponse: [(raw) => raw],
    validateStatus: () => true,
  });
}

async function runOverpass(ql) {
  let lastStatus = null;
  let lastDetail = null;

  for (const baseUrl of OVERPASS_ENDPOINTS) {
    try {
      const res = await postOverpassOnce(baseUrl, ql);
      lastStatus = res.status;

      if (res.status === 429 || res.status === 503 || res.status === 504) {
        lastDetail = `HTTP ${res.status}`;
        continue;
      }

      if (res.status >= 400) {
        lastDetail = `HTTP ${res.status}`;
        continue;
      }

      const data = parseOverpassJson(res.data);
      if (!data) {
        lastDetail = "empty response";
        continue;
      }

      if (data.error === "parse" || data.error === "non_json") {
        lastDetail = data.error;
        continue;
      }
      if (data.error) {
        lastDetail =
          typeof data.error === "string"
            ? data.error.slice(0, 200)
            : "overpass_error";
        continue;
      }

      if (!Array.isArray(data.elements)) {
        lastDetail = "invalid_overpass_payload";
        continue;
      }

      return data.elements;
    } catch (err) {
      lastDetail = err.code || err.message || "network_error";
      if (err.response?.status) lastStatus = err.response.status;
    }
  }

  const hint =
    lastStatus === 429 || lastStatus === 504 || lastStatus === 503
      ? "The free map service is busy or timing out. Please wait a minute and try again."
      : "Could not reach OpenStreetMap data servers from this machine. Check your network or try again later.";

  const err = new Error(
    lastDetail ? `${hint} (${lastDetail})` : hint
  );
  err.statusCode = 502;
  throw err;
}

async function nominatimSearch(q) {
  try {
    const { data, status } = await axios.get(NOMINATIM_URL, {
      params: {
        q,
        format: "json",
        limit: 1,
        addressdetails: 0,
        countrycodes: "in",
      },
      headers: HTTP_HEADERS,
      timeout: 30000,
      validateStatus: () => true,
    });

    if (status === 403 || status === 429) {
      return null;
    }
    if (status >= 400 || !Array.isArray(data) || data.length === 0) {
      return null;
    }
    return data[0];
  } catch {
    return null;
  }
}

/** Retry without country filter (postcodes / names near borders). */
async function nominatimSearchWide(q) {
  try {
    const { data, status } = await axios.get(NOMINATIM_URL, {
      params: {
        q,
        format: "json",
        limit: 1,
        addressdetails: 0,
      },
      headers: HTTP_HEADERS,
      timeout: 30000,
      validateStatus: () => true,
    });
    if (status >= 400 || !Array.isArray(data) || data.length === 0) {
      return null;
    }
    return data[0];
  } catch {
    return null;
  }
}

function bboxFromNominatim(hit) {
  if (hit.boundingbox && hit.boundingbox.length >= 4) {
    const south = parseFloat(hit.boundingbox[0]);
    const north = parseFloat(hit.boundingbox[1]);
    const west = parseFloat(hit.boundingbox[2]);
    const east = parseFloat(hit.boundingbox[3]);
    if ([south, north, west, east].every(Number.isFinite)) {
      const latPad = Math.max((north - south) * 0.15, 0.008);
      const lonPad = Math.max((east - west) * 0.15, 0.008);
      return clampBbox(
        south - latPad,
        west - lonPad,
        north + latPad,
        east + lonPad
      );
    }
  }
  const lat = parseFloat(hit.lat);
  const lon = parseFloat(hit.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const pad = 0.05;
  return clampBbox(lat - pad, lon - pad, lat + pad, lon + pad);
}

async function overpassPoliceInBbox(south, west, north, east) {
  const ql = `[out:json][timeout:50];
(
  node["amenity"="police"](${south},${west},${north},${east});
  way["amenity"="police"](${south},${west},${north},${east});
);
out center;
`;
  return runOverpass(ql);
}

async function overpassPoliceAround(lat, lon, radiusM) {
  const r = Math.min(Math.max(Math.round(radiusM), 500), 50000);
  const nLat = Number(lat);
  const nLon = Number(lon);
  if (!Number.isFinite(nLat) || !Number.isFinite(nLon)) {
    const err = new Error("Invalid coordinates for map search.");
    err.statusCode = 400;
    throw err;
  }
  const la = Number(nLat.toFixed(6));
  const lo = Number(nLon.toFixed(6));
  const ql = `[out:json][timeout:45];
(
  node["amenity"="police"](around:${r},${la},${lo});
  way["amenity"="police"](around:${r},${la},${lo});
);
out center;
`;
  return runOverpass(ql);
}

async function overpassPoliceInNamedArea(placeName) {
  const trimmed = String(placeName).trim().slice(0, 120);
  if (!trimmed) return [];
  const escaped = trimmed.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const ql = `[out:json][timeout:40];
area["name"="${escaped}"]->.searchArea;
(
  node["amenity"="police"](area.searchArea);
  way["amenity"="police"](area.searchArea);
);
out center;
`;
  return runOverpass(ql);
}

function elementsToFinderRows(elements, { userLat, userLng } = {}) {
  const dedupe = new Set();
  const out = [];

  for (const el of elements) {
    const ll = elementLatLon(el);
    if (!ll) continue;
    const tags = el.tags || {};
    const name = elementName(tags);
    const address = buildAddress(tags).trim();
    const area = tags["addr:suburb"] || tags["addr:city"] || "";
    const phone = tags.phone || tags["contact:phone"] || null;
    const lat = Number(ll.lat);
    const lon = Number(ll.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    const dedupeKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
    if (dedupe.has(dedupeKey)) continue;
    dedupe.add(dedupeKey);

    out.push({
      name,
      address,
      lat,
      lon,
      lng: lon,
      area,
      phone,
      mapsUrl: osmMapsUrl(lat, lon),
      distanceKm:
        userLat != null &&
        userLng != null &&
        Number.isFinite(userLat) &&
        Number.isFinite(userLng)
          ? haversineKm(userLat, userLng, lat, lon)
          : null,
    });
  }

  if (
    userLat != null &&
    userLng != null &&
    Number.isFinite(userLat) &&
    Number.isFinite(userLng)
  ) {
    out.sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
  }

  return out.slice(0, 80);
}

export async function searchPoliceStationsForFinder({
  query,
  lat,
  lng,
  radius,
}) {
  const q = query ? String(query).trim() : "";
  const userLat = lat;
  const userLng = lng;
  const radiusM = Number(radius) || 8000;

  let elements = [];

  const geocodeQuery = async (raw) => {
    let hit = await nominatimSearch(raw);
    if (!hit) {
      await sleep(1100);
      hit = await nominatimSearchWide(raw);
    }
    if (!hit && /^\d{5,7}$/.test(raw.replace(/\s/g, ""))) {
      await sleep(1100);
      hit = await nominatimSearchWide(`${raw.replace(/\s/g, "")}, India`);
    }
    if (!hit && raw.length > 1) {
      await sleep(1100);
      hit = await nominatimSearch(`${raw}, India`);
    }
    if (!hit) {
      await sleep(1100);
      hit = await nominatimSearchWide(`${raw}, India`);
    }
    return hit;
  };

  if (q && userLat != null && userLng != null) {
    const hit = await geocodeQuery(q);
    if (hit) {
      const bbox = bboxFromNominatim(hit);
      if (bbox) {
        try {
          elements = await overpassPoliceInBbox(
            bbox.south,
            bbox.west,
            bbox.north,
            bbox.east
          );
        } catch {
          elements = [];
        }
      }
    }
    if (elements.length === 0) {
      elements = await overpassPoliceAround(
        userLat,
        userLng,
        Math.min(radiusM, 25000)
      );
    }
  } else if (q) {
    const hit = await geocodeQuery(q);
    if (hit) {
      const bbox = bboxFromNominatim(hit);
      if (bbox) {
        try {
          elements = await overpassPoliceInBbox(
            bbox.south,
            bbox.west,
            bbox.north,
            bbox.east
          );
        } catch {
          elements = [];
        }
      }
      if (elements.length === 0) {
        const clat = parseFloat(hit.lat);
        const clon = parseFloat(hit.lon);
        if (Number.isFinite(clat) && Number.isFinite(clon)) {
          elements = await overpassPoliceAround(clat, clon, 22000);
        }
      }
      if (elements.length === 0 && bbox) {
        elements = await overpassPoliceAround(
          bbox.centerLat,
          bbox.centerLon,
          35000
        );
      }
    } else {
      try {
        elements = await overpassPoliceInNamedArea(q);
      } catch {
        elements = [];
      }
    }
  } else if (
    userLat != null &&
    userLng != null &&
    Number.isFinite(userLat) &&
    Number.isFinite(userLng)
  ) {
    elements = await overpassPoliceAround(userLat, userLng, radiusM || 5000);
  } else {
    const err = new Error(
      "Enter a city, area, pincode, or station name—or use your location."
    );
    err.statusCode = 400;
    throw err;
  }

  return elementsToFinderRows(elements, { userLat, userLng });
}

export async function findNearbyPoliceStations({
  lat,
  lng,
  radius = 5000,
}) {
  const la = Number(lat);
  const lo = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(lo)) {
    const err = new Error("Invalid coordinates");
    err.statusCode = 400;
    throw err;
  }
  const elements = await overpassPoliceAround(la, lo, radius);
  return elements
    .map((el) => {
      const ll = elementLatLon(el);
      const tags = el.tags || {};
      if (!ll) return null;
      return {
        name: elementName(tags),
        address: buildAddress(tags).trim() || "",
        location: { lat: ll.lat, lng: ll.lon },
      };
    })
    .filter(Boolean);
}
