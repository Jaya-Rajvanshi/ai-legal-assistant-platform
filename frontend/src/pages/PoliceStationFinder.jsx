import React, { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { searchPoliceStations } from "../api/policeStations.js";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";

const PoliceStationFinder = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [geoMessage, setGeoMessage] = useState("");
  const [userCoords, setUserCoords] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const runSearch = useCallback(
    async ({ text, lat, lng, radius } = {}) => {
      const q = text !== undefined ? String(text).trim() : query.trim();
      const useLat = lat ?? userCoords?.lat;
      const useLng = lng ?? userCoords?.lng;

      if (!q && (useLat == null || useLng == null)) {
        setError(
          "Enter a city, area, pincode, or station name—or use your location."
        );
        return;
      }

      setLoading(true);
      setError("");
      setHasSearched(true);
      try {
        const data = await searchPoliceStations({
          query: q || undefined,
          lat: useLat,
          lng: useLng,
          radius,
        });
        setResults(Array.isArray(data) ? data : []);
      } catch (e) {
        const msg =
          e.response?.data?.message ||
          e.message ||
          "Something went wrong. Please try again.";
        setError(msg);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [query, userCoords]
  );

  const handleUseLocation = () => {
    setGeoMessage("");
    if (!navigator.geolocation) {
      setGeoMessage("Location is not supported on this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        setGeoMessage("Location applied. Results will be sorted by distance.");
        await runSearch({
          text: query,
          lat: latitude,
          lng: longitude,
          radius: 12000,
        });
      },
      (err) => {
        // GeolocationPositionError: 1 = PERMISSION_DENIED (constants are not always on the instance)
        if (err && err.code === 1) {
          setGeoMessage(
            "Location permission was denied. You can still search by place name or pincode."
          );
        } else {
          setGeoMessage("Could not read your location. Try again or search by area.");
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  return (
    <Layout>
      <div className="flex w-full flex-col gap-6">
        <section className="mt-1">
          <Link
            to="/"
            className="text-xs font-medium text-primary hover:text-sky-700"
          >
            ← Back to dashboard
          </Link>
          <h1 className="mt-3 text-2xl font-semibold text-primary">
            Police Station Finder
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Find nearby police stations with address, contact details, and map
            links for quick access during emergencies. Search by city, locality,
            pincode, or station name. Optionally share your location to sort
            results by distance.
          </p>
        </section>

        <section className="card border-t-4 border-t-primary bg-white/90 backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="min-w-0 flex-1">
              <label
                htmlFor="police-search"
                className="text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                City / area / pincode / station name
              </label>
              <input
                id="police-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") runSearch();
                }}
                placeholder="e.g. Connaught Place, 110001, Cyberabad"
                className={`${inputClass} mt-1.5`}
                autoComplete="off"
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => runSearch()}
                disabled={loading}
                className="btn-primary shrink-0 px-6 disabled:opacity-60"
              >
                {loading ? "Searching…" : "Search"}
              </button>
              <button
                type="button"
                onClick={handleUseLocation}
                disabled={loading}
                className="btn-secondary shrink-0 disabled:opacity-60"
              >
                Use my location
              </button>
            </div>
          </div>
          {geoMessage && (
            <p className="mt-3 text-xs text-slate-600">{geoMessage}</p>
          )}
          {error && (
            <p
              className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-800"
              role="alert"
            >
              {error}
            </p>
          )}
        </section>

        <section aria-live="polite">
          {loading && (
            <div className="card flex items-center justify-center gap-3 border border-slate-200 bg-white/80 py-10 text-sm text-slate-600">
              <span
                className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"
                aria-hidden
              />
              Finding police stations…
            </div>
          )}

          {!loading && results.length === 0 && !error && !hasSearched && (
            <div className="card border border-dashed border-slate-200 bg-slate-50/80 text-center text-sm text-slate-600">
              <p className="font-medium text-slate-800">No results yet</p>
              <p className="mt-2">
                Try a search above, or use your location together with an area
                name for more accurate matches.
              </p>
            </div>
          )}

          {!loading && results.length === 0 && !error && hasSearched && (
            <div className="card border border-slate-200 bg-white/90 text-center text-sm text-slate-600">
              <p className="font-medium text-slate-800">No stations found</p>
              <p className="mt-2">
                Try a different spelling, a wider area, or enable location and
                search again.
              </p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {results.map((row, i) => (
                <article
                  key={`${row.name}-${row.lat}-${row.lon ?? row.lng}-${i}`}
                  className="card flex flex-col border-l-4 border-l-primary bg-white/90 shadow-sm transition-shadow hover:shadow-md"
                >
                  <h2 className="text-base font-semibold text-slate-900">
                    {row.name}
                  </h2>
                  {row.area ? (
                    <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-primary/80">
                      {row.area}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    {row.address || "Address not available"}
                  </p>
                  {row.distanceKm != null && (
                    <p className="mt-2 text-xs font-medium text-slate-700">
                      ≈ {row.distanceKm < 1
                        ? `${Math.round(row.distanceKm * 1000)} m away`
                        : `${row.distanceKm.toFixed(1)} km away`}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={row.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary px-4 py-2 text-xs"
                    >
                      Open in Maps
                    </a>
                    {row.phone ? (
                      <a
                        href={`tel:${row.phone.replace(/\s/g, "")}`}
                        className="btn-secondary px-4 py-2 text-xs"
                      >
                        Call
                      </a>
                    ) : null}
                  </div>
                  {row.phone ? (
                    <p className="mt-3 text-xs text-slate-500">
                      Phone:{" "}
                      <span className="font-medium text-slate-700">
                        {row.phone}
                      </span>
                    </p>
                  ) : (
                    <p className="mt-3 text-[11px] text-slate-400">
                      Phone number not listed for this place.
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default PoliceStationFinder;
