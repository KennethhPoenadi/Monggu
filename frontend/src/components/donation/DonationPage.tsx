import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  DonationStatus,
  type Donation,
  type DonationCreate,
  type NearbyDonation,
} from "../../types/donation";
import { type Product } from "../../types/product";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface DonationPageProps {
  user_id: number;
}

const STATUS_CHIP: Record<string, string> = {
  Diajukan: "bg-amber-400/15 text-amber-300 border border-amber-400/30",
  "Siap Dijemput": "bg-sky-400/15 text-sky-300 border border-sky-400/30",
  Diterima: "bg-emerald-400/15 text-emerald-300 border border-emerald-400/30",
};

// Helper component to handle map clicks
const LocationMarker: React.FC<{ setUserLocation: (location: { lat: number; lng: number }) => void }> = ({ setUserLocation }) => {
  useMapEvents({
    click(e) {
      setUserLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
};

const DonationPage: React.FC<DonationPageProps> = ({ user_id }) => {
  const navigate = useNavigate();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [nearbyDonations, setNearbyDonations] = useState<NearbyDonation[]>([]);
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [expiringProducts, setExpiringProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedDonationForQR, setSelectedDonationForQR] = useState<Donation | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string>("");

  // ===== cursor-follow glow helpers (tanpa CSS global)
  const handleGlowMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    el.style.setProperty("--x", `${x}px`);
    el.style.setProperty("--y", `${y}px`);
  };
  const handleGlowLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.removeProperty("--x");
    e.currentTarget.style.removeProperty("--y");
  };
  // =====

  // --- data loaders ---
  const loadMyDonations = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:8000/donations/user/${user_id}`);
      const data = await res.json();
      if (data.status === "success") setDonations(data.donations);
    } catch (e) {
      console.error("Error loading donations:", e);
    }
  }, [user_id]);

  const loadUserProducts = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:8000/products/user/${user_id}`);
      const data = await res.json();
      if (data.status === "success") setUserProducts(data.products);
    } catch (e) {
      console.error("Error loading products:", e);
    }
  }, [user_id]);

  const loadExpiringProducts = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:8000/products/user/${user_id}/expiring?days=3`);
      const data = await res.json();
      if (data.status === "success") setExpiringProducts(data.products);
    } catch (e) {
      console.error("Error loading expiring products:", e);
    }
  }, [user_id]);

  const loadNearbyDonations = useCallback(async () => {
    if (!userLocation) return;
    try {
      const res = await fetch(
        `http://localhost:8000/donations/nearby/?latitude=${userLocation.lat}&longitude=${userLocation.lng}&radius_km=10&user_id=${user_id}`
      );
      const data = await res.json();
      if (data.status === "success") setNearbyDonations(data.donations);
    } catch (e) {
      console.error("Error loading nearby donations:", e);
    }
  }, [userLocation, user_id]);

  // --- location + effects ---
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error("Error getting location:", err)
      );
    }
  }, []);

  useEffect(() => {
    loadMyDonations();
    loadUserProducts();
    loadExpiringProducts();
  }, [loadMyDonations, loadUserProducts, loadExpiringProducts]);

  useEffect(() => {
    if (userLocation) loadNearbyDonations();
  }, [userLocation, loadNearbyDonations]);

  // --- actions ---
  const handleCreateDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProducts.length === 0) return alert("Select at least one product.");
    if (!userLocation) return alert("Please allow location access.");

    setLoading(true);
    try {
      const payload: DonationCreate = {
        donor_user_id: user_id,
        type_of_food: selectedProducts.map((p) => p.product_name),
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        status: DonationStatus.Diajukan,
      };

      const res = await fetch("http://localhost:8000/donations/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.status === "success") {
        setShowCreateForm(false);
        setSelectedProducts([]);
        loadMyDonations();
      } else {
        alert(`Error: ${data.detail}`);
      }
    } catch (e) {
      console.error("Error creating donation:", e);
      alert("Failed to create donation");
    } finally {
      setLoading(false);
    }
  };

  const toggleProductSelection = (product: Product) => {
    setSelectedProducts((prev) =>
      prev.some((p) => p.product_id === product.product_id)
        ? prev.filter((p) => p.product_id !== product.product_id)
        : [...prev, product]
    );
  };

  const addExpiringProduct = (product: Product) => {
    setSelectedProducts((prev) =>
      prev.some((p) => p.product_id === product.product_id) ? prev : [...prev, product]
    );
  };

  const handleCancelDonation = async (donationId: number) => {
    if (!confirm("Cancel this donation? Products will be restored.")) return;
    try {
      const res = await fetch(`http://localhost:8000/donations/${donationId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.status === "success") {
        loadMyDonations();
        loadUserProducts();
      } else {
        alert(`Error: ${data.detail}`);
      }
    } catch (e) {
      console.error("Error cancelling donation:", e);
      alert("Failed to cancel donation");
    }
  };

  const handleShowQRCode = async (donation: Donation) => {
    try {
      const res = await fetch(`http://localhost:8000/donations/${donation.donation_id}/qrcode`);
      const data = await res.json();
      if (data.status === "success") {
        setQrCodeData(data.qr_code_base64);
        setSelectedDonationForQR(donation);
        setShowQRModal(true);
      } else {
        alert(`Error generating QR code: ${data.detail}`);
      }
    } catch (e) {
      console.error("Error generating QR code:", e);
      alert("Failed to generate QR code");
    }
  };

  const openInGoogleMaps = (lat: number, lng: number) =>
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`,
      "_blank"
    );

  const handleClaimDonation = async (donationId: number) => {
    try {
      const res = await fetch(`http://localhost:8000/donations/${donationId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donation_id: donationId, receiver_user_id: user_id }),
      });
      const data = await res.json();
      if (data.status === "success") {
        localStorage.setItem("claimedDonationId", donationId.toString());
        navigate("/profile");
      } else {
        alert(`Error: ${data.detail}`);
      }
    } catch (e) {
      console.error("Error claiming donation:", e);
      alert("Failed to claim donation.");
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-120px)] overflow-x-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100 overflow-hidden">
      {/* dekorasi blob */}
      <svg
        className="pointer-events-none absolute -right-20 -top-20 w-[36rem] h-[36rem] opacity-20 blur-3xl"
        viewBox="0 0 200 200"
        aria-hidden
      >
        <path
          d="M53.6,-58.2C67.2,-45.5,74.9,-24.7,73.8,-5.7C72.8,13.3,63.1,26.6,49.5,38.9C36,51.3,18,62.7,-0.3,63.1C-18.5,63.6,-36.9,53.1,-49.1,39.6C-61.3,26.1,-67.3,9.6,-65.7,-6.1C-64.1,-21.7,-54.8,-36.5,-42.1,-49.5C-29.4,-62.6,-14.7,-73.9,3.1,-77.9C20.9,-81.9,41.9,-78.6,53.6,-58.2Z"
          transform="translate(100 100)"
          className="fill-emerald-500/30"
        />
      </svg>

      <main className="mx-auto max-w-6xl px-6 py-10 space-y-8">
        {/* header card */}
        <section className="rounded-2xl border border-slate-700/60 bg-slate-900/70 backdrop-blur-xl p-4 sm:p-6 md:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Food Donations</h1>
              <p className="text-slate-300 mt-1 text-sm sm:text-base">Create, manage, and discover nearby donations.</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 sm:px-5 py-2 sm:py-2.5 font-semibold shadow-lg hover:shadow-emerald-500/20 text-sm sm:text-base whitespace-nowrap"
            >
              Create Donation
            </button>
          </div>
        </section>

        {expiringProducts.length > 0 && (
          <section className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5 text-amber-200">
            <p className="font-semibold">
              ⚠️ Products Expiring Soon — {expiringProducts.length} item(s)
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {expiringProducts.map((p) => (
                <button
                  key={p.product_id}
                  onClick={() => addExpiringProduct(p)}
                  className="rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-sm hover:bg-amber-300/20"
                >
                  + {p.product_name} (exp {new Date(p.expiry_date).toLocaleDateString()})
                </button>
              ))}
            </div>
          </section>
        )}

        {/* my donations */}
        <section className="rounded-2xl border border-slate-700/60 bg-slate-900/60 backdrop-blur p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold mb-4">My Donations</h2>
          {donations.length === 0 ? (
            <p className="text-slate-400">No donations yet.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {donations.map((d) => (
                <div
                  key={d.donation_id}
                  onMouseMove={handleGlowMove}
                  onMouseLeave={handleGlowLeave}
                  className="group relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5 shadow-lg transition-all duration-300 transform-gpu hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-500/60"
                >
                  {/* glow mengikuti kursor */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -inset-px -z-10 opacity-0 blur group-hover:opacity-100 group-hover:blur-md"
                    style={{
                      background:
                        "radial-gradient(600px circle at var(--x, 50%) var(--y, 50%), rgba(16,185,129,.15), transparent 40%)",
                    }}
                  />
                  <div className="mb-3 flex items-center justify-between">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        STATUS_CHIP[d.status] ||
                        "bg-slate-700/50 text-slate-200 border border-slate-600"
                      }`}
                    >
                      {d.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm">
                    <p className="text-slate-300">
                      <span className="text-slate-400">Foods:</span> {d.type_of_food.join(", ")}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span className="text-slate-300 text-xs sm:text-sm">
                        <span className="text-slate-400">Location:</span>{" "}
                        {d.latitude.toFixed(4)}, {d.longitude.toFixed(4)}
                      </span>
                      <button
                        onClick={() => openInGoogleMaps(d.latitude, d.longitude)}
                        className="rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-3 py-1 text-xs font-semibold text-white hover:from-sky-600 hover:to-blue-700 shadow-md hover:shadow-lg whitespace-nowrap self-start"
                        title="Navigate in Google Maps"
                      >
                        🗺️ Navigate
                      </button>
                    </div>
                    <p className="text-slate-400">
                      <strong className="text-slate-300">Created:</strong>{" "}
                      {new Date(d.created_at).toLocaleString()}
                    </p>
                    <p className="text-slate-400">
                      <strong className="text-slate-300">Expires:</strong>{" "}
                      {new Date(d.expires_at).toLocaleString()}
                    </p>
                    {d.receiver_name && (
                      <p className="text-slate-400">
                        <strong className="text-slate-300">Receiver:</strong> {d.receiver_name}
                      </p>
                    )}
                  </div>

                  {d.status === "Diajukan" && (
                    <button
                      onClick={() => handleCancelDonation(d.donation_id)}
                      className="mt-4 w-full rounded-lg bg-rose-600 py-2 text-sm font-semibold hover:bg-rose-700"
                    >
                      Cancel Donation
                    </button>
                  )}

                  {d.status === "Siap Dijemput" && (
                    <button
                      onClick={() => handleShowQRCode(d)}
                      className="mt-4 w-full rounded-lg bg-emerald-600 py-2 text-sm font-semibold hover:bg-emerald-700"
                    >
                      Show QR Code for Pickup
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* nearby donations */}
        <section className="rounded-2xl border border-slate-700/60 bg-slate-900/60 backdrop-blur p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold mb-4">Nearby Donations</h2>
          {nearbyDonations.length === 0 ? (
            <p className="text-slate-400">No nearby donations found.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {nearbyDonations.map((d) => (
                <div
                  key={d.donation_id}
                  onMouseMove={handleGlowMove}
                  onMouseLeave={handleGlowLeave}
                  className="group relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5 shadow-lg transition-all duration-300 transform-gpu hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-500/60"
                >
                  {/* glow mengikuti kursor */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -inset-px -z-10 opacity-0 blur group-hover:opacity-100 group-hover:blur-md"
                    style={{
                      background:
                        "radial-gradient(600px circle at var(--x, 50%) var(--y, 50%), rgba(16,185,129,.15), transparent 40%)",
                    }}
                  />
                  <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold w-fit ${
                        STATUS_CHIP[d.status] ||
                        "bg-slate-700/50 text-slate-200 border border-slate-600"
                      }`}
                    >
                      {d.status}
                    </span>
                    <span className="text-xs text-slate-400">
                      {d.distance_km.toFixed(1)} km away
                    </span>
                  </div>

                  <div className="space-y-1 text-sm">
                    <p className="text-slate-300">
                      <span className="text-slate-400">Foods:</span> {d.type_of_food.join(", ")}
                    </p>
                    <p className="text-slate-300">
                      <span className="text-slate-400">Donor:</span> {d.donor_name || "Anonymous"}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span className="text-slate-300 text-xs sm:text-sm">
                        <span className="text-slate-400">Location:</span>{" "}
                        {d.latitude.toFixed(4)}, {d.longitude.toFixed(4)}
                      </span>
                      <button
                        onClick={() => openInGoogleMaps(d.latitude, d.longitude)}
                        className="rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-3 py-1 text-xs font-semibold text-white hover:from-sky-600 hover:to-blue-700 shadow-md hover:shadow-lg whitespace-nowrap self-start"
                      >
                        🗺️ Navigate
                      </button>
                    </div>
                    <p className="text-slate-400">
                      <strong className="text-slate-300">Expires:</strong>{" "}
                      {new Date(d.expires_at).toLocaleString()}
                    </p>
                  </div>

                  {d.status === "Diajukan" && (
                    <button
                      onClick={() => handleClaimDonation(d.donation_id)}
                      className="mt-4 w-full rounded-lg bg-emerald-600 py-2 text-sm font-semibold hover:bg-emerald-700"
                    >
                      Claim Donation
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* create donation modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700/60 bg-slate-900/90 text-slate-100 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-700 p-5">
              <h2 className="text-lg font-semibold">Create New Donation</h2>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setSelectedProducts([]);
                }}
                className="text-slate-400 hover:text-slate-200 text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateDonation} className="p-5 space-y-5">
              {/* products */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Select Products to Donate *
                </label>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900/60 p-3 space-y-2">
                  {userProducts.length === 0 ? (
                    <p className="text-slate-400 text-sm">
                      No products found. Add some products first!
                    </p>
                  ) : (
                    userProducts.map((p) => {
                      const isSelected = selectedProducts.some((x) => x.product_id === p.product_id);
                      const isExpiring =
                        new Date(p.expiry_date).getTime() - Date.now() <= 3 * 24 * 60 * 60 * 1000;
                      return (
                        <div
                          key={p.product_id}
                          onClick={() => toggleProductSelection(p)}
                          className={`flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors shadow-md hover:shadow-lg ${
                            isSelected
                              ? "bg-gradient-to-r from-emerald-500 to-green-600 border border-emerald-500/40"
                              : "bg-slate-800/50 hover:bg-slate-800 border border-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              readOnly
                              checked={isSelected}
                              className="h-4 w-4 accent-emerald-600"
                            />
                            <div>
                              <p className="font-medium text-slate-100">{p.product_name}</p>
                              <p className="text-xs text-slate-400">
                                Count: {p.count} · Expires:{" "}
                                {new Date(p.expiry_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {isExpiring && (
                            <span className="rounded-full bg-amber-400/15 px-2 py-1 text-xs text-amber-200">
                              Expiring Soon
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                {selectedProducts.length > 0 && (
                  <p className="mt-2 text-sm text-emerald-300">
                    Selected: {selectedProducts.map((p) => p.product_name).join(", ")}
                  </p>
                )}
              </div>

              {/* location */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Pickup Location
                </label>
                <div className="space-y-2">
                  <MapContainer
                    center={[userLocation?.lat || -6.2, userLocation?.lng || 106.8]} // Default to Jakarta
                    zoom={13}
                    style={{ height: "300px", borderRadius: "0.75rem" }}
                    className="border border-slate-700 shadow-md"
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {userLocation && <Marker position={[userLocation.lat, userLocation.lng]} />}
                    <LocationMarker setUserLocation={setUserLocation} />
                  </MapContainer>
                  {userLocation ? (
                    <p className="text-sm text-slate-300">
                      Selected Location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                    </p>
                  ) : (
                    <p className="text-sm text-rose-300">
                      Click on the map to select a location.
                    </p>
                  )}
                </div>
              </div>

              {/* actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setSelectedProducts([]);
                  }}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-slate-200 hover:bg-slate-800 shadow-md hover:shadow-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || selectedProducts.length === 0 || !userLocation}
                  className="rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 px-5 py-2 font-semibold text-white hover:from-emerald-600 hover:to-green-700 shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:bg-slate-600"
                >
                  {loading ? "Creating..." : "Create Donation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR modal */}
      {showQRModal && selectedDonationForQR && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700/60 bg-slate-900/90 text-slate-100 shadow-2xl">
            <div className="p-5">
              <h3 className="text-lg font-semibold text-center">QR Code for Pickup</h3>
              <p className="mt-1 text-center text-sm text-slate-300">
                Show this code to the receiver when they arrive.
              </p>

              <div className="mt-4 rounded-xl border-2 border-slate-600 bg-slate-900/60 p-4">
                {qrCodeData ? (
                  <img
                    src={`data:image/png;base64,${qrCodeData}`}
                    alt="QR Code"
                    className="mx-auto h-auto max-h-48 w-auto"
                  />
                ) : (
                  <div className="text-center text-slate-400">Loading QR code…</div>
                )}
              </div>

              <div className="mt-4 rounded-lg bg-slate-800/60 p-3 text-sm">
                <p>
                  <strong>Donation:</strong> {selectedDonationForQR.type_of_food.join(", ")}
                </p>
                <p>
                  <strong>Receiver:</strong> {selectedDonationForQR.receiver_name}
                </p>
                <p>
                  <strong>Status:</strong> {selectedDonationForQR.status}
                </p>
              </div>

              <ol className="mt-3 list-inside list-decimal text-xs text-slate-400">
                <li>Wait for the receiver to arrive</li>
                <li>Ask them to scan this QR code</li>
                <li>Once scanned, the pickup will be verified</li>
                <li>Both parties will receive points</li>
              </ol>

              <button
                onClick={() => {
                  setShowQRModal(false);
                  setSelectedDonationForQR(null);
                  setQrCodeData("");
                }}
                className="mt-5 w-full rounded-lg bg-slate-700 py-2 font-semibold hover:bg-slate-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationPage;
