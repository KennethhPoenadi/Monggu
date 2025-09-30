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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Food Donation Management
          </h1>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            + Create New Donation
          </button>
        </div>

        {/* Create Donation Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Create New Donation</h2>
              <form onSubmit={handleCreateDonation}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Food Types
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Rice, Vegetables, Bread (comma separated)"
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
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

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    placeholder="Additional details about the food..."
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    placeholder="Your address for pickup"
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? "Creating..." : "Create Donation"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
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
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              My Donations
            </h2>
            <div className="space-y-4">
              {donations.map((donation) => (
                <div
                  key={donation.donation_id}
                  className="bg-white rounded-lg shadow-sm border p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">
                      {donation.type_of_food.join(", ")}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        donation.status
                      )}`}
                    >
                      {donation.status}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-2">{donation.description}</p>
                  <p className="text-sm text-gray-500 mb-2">
                    📍 {donation.address}
                  </p>

                  <div className="text-xs text-gray-400 mb-3">
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
                      className="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Mark as Ready for Pickup
                    </button>
                  )}
                </div>
              ))}

              {donations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No donations yet. Create your first donation!
                </div>
              )}
            </div>
          </div>

          {/* Nearby Donations */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Nearby Donations Available
            </h2>
            <div className="space-y-4">
              {nearbyDonations.map((donation) => (
                <div
                  key={donation.donation_id}
                  className="bg-white rounded-lg shadow-sm border p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">
                      {donation.type_of_food.join(", ")}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        donation.status
                      )}`}
                    >
                      {donation.status}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-2">{donation.description}</p>
                  <p className="text-sm text-gray-500 mb-2">
                    📍 {donation.address}
                  </p>
                  <p className="text-sm text-blue-600 mb-2">
                    📏 {donation.distance_km.toFixed(1)} km away
                  </p>

                  <div className="text-xs text-gray-400 mb-3">
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
                      className="bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700"
                    >
                      Claim This Donation
                    </button>
                  )}
                </div>
              ))}

              {nearbyDonations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No nearby donations available at the moment.
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
