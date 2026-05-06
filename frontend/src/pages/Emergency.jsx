import React, { useState } from "react";
import Layout from "../components/Layout.jsx";
import api from "../api/client.js";

const Emergency = () => {
  const [stations, setStations] = useState([]);
  const [loadingStations, setLoadingStations] = useState(false);
  const [error, setError] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState("");

  const getGoogleMapsUrl = (station) => {
    if (station.location?.lat && station.location?.lng) {
      return `https://www.google.com/maps/dir/?api=1&destination=${station.location.lat},${station.location.lng}`;
    }
    // Fallback: search by name and address
    const query = encodeURIComponent(`${station.name} ${station.address || ""}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  const handleFindPolice = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported in your browser.");
      setLocationError("");
      return;
    }

    setError("");
    setLocationError("");
    setLoadingStations(true);
    setStations([]);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });

          const { data } = await api.post("/emergency/police-stations", {
            lat: latitude,
            lng: longitude,
          });

          const fetchedStations = data.stations || [];
          setStations(fetchedStations);

          if (fetchedStations.length === 0) {
            setError(
              "No police stations found nearby. Please try again or search manually."
            );
          }
        } catch (err) {
          console.error(err);
          setError(
            err.response?.data?.message ||
              "Failed to fetch nearby stations. Please try again."
          );
        } finally {
          setLoadingStations(false);
        }
      },
      (geoError) => {
        console.error(geoError);
        setLoadingStations(false);

        // Handle specific geolocation errors
        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            setLocationError(
              "Location permission denied. Please enable location access in your browser settings to use this feature."
            );
            break;
          case geoError.POSITION_UNAVAILABLE:
            setLocationError(
              "Location information is unavailable. Please check your device settings."
            );
            break;
          case geoError.TIMEOUT:
            setLocationError(
              "Location request timed out. Please try again."
            );
            break;
          default:
            setLocationError("Could not access your location. Please try again.");
        }
      }
    );
  };

  return (
    <Layout>
      <div className="flex w-full flex-col gap-6">
        {/* Header Section */}
        <section className="mt-4">
          <h1 className="text-2xl font-semibold text-primary">
            Police Station Locator
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Use your current location to find nearby police stations quickly and
            access directions or contact details.
          </p>
        </section>

        {/* Find Nearby Button Section */}
        <section className="card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <h2 className="text-base font-semibold text-primary">
                Find Nearby Police Stations
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Click the button below to allow location access and discover
                police stations near you.
              </p>
            </div>
            <button
              onClick={handleFindPolice}
              disabled={loadingStations}
              className="btn-primary whitespace-nowrap"
            >
              {loadingStations ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Locating...
                </span>
              ) : (
                "Find Nearby"
              )}
            </button>
          </div>

          {/* Error Messages */}
          {locationError && (
            <div className="mt-4 rounded-md border border-alert bg-red-50 p-3">
              <p className="text-sm font-medium text-alert">
                Location Access Required
              </p>
              <p className="mt-1 text-xs text-slate-700">{locationError}</p>
            </div>
          )}

          {error && !locationError && (
            <div className="mt-4 rounded-md border border-alert bg-red-50 p-3">
              <p className="text-sm font-medium text-alert">Error</p>
              <p className="mt-1 text-xs text-slate-700">{error}</p>
            </div>
          )}
        </section>

        {/* Police Stations List */}
        {stations.length > 0 && (
          <section className="card">
            <h2 className="text-base font-semibold text-primary mb-4">
              Nearby Police Stations ({stations.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {stations.map((station, index) => (
                <div
                  key={`${station.name}-${index}`}
                  className="rounded-lg border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-slate-900">
                        {station.name}
                      </h3>
                      {station.address && (
                        <p className="mt-1 text-xs text-slate-600">
                          {station.address}
                        </p>
                      )}
                      {station.rating && (
                        <p className="mt-2 text-xs text-slate-500">
                          Rating: {station.rating}
                          {station.userRatingsTotal
                            ? ` (${station.userRatingsTotal} reviews)`
                            : ""}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <a
                      href={getGoogleMapsUrl(station)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary flex-1 text-center text-xs px-3 py-2"
                    >
                      Get Directions
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Google Map Embed Section */}
        {userLocation && stations.length > 0 && (
          <section className="card">
            <h2 className="text-base font-semibold text-primary mb-4">
              Map View
            </h2>
            <div className="w-full rounded-lg overflow-hidden border border-slate-200">
              <iframe
                width="100%"
                height="400"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed/v1/place?key=${
                  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""
                }&q=police+station&center=${userLocation.lat},${userLocation.lng}&zoom=13`}
                title="Nearby Police Stations Map"
              ></iframe>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Map showing your location and nearby police stations. Click on
              station cards above for detailed directions.
            </p>
          </section>
        )}

        {/* Empty State */}
        {!loadingStations &&
          stations.length === 0 &&
          !error &&
          !locationError && (
            <section className="card">
              <div className="text-center py-8">
                <svg
                  className="mx-auto h-12 w-12 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <p className="mt-3 text-sm font-medium text-slate-900">
                  Ready to find police stations
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Click &quot;Find Nearby&quot; to locate police stations near
                  your current location.
                </p>
              </div>
            </section>
          )}
      </div>
    </Layout>
  );
};

export default Emergency;
