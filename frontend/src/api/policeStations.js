import api from "./client.js";

/**
 * @param {{ query?: string, lat?: number, lng?: number, radius?: number }} params
 * @returns {Promise<Array<{ name: string, address: string, phone: string | null, lat: number, lon: number, lng: number, area: string, distanceKm: number | null, mapsUrl: string }>>}
 */
export async function searchPoliceStations(params = {}) {
  const { query, lat, lng, radius } = params;
  const { data } = await api.get("/police-stations/search", {
    params: {
      q: query,
      lat,
      lng,
      radius,
    },
  });
  return data;
}
