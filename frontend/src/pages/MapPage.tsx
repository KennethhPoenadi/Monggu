import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { type NearbyDonation, DonationStatus } from "../types/donation";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapPageProps {
  user_id: number;
}

const MapPage: React.FC<MapPageProps> = ({ user_id }) => {
  const navigate = useNavigate();
  const [donations, setDonations] = useState<NearbyDonation[]>([]);
  const [claimedDonations, setClaimedDonations] = useState<NearbyDonation[]>([]);
  const [myDonations, setMyDonations] = useState<NearbyDonation[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchRadius, setSearchRadius] = useState(10);
  const [selectedDonation, setSelectedDonation] = useState<NearbyDonation | null>(null);

  // warna chip jarak
  const distanceChip = (d: number) =>
    d <= 2
      ? "bg-emerald-500/15 text-emerald-300"
      : d <= 5
      ? "bg-sky-500/15 text-sky-300"
      : d <= 10
      ? "bg-amber-500/15 text-amber-300"
      : "bg-rose-500/15 text-rose-300";

  // ambil lokasi user
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setUserLocation({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (err) => console.error("Error getting location:", err)
    );
  }, []);

  const loadNearbyDonations = useCallback(async () => {
    if (!userLocation) return;
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:8000/donations/nearby/?latitude=${userLocation.lat}&longitude=${userLocation.lng}&radius_km=${searchRadius}&user_id=${user_id}`
      );
      const data = await res.json();
      if (data.status === "success") setDonations(data.donations);
    } catch (e) {
      console.error("Error loading donations:", e);
    } finally {
      setLoading(false);
    }
  }, [userLocation, searchRadius, user_id]);

  const loadClaimedDonations = useCallback(async () => {
    try {
      const res = await fetch(
        `http://localhost:8000/donations/?user_id=${user_id}&active_only=false`
      );
      const data = await res.json();
      if (data.status === "success") {
        const claimed = data.donations.filter(
          (d: NearbyDonation & { receiver_user_id: number }) =>
            d.receiver_user_id === user_id && d.status === "Siap Dijemput"
        );
        setClaimedDonations(claimed);
      }
    } catch (e) {
      console.error("Error loading claimed donations:", e);
    }
  }, [user_id]);

  const loadMyDonations = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:8000/donations/user/${user_id}`);
      const data = await res.json();
      if (data.status === "success") {
        const mine = data.donations.filter(
          (d: NearbyDonation) => d.status === "Siap Dijemput"
        );
        setMyDonations(mine);
      }
    } catch (e) {
      console.error("Error loading my donations:", e);
    }
  }, [user_id]);

  useEffect(() => {
    if (userLocation) loadNearbyDonations();
    loadClaimedDonations();
    loadMyDonations();
  }, [userLocation, loadNearbyDonations, loadClaimedDonations, loadMyDonations]);

  const openInGoogleMaps = (lat: number, lng: number) => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`,
      "_blank"
    );
  };

  const claimDonation = async (donationId: number, userId: number) => {
    try {
      const res = await fetch(`http://localhost:8000/donations/${donationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: DonationStatus.SiapDijemput,
          receiver_user_id: userId,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        alert("Donation claimed successfully!");
        setSelectedDonation(null);
        loadNearbyDonations();
      }
    } catch (e) {
      console.error("Error claiming donation:", e);
      alert("Error claiming donation");
    }
  };

  useEffect(() => {
    if (!userLocation) return;

    const existing = L.DomUtil.get("map") as HTMLElement | null;
    if (existing) {
      // @ts-expect-error: _leaflet_id is used by Leaflet for internal tracking
      existing._leaflet_id = undefined;
    }

    const map = L.map("map").setView([userLocation.lat, userLocation.lng], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // available (default marker)
    donations.forEach((d) => {
      L.marker([d.latitude, d.longitude])
        .addTo(map)
        .bindPopup(
          `<strong>Available: ${d.type_of_food.join(", ")}</strong><br>Donor: ${
            d.donor_name
          }<br>Location: ${d.latitude.toFixed(4)}, ${d.longitude.toFixed(4)}`
        );
    });

    // claimed by me (green)
    claimedDonations.forEach((d) => {
      const greenIcon = L.divIcon({
        className: "custom-div-icon",
        html:
          "<div style='background:#10B981;width:25px;height:25px;border-radius:50%;border:2px solid white;'></div>",
        iconSize: [25, 25],
        iconAnchor: [12, 12],
      });
      L.marker([d.latitude, d.longitude], { icon: greenIcon })
        .addTo(map)
        .bindPopup(
          `<strong>🎯 Your Pickup: ${d.type_of_food.join(
            ", "
          )}</strong><br>Donor: ${d.donor_name}<br>Status: ${
            d.status
          }<br>Location: ${d.latitude.toFixed(4)}, ${d.longitude.toFixed(4)}`
        );
    });

    // my donations (orange)
    myDonations.forEach((d) => {
      const orangeIcon = L.divIcon({
        className: "custom-div-icon",
        html:
          "<div style='background:#F97316;width:25px;height:25px;border-radius:50%;border:2px solid white;'></div>",
        iconSize: [25, 25],
        iconAnchor: [12, 12],
      });
      L.marker([d.latitude, d.longitude], { icon: orangeIcon })
        .addTo(map)
        .bindPopup(
          `<strong>📦 Your Donation: ${d.type_of_food.join(
            ", "
          )}</strong><br>Receiver: ${
            d.receiver_name || "Waiting for pickup"
          }<br>Status: ${d.status}<br>Location: ${d.latitude.toFixed(
            4
          )}, ${d.longitude.toFixed(4)}`
        );
    });

    return () => {
      map.remove();
    };
  }, [userLocation, donations, claimedDonations, myDonations]);

  return (
    <div className="relative overflow-hidden min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
      {/* blob dekorasi */}
      <svg
        className="pointer-events-none absolute -right-24 -top-24 h-[36rem] w-[36rem] opacity-20 blur-3xl"
        viewBox="0 0 200 200"
        aria-hidden
      >
        <path
          d="M53.6,-58.2C67.2,-45.5,74.9,-24.7,73.8,-5.7C72.8,13.3,63.1,26.6,49.5,38.9C36,51.3,18,62.7,-0.3,63.1C-18.5,63.6,-36.9,53.1,-49.1,39.6C-61.3,26.1,-67.3,9.6,-65.7,-6.1C-64.1,-21.7,-54.8,-36.5,-42.1,-49.5C-29.4,-62.6,-14.7,-73.9,3.1,-77.9C20.9,-81.9,41.9,-78.6,53.6,-58.2Z"
          transform="translate(100 100)"
          className="fill-emerald-500/30"
        />
      </svg>

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* HEADER */}
        <section className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-8 shadow-xl backdrop-blur-xl">
          <div className="mb-6 text-center">
            <h1 className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-4xl font-extrabold text-transparent md:text-5xl">
              🗺️ Donation Map
            </h1>
            <p className="mt-2 text-slate-300">Find nearby food donations in your area</p>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center justify-center gap-4 md:flex-row">
            <div className="flex items-center gap-3">
              <label className="font-semibold text-slate-200">Search Radius:</label>
              <select
                value={searchRadius}
                onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
              >
                <option value={2}>2 km</option>
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={20}>20 km</option>
                <option value={50}>50 km</option>
              </select>
            </div>

            <button
              onClick={loadNearbyDonations}
              disabled={loading || !userLocation}
              className="rounded-xl bg-emerald-600 px-6 py-2 font-semibold text-white shadow-lg transition-all hover:bg-emerald-700 hover:shadow-emerald-600/20 disabled:opacity-50"
            >
              🔍 Refresh Search
            </button>
          </div>

          {/* Location status */}
          <div className="mt-6 text-center">
            {userLocation ? (
              <span className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500/15 px-4 py-2 text-emerald-300">
                📍 <span className="font-medium">Location detected</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-2xl bg-amber-500/15 px-4 py-2 text-amber-300">
                ⚠️ <span className="font-medium">Please enable location access</span>
              </span>
            )}
          </div>
        </section>

        {/* MAP */}
        <section className="mt-8 rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
          <h2 className="mb-4 text-center text-2xl font-bold text-slate-100">Interactive Map</h2>
          <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-3">
            <div id="map" className="h-96 rounded-xl" style={{ height: "400px", zIndex: 0 }} />
            <p className="mt-3 text-center text-sm text-slate-400">
              Shows nearby donations, your location, and distances
            </p>
          </div>
        </section>

        {/* LOADING */}
        {loading && (
          <div className="py-12 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-600 border-t-emerald-500" />
            <p className="mt-4 text-slate-300">Searching for donations...</p>
          </div>
        )}

        {/* AVAILABLE DONATIONS */}
        {!loading && (
          <section className="mt-8">
            <div className="mb-6 rounded-2xl border border-slate-700/60 bg-slate-900/70 p-8 text-center shadow-xl backdrop-blur-xl">
              <h2 className="mb-3 bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-3xl font-bold text-transparent">
                🍽️ Available Donations to Claim
              </h2>
              <p className="mb-4 text-slate-300">
                Food donations available near you (blue markers on the map)
              </p>
              <span className="inline-flex items-center gap-2 rounded-2xl bg-sky-500/15 px-4 py-2 text-sm text-sky-300">
                📍 <span className="font-medium">Found {donations.length} within {searchRadius} km</span>
              </span>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {donations.map((d) => {
                const isMine = d.status === "Siap Dijemput" && d.receiver_user_id === user_id;
                return (
                  <div
                    key={d.donation_id}
                    onClick={() => setSelectedDonation(d)}
                    className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                      isMine
                        ? "border-emerald-500/40 bg-slate-900/60 hover:bg-emerald-500/10"
                        : "border-slate-700/60 bg-slate-900/60 hover:border-emerald-500/60"
                    }`}
                  >
                    {/* overlay warna saat hover */}
                    <span
                      aria-hidden
                      className={`pointer-events-none absolute inset-0 -z-10 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
                        isMine
                          ? "bg-emerald-500/20"
                          : "bg-gradient-to-br from-emerald-400/10 via-teal-400/10 to-sky-400/10"
                      }`}
                    />
                    {/* glow halus */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -inset-px -z-10 rounded-2xl opacity-0 blur group-hover:opacity-100 group-hover:blur-md"
                      style={{
                        background:
                          "radial-gradient(600px circle at var(--x, 50%) var(--y, 50%), rgba(16,185,129,.15), transparent 40%)",
                      }}
                    />
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                            isMine
                              ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                              : "bg-gradient-to-r from-emerald-500 to-sky-500"
                          } transition-transform duration-300 group-hover:scale-110`}
                        >
                          <span className="text-xl text-white">{isMine ? "🎯" : "🍽️"}</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-100">
                            {d.type_of_food.join(", ")}
                          </h3>
                          <p
                            className={`text-sm font-medium ${
                              isMine ? "text-emerald-300" : "text-slate-400"
                            }`}
                          >
                            {isMine ? "Ready for pickup" : "Click for details"}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${distanceChip(
                            d.distance_km
                          )}`}
                        >
                          {d.distance_km.toFixed(1)} km
                        </span>
                        {isMine && (
                          <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-300">
                            Claimed by you
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="mb-3 line-clamp-2 text-slate-300">
                      Donor: {d.donor_name || "Anonymous"}
                    </p>

                    <div className="mb-3 flex items-center text-sm text-slate-400">
                      <span className="mr-2">📍</span>
                      <span className="truncate">
                        {d.latitude.toFixed(4)}, {d.longitude.toFixed(4)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">
                        Expires: {new Date(d.expires_at).toLocaleDateString()}
                      </span>
                      <span
                        className={`${isMine ? "text-emerald-300" : "text-sky-300"} font-medium`}
                      >
                        {isMine ? "Ready for pickup" : d.status}
                      </span>
                    </div>
                  </div>
                );
              })}

              {donations.length === 0 && !loading && (
                <div className="col-span-full rounded-2xl border border-slate-700/60 bg-slate-900/60 p-12 text-center shadow">
                  <div className="mb-4 text-7xl">🗺️</div>
                  <h3 className="mb-2 text-2xl font-bold text-slate-100">No donations found</h3>
                  <p className="text-slate-400">
                    Try expanding your search radius or check back later.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* CLAIMED BY ME */}
        {claimedDonations.length > 0 && (
          <section className="mt-8">
            <div className="mb-6 rounded-2xl border border-slate-700/60 bg-slate-900/70 p-8 text-center shadow-xl backdrop-blur-xl">
              <h2 className="mb-3 bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-3xl font-bold text-transparent">
                🎯 My Claimed Donations
              </h2>
              <p className="text-slate-300">
                Donations ready for pickup (green markers on the map)
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {claimedDonations.map((d) => (
                <div
                  key={d.donation_id}
                  className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-6 shadow-lg transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600">
                        <span className="text-xl text-white">🎯</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-100">
                          {d.type_of_food.join(", ")}
                        </h3>
                        <p className="text-sm font-medium text-emerald-300">
                          Ready for pickup
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                      {d.status}
                    </span>
                  </div>

                  <div className="mb-4 space-y-2 text-sm text-slate-300">
                    <p>
                      <strong className="text-slate-200">Donor:</strong>{" "}
                      {d.donor_name || "Anonymous"}
                    </p>
                    <p>
                      <strong className="text-slate-200">Location:</strong>{" "}
                      {d.latitude.toFixed(4)}, {d.longitude.toFixed(4)}
                    </p>
                    <p>
                      <strong className="text-slate-200">Expires:</strong>{" "}
                      {new Date(d.expires_at).toLocaleString()}
                    </p>
                  </div>

                  <button
                    onClick={() => openInGoogleMaps(d.latitude, d.longitude)}
                    className="w-full rounded-lg bg-emerald-600 py-3 font-semibold text-white transition-colors hover:bg-emerald-700"
                  >
                    🗺️ Navigate to Pickup
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* MY DONATIONS (DONOR) */}
        {myDonations.length > 0 && (
          <section className="mt-8">
            <div className="mb-6 rounded-2xl border border-slate-700/60 bg-slate-900/70 p-8 text-center shadow-xl backdrop-blur-xl">
              <h2 className="mb-3 bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-3xl font-bold text-transparent">
                📦 My Donations (Waiting for Pickup)
              </h2>
              <p className="text-slate-300">
                Your donations waiting for pickup (orange markers on map)
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {myDonations.map((d) => (
                <div
                  key={d.donation_id}
                  className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6 shadow-lg transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600">
                        <span className="text-xl text-white">📦</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-100">
                          {d.type_of_food.join(", ")}
                        </h3>
                        <p className="text-sm font-medium text-amber-300">
                          Waiting for pickup
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300">
                      {d.status}
                    </span>
                  </div>

                  <div className="mb-4 space-y-2 text-sm text-slate-300">
                    <p>
                      <strong className="text-slate-200">Receiver:</strong>{" "}
                      {d.receiver_name || "Waiting for claim"}
                    </p>
                    <p>
                      <strong className="text-slate-200">Pickup Location:</strong>{" "}
                      {d.latitude.toFixed(4)}, {d.longitude.toFixed(4)}
                    </p>
                    <p>
                      <strong className="text-slate-200">Expires:</strong>{" "}
                      {new Date(d.expires_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => openInGoogleMaps(d.latitude, d.longitude)}
                      className="w-full rounded-lg bg-amber-600 py-2 font-medium text-white transition-colors hover:bg-amber-700"
                    >
                      🗺️ View Pickup Location
                    </button>
                    <button
                      onClick={() =>
                        alert(
                          "QR Code feature: Show your QR code to receiver when they arrive for pickup"
                        )
                      }
                      className="w-full rounded-lg bg-sky-600 py-2 font-medium text-white transition-colors hover:bg-sky-700"
                    >
                      📱 Show QR for Pickup
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* DETAIL MODAL */}
        {selectedDonation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-slate-700/60 bg-slate-900/90 p-8 shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-2xl font-bold text-transparent">
                  Donation Details
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedDonation(null)}
                  className="p-1 text-slate-400 hover:text-slate-200"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-xl font-bold text-slate-100">
                    🍽️ {selectedDonation.type_of_food.join(", ")}
                  </h3>
                  <p className="text-slate-300">
                    Donor: {selectedDonation.donor_name || "Anonymous"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 py-2">
                  <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4 text-center">
                    <div className="mb-2 text-2xl">📏</div>
                    <div className="font-semibold text-slate-100">
                      {selectedDonation.distance_km.toFixed(1)} km
                    </div>
                    <div className="text-sm text-slate-400">Distance</div>
                  </div>
                  <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4 text-center">
                    <div className="mb-2 text-2xl">⏰</div>
                    <div className="font-semibold text-slate-100">
                      {Math.ceil(
                        (new Date(selectedDonation.expires_at).getTime() -
                          new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}{" "}
                      days
                    </div>
                    <div className="text-sm text-slate-400">Until expiry</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span>📍</span>
                    <span className="font-semibold text-slate-200">Pickup Location</span>
                  </div>
                  <p className="mb-3 text-slate-300">
                    {selectedDonation.latitude.toFixed(4)}, {selectedDonation.longitude.toFixed(4)}
                  </p>
                  <button
                    onClick={() =>
                      openInGoogleMaps(selectedDonation.latitude, selectedDonation.longitude)
                    }
                    className="w-full rounded-xl bg-sky-600 py-2 font-medium text-white transition-colors hover:bg-sky-700"
                  >
                    🗺️ Navigate in Google Maps
                  </button>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Status:</span>
                  <span className="font-medium text-sky-300">{selectedDonation.status}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Expires:</span>
                  <span className="font-medium text-slate-200">
                    {new Date(selectedDonation.expires_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {selectedDonation.status === DonationStatus.Diajukan && (
                <div className="flex gap-3 pt-6">
                  <button
                    onClick={() => claimDonation(selectedDonation.donation_id, user_id)}
                    className="flex-1 rounded-xl bg-emerald-600 py-3 font-semibold text-white shadow-lg transition-all hover:bg-emerald-700 hover:shadow-emerald-600/20"
                  >
                    🎯 Claim This Donation
                  </button>
                  <button
                    onClick={() => setSelectedDonation(null)}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-900/60 py-3 font-semibold text-slate-200 hover:bg-slate-900"
                  >
                    Close
                  </button>
                </div>
              )}

              {selectedDonation.status === DonationStatus.SiapDijemput &&
                selectedDonation.receiver_user_id === user_id && (
                  <div className="space-y-3 pt-6">
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                      <div className="mb-2 flex items-center gap-2 font-medium text-emerald-200">
                        ✅ Donation claimed successfully!
                      </div>
                      <p className="text-sm text-emerald-200/80">
                        Navigate to the location and scan the QR code from your profile to complete
                        the pickup.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() =>
                          openInGoogleMaps(selectedDonation.latitude, selectedDonation.longitude)
                        }
                        className="flex-1 rounded-xl bg-sky-600 py-3 font-semibold text-white shadow-lg transition-all hover:bg-sky-700"
                      >
                        🗺️ Navigate to Pickup
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDonation(null);
                          navigate("/profile");
                        }}
                        className="flex-1 rounded-xl bg-emerald-600 py-3 font-semibold text-white shadow-lg transition-all hover:bg-emerald-700"
                      >
                        📱 QR Scanner
                      </button>
                    </div>

                    <button
                      onClick={() => setSelectedDonation(null)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900/60 py-3 font-semibold text-slate-200 hover:bg-slate-900"
                    >
                      Close
                    </button>
                  </div>
                )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MapPage;
