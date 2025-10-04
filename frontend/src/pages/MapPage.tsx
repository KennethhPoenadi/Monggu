import React, { useState, useEffect, useCallback } from "react";
import { type NearbyDonation, DonationStatus } from "../types/donation";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapPageProps {
  user_id: number;
}

const MapPage: React.FC<MapPageProps> = () => {
  const [donations, setDonations] = useState<NearbyDonation[]>([]);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchRadius, setSearchRadius] = useState(10);
  const [selectedDonation, setSelectedDonation] =
    useState<NearbyDonation | null>(null);

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

  const loadNearbyDonations = useCallback(async () => {
    if (!userLocation) return;

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/donations/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&radius_km=${searchRadius}`
      );
      const data = await response.json();
      if (data.status === "success") {
        setDonations(data.donations);
      }
    } catch (error) {
      console.error("Error loading donations:", error);
    } finally {
      setLoading(false);
    }
  }, [userLocation, searchRadius]);

  useEffect(() => {
    if (userLocation) {
      loadNearbyDonations();
    }
  }, [userLocation, loadNearbyDonations]);

  // Claim donation
  const claimDonation = async (donationId: number) => {
    try {
      const response = await fetch(
        `http://localhost:8000/donations/${donationId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: DonationStatus.Diterima }),
        }
      );

      const data = await response.json();
      if (data.status === "success") {
        alert("Donation claimed successfully!");
        setSelectedDonation(null);
        loadNearbyDonations();
      }
    } catch (error) {
      console.error("Error claiming donation:", error);
      alert("Error claiming donation");
    }
  };

  // Get distance color
  const getDistanceColor = (distance: number) => {
    if (distance <= 2) return "text-green-600 bg-green-100";
    if (distance <= 5) return "text-blue-600 bg-blue-100";
    if (distance <= 10) return "text-orange-600 bg-orange-100";
    return "text-red-600 bg-red-100";
  };

  // Initialize map
  useEffect(() => {
    if (!userLocation) return;

    const map = L.map("map").setView([userLocation.lat, userLocation.lng], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    donations.forEach((donation) => {
      L.marker([donation.lat, donation.lng])
        .addTo(map)
        .bindPopup(
          `<strong>${donation.type_of_food.join(", ")}</strong><br>${donation.address}`
        );
    });

    return () => {
      map.remove();
    };
  }, [userLocation, donations]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
              🗺️ Donation Map
            </h1>
            <p className="text-gray-600 text-lg">
              Find nearby food donations in your area
            </p>
          </div>

          {/* Search Controls */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
            <div className="flex items-center gap-4">
              <label className="text-gray-700 font-semibold">
                Search Radius:
              </label>
              <select
                value={searchRadius}
                onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                className="border border-gray-200 rounded-2xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
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
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-6 py-2 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              <span className="flex items-center gap-2">
                <span>🔍</span>
                Refresh Search
              </span>
            </button>
          </div>

          {/* Location Status */}
          <div className="mt-6 text-center">
            {userLocation ? (
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-2xl">
                <span>📍</span>
                <span className="font-medium">Location detected</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-800 px-4 py-2 rounded-2xl">
                <span>⚠️</span>
                <span className="font-medium">
                  Please enable location access
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Interactive Map
            </h2>
            <div className="bg-gradient-to-br from-green-100 to-blue-100 rounded-2xl p-16 border-2 border-dashed border-gray-300">
              <div
                id="map"
                className="h-96 rounded-3xl shadow-lg"
                style={{ height: "400px", zIndex: 0 }}
              ></div>
              <p className="text-gray-600 text-lg">
                Interactive map will be displayed here
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Shows nearby donations, your location, and distances
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600"></div>
            <p className="mt-4 text-gray-600 text-lg font-medium">
              Searching for donations...
            </p>
          </div>
        )}

        {/* Donations List */}
        {!loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {donations.map((donation) => (
              <div
                key={donation.donation_id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl p-6 transition-all duration-300 transform hover:scale-105 cursor-pointer"
                onClick={() => setSelectedDonation(donation)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center">
                      <span className="text-xl text-white">🍽️</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">
                        {donation.type_of_food.join(", ")}
                      </h3>
                      <p className="text-sm text-gray-500">Click for details</p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getDistanceColor(
                      donation.distance_km
                    )}`}
                  >
                    {donation.distance_km.toFixed(1)} km
                  </span>
                </div>

                <p className="text-gray-600 mb-3 line-clamp-2">
                  {donation.description}
                </p>

                <div className="flex items-center text-sm text-gray-500 mb-3">
                  <span className="mr-2">📍</span>
                  <span className="truncate">{donation.address}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>
                    Expires:{" "}
                    {new Date(donation.expiry_time).toLocaleDateString()}
                  </span>
                  <span>{donation.status}</span>
                </div>
              </div>
            ))}

            {donations.length === 0 && !loading && (
              <div className="col-span-full text-center py-16 bg-white rounded-3xl shadow-lg">
                <div className="text-8xl mb-6">🗺️</div>
                <h3 className="text-2xl font-bold text-gray-600 mb-3">
                  No donations found
                </h3>
                <p className="text-gray-500 text-lg">
                  Try expanding your search radius or check back later
                </p>
              </div>
            )}
          </div>
        )}

        {/* Donation Detail Modal */}
        {selectedDonation && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg transform transition-all duration-300 scale-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Donation Details
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedDonation(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <span className="text-2xl">✕</span>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-xl text-gray-800 mb-2 flex items-center gap-2">
                    <span>🍽️</span>
                    {selectedDonation.type_of_food.join(", ")}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {selectedDonation.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="text-center p-4 bg-gray-50 rounded-2xl">
                    <div className="text-2xl mb-2">📏</div>
                    <div className="font-semibold text-gray-800">
                      {selectedDonation.distance_km.toFixed(1)} km
                    </div>
                    <div className="text-sm text-gray-500">Distance</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-2xl">
                    <div className="text-2xl mb-2">⏰</div>
                    <div className="font-semibold text-gray-800">
                      {Math.ceil(
                        (new Date(selectedDonation.expiry_time).getTime() -
                          new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}{" "}
                      days
                    </div>
                    <div className="text-sm text-gray-500">Until expiry</div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span>📍</span>
                    <span className="font-semibold text-gray-700">
                      Pickup Location
                    </span>
                  </div>
                  <p className="text-gray-600">{selectedDonation.address}</p>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Status:</span>
                  <span className="font-medium text-blue-600">
                    {selectedDonation.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Expires:</span>
                  <span className="font-medium">
                    {new Date(selectedDonation.expiry_time).toLocaleString()}
                  </span>
                </div>
              </div>

              {selectedDonation.status === DonationStatus.SiapDijemput && (
                <div className="flex gap-3 pt-6">
                  <button
                    onClick={() => claimDonation(selectedDonation.donation_id)}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span>🎯</span>
                      Claim This Donation
                    </span>
                  </button>
                  <button
                    onClick={() => setSelectedDonation(null)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-2xl transition-all duration-300 border border-gray-200"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapPage;
