import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import QRCodeScanner from "../components/QRCodeScanner";
import ExpiryWarning from "../components/ExpiryWarning";

interface ProfilePageProps {
  user_id: number;
}

interface UserProfile {
  user_id: number;
  name: string;
  email: string;
  poin: number;
}

interface ClaimedDonation {
  donation_id: number;
  type_of_food: string[];
  status: string;
  donor_name: string;
  created_at: string;
  expires_at: string;
  latitude: number;
  longitude: number;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user_id }) => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [claimedDonations, setClaimedDonations] = useState<ClaimedDonation[]>([]);
  const [selectedDonationId, setSelectedDonationId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQRScanner, setShowQRScanner] = useState(false);

  // --- data load
  useEffect(() => {
    loadUserProfile(user_id);
    loadClaimedDonations(user_id);

    const claimedDonationId = localStorage.getItem("claimedDonationId");
    if (claimedDonationId) {
      setSelectedDonationId(parseInt(claimedDonationId));
      localStorage.removeItem("claimedDonationId");
    }
  }, [user_id]);

  const loadUserProfile = async (userId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/accounts/${userId}`);
      const data = await response.json();
      if (data.status === "success") setUserProfile(data.account);
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  };

  const loadClaimedDonations = async (userId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/donations/user/${userId}/claimed`);
      const data = await response.json();
      if (data.status === "success") setClaimedDonations(data.donations);
      setLoading(false);
    } catch (error) {
      console.error("Error loading claimed donations:", error);
      setLoading(false);
    }
  };

  // --- actions
  const openInGoogleMaps = (latitude: number, longitude: number) => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
      "_blank"
    );
  };

  const handleScanQR = () => setShowQRScanner(true);

  const handleQRScanSuccess = async (scannedData: string) => {
    try {
      const response = await fetch("http://localhost:8000/donations/verify-pickup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_hash: scannedData }),
      });

      const data = await response.json();
      if (data.status === "success") {
        alert(`Pickup verified successfully!`);
        setShowQRScanner(false);
        loadUserProfile(user_id); // refresh points
        loadClaimedDonations(user_id); // refresh list
      } else {
        alert(`Verification failed: ${data.detail}`);
      }
    } catch (error) {
      console.error("Error verifying pickup:", error);
      alert("Failed to verify pickup");
    }
  };

  // --- UX helpers (glow follow mouse)
  const handleGlowMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--x", `${e.clientX - r.left}px`);
    el.style.setProperty("--y", `${e.clientY - r.top}px`);
  };
  const handleGlowLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget as HTMLElement;
    el.style.removeProperty("--x");
    el.style.removeProperty("--y");
  };
  const glowByStatus = (status: string) => {
    if (/siap/i.test(status)) return "rgba(16,185,129,.12)"; // emerald
    if (/diterima|received/i.test(status)) return "rgba(245,158,11,.12)"; // amber
    return "rgba(56,189,248,.12)"; // sky
  };

  // expiring items from claimed donations
  const expiringItems = claimedDonations
    .filter((d) => {
      const expiryDate = new Date(d.expires_at).getTime();
      const diffDays = Math.ceil((expiryDate - Date.now()) / (1000 * 60 * 60 * 24));
      return diffDays <= 2 && diffDays > 0;
    })
    .flatMap((d) => d.type_of_food);

  if (loading) {
    return (
      <div className="relative grid min-h-screen place-items-center overflow-x-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-600 border-t-emerald-500" />
          <p className="mt-4 text-slate-300">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
      {/* dekor blob */}
      <svg
        className="pointer-events-none absolute -left-24 -top-24 h-[36rem] w-[36rem] opacity-20 blur-3xl"
        viewBox="0 0 200 200"
        aria-hidden="true"
      >
        <path
          d="M53.6,-58.2C67.2,-45.5,74.9,-24.7,73.8,-5.7C72.8,13.3,63.1,26.6,49.5,38.9C36,51.3,18,62.7,-0.3,63.1C-18.5,63.6,-36.9,53.1,-49.1,39.6C-61.3,26.1,-67.3,9.6,-65.7,-6.1C-64.1,-21.7,-54.8,-36.5,-42.1,-49.5C-29.4,-62.6,-14.7,-73.9,3.1,-77.9C20.9,-81.9,41.9,-78.6,53.6,-58.2Z"
          transform="translate(100 100)"
          className="fill-emerald-500/25"
        />
      </svg>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* HEADER */}
        <section className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-8 shadow-xl backdrop-blur-xl">
          <div className="text-center">
            <h1 className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-4xl font-extrabold text-transparent md:text-5xl">
              👤 Profile
            </h1>
            <p className="mt-2 text-slate-300">Manage your info and pickups</p>
          </div>

          {/* points + identity */}
          {userProfile && (
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {/* identity card */}
              <div
                onMouseMove={handleGlowMove}
                onMouseLeave={handleGlowLeave}
                className="group relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/60 p-6"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -z-10 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(600px circle at var(--x, 50%) var(--y, 50%), rgba(16,185,129,.12), transparent 40%)",
                  }}
                />
                <h2 className="mb-4 text-xl font-bold text-slate-100">User Information</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-slate-400">Name</p>
                    <p className="text-lg font-semibold text-slate-100">{userProfile.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Email</p>
                    <p className="text-lg font-semibold text-slate-100">{userProfile.email}</p>
                  </div>
                </div>
              </div>

              {/* points card */}
              <div
                onMouseMove={handleGlowMove}
                onMouseLeave={handleGlowLeave}
                className="group relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/60 p-6"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -z-10 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(600px circle at var(--x, 50%) var(--y, 50%), rgba(56,189,248,.12), transparent 40%)",
                  }}
                />
                <h2 className="mb-2 text-xl font-bold text-slate-100">Points</h2>
                <div className="text-3xl font-extrabold text-emerald-300">
                  {userProfile.poin.toLocaleString()} <span className="text-lg text-slate-400">pts</span>
                </div>
                <p className="mt-1 text-sm text-slate-400">
                  Earn points by donating and completing pickups.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* EXPIRY WARNING (component) */}
        {expiringItems.length > 0 && (
          <section className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-amber-200">
            <ExpiryWarning foodItems={expiringItems} expiryDays={2} />
          </section>
        )}

        {/* CLAIMED DONATIONS */}
        <section className="mt-8 rounded-2xl border border-slate-700/60 bg-slate-900/70 p-8 shadow-xl backdrop-blur-xl">
          <div className="mb-6 text-center">
            <h2 className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-3xl font-bold text-transparent">
              🎯 My Claimed Donations
            </h2>
            <p className="mt-1 text-slate-300">Donations you’ve claimed and can pick up</p>
          </div>

          {claimedDonations.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-slate-700 bg-slate-900/60 p-12 text-center">
              <div className="mb-4 text-6xl">📭</div>
              <p className="text-slate-300">No claimed donations yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {claimedDonations.map((d) => (
                <div
                  key={d.donation_id}
                  onMouseMove={handleGlowMove}
                  onMouseLeave={handleGlowLeave}
                  className="group relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -z-10 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(600px circle at var(--x, 50%) var(--y, 50%), ${glowByStatus(
                        d.status
                      )}, transparent 40%)`,
                    }}
                  />
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-100">
                        {d.type_of_food.join(", ")}
                      </h3>
                      <p className="text-sm text-slate-400">From: {d.donor_name}</p>
                      <p className="text-sm text-sky-300">Status: {d.status}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">
                        Expires: {new Date(d.expires_at).toLocaleDateString()}
                      </p>
                      <button
                        onClick={() => openInGoogleMaps(d.latitude, d.longitude)}
                        className="mt-2 rounded-lg bg-sky-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-sky-700"
                      >
                        🗺️ Navigate
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* PICKUP INSTRUCTIONS (highlight when redirected after claim) */}
        {selectedDonationId && (
          <section
            onMouseMove={handleGlowMove}
            onMouseLeave={handleGlowLeave}
            className="mt-8 group relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/70 p-8 shadow-xl backdrop-blur-xl"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{
                background:
                  "radial-gradient(600px circle at var(--x, 50%) var(--y, 50%), rgba(16,185,129,.12), transparent 40%)",
              }}
            />
            <h2 className="mb-4 text-center text-2xl font-bold text-slate-100">
              📦 Pickup Instructions
            </h2>
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200">
              <h3 className="mb-2 font-semibold">📱 For Pickup Verification:</h3>
              <ol className="list-inside list-decimal space-y-1 text-sm">
                <li>Navigate to the pickup location using the button above</li>
                <li>Meet the donor at the location</li>
                <li>Ask the donor to show their QR code</li>
                <li>Use the “Scan QR for Pickup Verification” button below</li>
                <li>Scan the donor’s QR code to complete pickup</li>
              </ol>
            </div>
          </section>
        )}

        {/* ACTIONS */}
        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <button
            onClick={handleScanQR}
            className="rounded-2xl bg-emerald-600 py-3 font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-emerald-600/20"
          >
            Scan QR for Pickup Verification
          </button>
          <button
            onClick={() => navigate("/donation")}
            className="rounded-2xl bg-sky-600 py-3 font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-sky-600/20"
          >
            Browse Donations
          </button>
        </section>

        {/* AI helper note */}
        <section className="mt-6 rounded-2xl border border-violet-500/30 bg-violet-500/10 p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🤖</div>
            <div>
              <h3 className="font-semibold text-violet-200">AI Recipe Assistant Available</h3>
              <p className="text-sm text-violet-200/80">
                Look for the floating AI button (🤖) at the bottom-right corner of any page to chat
                about recipes and cooking tips!
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/90 p-6 text-slate-100 shadow-2xl">
            <h3 className="mb-1 text-center text-lg font-semibold">Scan QR Code for Pickup</h3>
            <p className="mb-4 text-center text-sm text-slate-300">
              Point your camera at the donor's QR code to verify pickup
            </p>
            <div className="mb-4 rounded-xl border border-slate-700 bg-slate-900/60 p-2">
              <QRCodeScanner onScanSuccess={handleQRScanSuccess} />
            </div>
            <button
              onClick={() => setShowQRScanner(false)}
              className="w-full rounded-lg bg-slate-700 py-2 font-semibold transition-colors hover:bg-slate-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
