import { findNearbyPoliceStations } from "../services/overpassPoliceService.js";

export const getEmergencyHelplines = (req, res) => {
  // Static Indian emergency resources; adjust as needed
  const helplines = [
    {
      type: "Emergency",
      label: "All-India Emergency",
      number: "112",
    },
    {
      type: "Women Helpline",
      label: "Women Helpline (All India)",
      number: "1091",
    },
    {
      type: "Women Helpline (Domestic Violence)",
      label: "National Commission for Women",
      number: "181",
    },
    {
      type: "Cybercrime",
      label: "National Cyber Crime Reporting Portal",
      url: "https://cybercrime.gov.in",
    },
    {
      type: "Child Helpline",
      label: "CHILDLINE",
      number: "1098",
    },
  ];

  res.json({ helplines });
};

export const getNearbyPoliceStations = async (req, res) => {
  const { lat, lng, radius } = req.body;

  if (!lat || !lng) {
    return res
      .status(400)
      .json({ message: "Latitude and longitude are required" });
  }

  try {
    const stations = await findNearbyPoliceStations({
      lat,
      lng,
      radius: radius ? Number(radius) : 5000,
    });
    res.json({ stations });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message || "Failed to fetch nearby police stations",
    });
  }
};

