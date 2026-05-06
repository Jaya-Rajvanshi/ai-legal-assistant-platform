import { searchPoliceStationsForFinder } from "../services/overpassPoliceService.js";

const parseNum = (v) => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

export const searchPoliceStations = async (req, res) => {
  const qRaw =
    req.query.q ??
    req.query.query ??
    req.body?.q ??
    req.body?.query ??
    "";
  const q = String(qRaw).trim();

  const lat = parseNum(req.query.lat ?? req.body?.lat);
  const lng = parseNum(req.query.lng ?? req.body?.lng);
  const radius = parseNum(req.query.radius ?? req.body?.radius);

  if (!q && (lat === undefined || lng === undefined)) {
    return res.status(400).json({
      message:
        "Enter a city, area, pincode, or station name—or use your location to search nearby.",
    });
  }

  try {
    const results = await searchPoliceStationsForFinder({
      query: q || undefined,
      lat,
      lng,
      radius,
    });
    res.json(results);
  } catch (error) {
    console.error("police-stations search:", error);
    const status = error.statusCode || 500;
    res.status(status).json({
      message: error.message || "Unable to search police stations right now.",
    });
  }
};
