import React, { useState, useEffect, useCallback } from "react";
import {
  DonationStatus,
  type Donation,
  type DonationCreate,
  type NearbyDonation,
} from "../../types/donation";

interface DonationPageProps {
  user_id: number;
}

const DonationPage: React.FC<DonationPageProps> = ({ user_id }) => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [nearbyDonations, setNearbyDonations] = useState<NearbyDonation[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<DonationCreate>({
    type_of_food: [],
    description: "",
    lat: 0,
    lng: 0,
    address: "",
  });

  // Load user's donations
  const loadMyDonations = useCallback(async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/donations/user/${user_id}`
      );
      const data = await response.json();
      if (data.status === "success") {
        setDonations(data.donations);
      }
    } catch (error) {
      console.error("Error loading donations:", error);
    }
  }, [user_id]);

  // Load nearby donations
  const loadNearbyDonations = useCallback(async () => {
    if (!userLocation) return;

    try {
      const response = await fetch(
        `http://localhost:8000/donations/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&radius_km=10`
      );
      const data = await response.json();
      if (data.status === "success") {
        setNearbyDonations(data.donations);
      }
    } catch (error) {
      console.error("Error loading nearby donations:", error);
    }
  }, [userLocation]);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  useEffect(() => {
    loadMyDonations();
  }, [loadMyDonations]);

  useEffect(() => {
    if (userLocation) {
      loadNearbyDonations();
    }
  }, [userLocation, loadNearbyDonations]);

  // Create donation
  const handleCreateDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/donations/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          user_id,
          lat: userLocation?.lat || 0,
          lng: userLocation?.lng || 0,
        }),
      });

      const data = await response.json();
      if (data.status === "success") {
        alert("Donation created successfully!");
        setShowCreateForm(false);
        setFormData({
          type_of_food: [],
          description: "",
          lat: 0,
          lng: 0,
          address: "",
        });
        loadMyDonations();
      } else {
        alert("Error creating donation: " + data.message);
      }
    } catch (error) {
      console.error("Error creating donation:", error);
      alert("Error creating donation");
    } finally {
      setLoading(false);
    }
  };

  // Update donation status
  const updateDonationStatus = async (
    donationId: number,
    status: DonationStatus
  ) => {
    try {
      const response = await fetch(
        `http://localhost:8000/donations/${donationId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();
      if (data.status === "success") {
        alert("Status updated successfully!");
        loadMyDonations();
        loadNearbyDonations();
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const getStatusColor = (status: DonationStatus) => {
    switch (status) {
      case DonationStatus.Diajukan:
        return "bg-yellow-100 text-yellow-800";
      case DonationStatus.SiapDijemput:
        return "bg-blue-100 text-blue-800";
      case DonationStatus.Diterima:
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full mb-6 shadow-lg">
            <span className="text-3xl text-white">🍽️</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent mb-4">
            Food Donation Hub
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Share food, reduce waste, and make a positive impact in your
            community
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <span className="text-xl">➕</span>
            Create New Donation
          </button>
        </div>

        {/* Create Donation Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg transform transition-all duration-300 scale-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Create New Donation
                </h2>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <span className="text-2xl">✕</span>
                </button>
              </div>

              <form onSubmit={handleCreateDonation} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Food Types <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Rice, Vegetables, Bread (comma separated)"
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type_of_food: e.target.value
                          .split(",")
                          .map((item) => item.trim()),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Description
                  </label>
                  <textarea
                    placeholder="Additional details about the food..."
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white resize-none"
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Your address for pickup"
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:transform-none disabled:hover:scale-100"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⏳</span>
                        Creating...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <span>🎁</span>
                        Create Donation
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-2xl transition-all duration-300 border border-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* My Donations */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-6 flex items-center gap-3">
              <span className="text-2xl">📦</span>
              My Donations
            </h2>
            <div className="space-y-4">
              {donations.map((donation) => (
                <div
                  key={donation.donation_id}
                  className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-md hover:shadow-lg border border-gray-100 p-6 transition-all duration-300 transform hover:scale-105"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                      <span className="text-xl">🍽️</span>
                      {donation.type_of_food.join(", ")}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${getStatusColor(
                        donation.status
                      )}`}
                    >
                      {donation.status}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-3 leading-relaxed">
                    {donation.description}
                  </p>
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <span className="mr-2">📍</span>
                    <span className="bg-gray-100 px-2 py-1 rounded-lg">
                      {donation.address}
                    </span>
                  </div>

                  <div className="flex items-center text-xs text-gray-400 mb-4">
                    <span className="mr-2">⏰</span>
                    Expires: {new Date(donation.expiry_time).toLocaleString()}
                  </div>

                  {donation.status === DonationStatus.Diajukan && (
                    <button
                      onClick={() =>
                        updateDonationStatus(
                          donation.donation_id,
                          DonationStatus.SiapDijemput
                        )
                      }
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <span>✅</span>
                        Mark as Ready for Pickup
                      </span>
                    </button>
                  )}
                </div>
              ))}

              {donations.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📦</div>
                  <p className="text-gray-500 text-lg font-medium">
                    No donations yet
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Create your first donation to get started!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Nearby Donations */}
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-6 flex items-center gap-3">
              <span className="text-2xl">🗺️</span>
              Nearby Donations Available
            </h2>
            <div className="space-y-4">
              {nearbyDonations.map((donation) => (
                <div
                  key={donation.donation_id}
                  className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl shadow-md hover:shadow-lg border border-blue-100 p-6 transition-all duration-300 transform hover:scale-105"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                      <span className="text-xl">🍽️</span>
                      {donation.type_of_food.join(", ")}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${getStatusColor(
                        donation.status
                      )}`}
                    >
                      {donation.status}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-3 leading-relaxed">
                    {donation.description}
                  </p>
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <span className="mr-2">📍</span>
                    <span className="bg-white px-2 py-1 rounded-lg shadow-sm">
                      {donation.address}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-blue-600 mb-3 font-semibold">
                    <span className="mr-2">📏</span>
                    <span className="bg-blue-100 px-2 py-1 rounded-lg">
                      {donation.distance_km.toFixed(1)} km away
                    </span>
                  </div>

                  <div className="flex items-center text-xs text-gray-400 mb-4">
                    <span className="mr-2">⏰</span>
                    Expires: {new Date(donation.expiry_time).toLocaleString()}
                  </div>

                  {donation.status === DonationStatus.SiapDijemput && (
                    <button
                      onClick={() =>
                        updateDonationStatus(
                          donation.donation_id,
                          DonationStatus.Diterima
                        )
                      }
                      className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <span>🎯</span>
                        Claim This Donation
                      </span>
                    </button>
                  )}
                </div>
              ))}

              {nearbyDonations.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🗺️</div>
                  <p className="text-gray-500 text-lg font-medium">
                    No nearby donations available
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Check back later or expand your search radius!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationPage;
