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
        `http://localhost:8000/donations/nearby/?latitude=${userLocation.lat}&longitude=${userLocation.lng}&radius_km=${searchRadius}&user_id=${user_id}`
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
  }, [userLocation, searchRadius, user_id]);

  // Load claimed donations for current user
  const loadClaimedDonations = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:8000/donations/?user_id=${user_id}&active_only=false`);
      const data = await response.json();
      if (data.status === 'success') {
        // Filter donations where current user is receiver and status is "Siap Dijemput"
        const claimed = data.donations.filter((donation: NearbyDonation & { receiver_user_id: number }) => 
          donation.receiver_user_id === user_id && 
          donation.status === 'Siap Dijemput'
        );
        setClaimedDonations(claimed);
      }
    } catch (error) {
      console.error('Error loading claimed donations:', error);
    }
  }, [user_id]);

  // Load donations where current user is the donor (on progress donations)
  const loadMyDonations = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:8000/donations/user/${user_id}`);
      const data = await response.json();
      if (data.status === 'success') {
        // Filter donations where current user is donor and status is "Siap Dijemput" (waiting for pickup)
        const myActiveDonations = data.donations.filter((donation: NearbyDonation) => 
          donation.status === 'Siap Dijemput'
        );
        setMyDonations(myActiveDonations);
      }
    } catch (error) {
      console.error('Error loading my donations:', error);
    }
  }, [user_id]);

  useEffect(() => {
    if (userLocation) {
      loadNearbyDonations();
    }
    loadClaimedDonations(); // Load claimed donations regardless of location
    loadMyDonations(); // Load my donations as donor
  }, [userLocation, loadNearbyDonations, loadClaimedDonations, loadMyDonations]);

  // Function to open Google Maps navigation
  const openInGoogleMaps = (latitude: number, longitude: number) => {
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
    window.open(googleMapsUrl, '_blank');
  };

  // Claim donation
  const claimDonation = async (donationId: number, userId: number) => {
    try {
      const response = await fetch(
        `http://localhost:8000/donations/${donationId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            status: DonationStatus.SiapDijemput,
            receiver_user_id: userId 
          }),
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

    // Add available donations (blue markers)
    donations.forEach((donation) => {
      L.marker([donation.latitude, donation.longitude])
        .addTo(map)
        .bindPopup(
          `<strong>Available: ${donation.type_of_food.join(", ")}</strong><br>Donor: ${donation.donor_name}<br>Location: ${donation.latitude.toFixed(4)}, ${donation.longitude.toFixed(4)}`
        );
    });

    // Add claimed donations (green markers)
    claimedDonations.forEach((donation) => {
      // Create custom green icon for claimed donations
      const greenIcon = L.divIcon({
        className: 'custom-div-icon',
        html: "<div style='background-color: #10B981; width: 25px; height: 25px; border-radius: 50%; border: 2px solid white;'></div>",
        iconSize: [25, 25],
        iconAnchor: [12, 12]
      });
      
      L.marker([donation.latitude, donation.longitude], { icon: greenIcon })
        .addTo(map)
        .bindPopup(
          `<strong>🎯 Your Pickup: ${donation.type_of_food.join(", ")}</strong><br>Donor: ${donation.donor_name}<br>Status: ${donation.status}<br>Location: ${donation.latitude.toFixed(4)}, ${donation.longitude.toFixed(4)}`
        );
    });

    myDonations.forEach((donation) => {
      const orangeIcon = L.divIcon({
        className: 'custom-div-icon',
        html: "<div style='background-color: #F97316; width: 25px; height: 25px; border-radius: 50%; border: 2px solid white;'></div>",
        iconSize: [25, 25],
        iconAnchor: [12, 12]
      });
      
      L.marker([donation.latitude, donation.longitude], { icon: orangeIcon })
        .addTo(map)
        .bindPopup(
          `<strong>📦 Your Donation: ${donation.type_of_food.join(", ")}</strong><br>Receiver: ${donation.receiver_name || 'Waiting for pickup'}<br>Status: ${donation.status}<br>Location: ${donation.latitude.toFixed(4)}, ${donation.longitude.toFixed(4)}`
        );
    });

    return () => {
      map.remove();
    };
  }, [userLocation, donations, claimedDonations, myDonations]);

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

        {/* Available Donations to Claim */}
        {!loading && (
          <div className="mb-8">
            <div className="bg-white rounded-3xl shadow-lg p-8 mb-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6 text-center">
                🍽️ Available Donations to Claim
              </h2>
              <p className="text-gray-600 text-center mb-6">
                Food donations available for pickup near you (shown as blue markers on map)
              </p>
              <div className="text-center">
                <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-2xl text-sm">
                  <span>📍</span>
                  <span className="font-medium">Found {donations.length} donations within {searchRadius}km</span>
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {donations.map((donation) => {
              const isClaimedByMe = donation.status === 'Siap Dijemput' && donation.receiver_user_id === user_id;
              
              return (
                <div
                  key={donation.donation_id}
                  className={`rounded-2xl shadow-lg hover:shadow-xl p-6 transition-all duration-300 transform hover:scale-105 cursor-pointer ${
                    isClaimedByMe 
                      ? 'bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200' 
                      : 'bg-white'
                  }`}
                  onClick={() => setSelectedDonation(donation)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        isClaimedByMe 
                          ? 'bg-gradient-to-r from-green-500 to-green-600' 
                          : 'bg-gradient-to-r from-green-500 to-blue-500'
                      }`}>
                        <span className="text-xl text-white">{isClaimedByMe ? '🎯' : '🍽️'}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">
                          {donation.type_of_food.join(", ")}
                        </h3>
                        <p className={`text-sm font-medium ${
                          isClaimedByMe ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {isClaimedByMe ? 'Ready for pickup' : 'Click for details'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getDistanceColor(
                          donation.distance_km
                        )}`}
                      >
                        {donation.distance_km.toFixed(1)} km
                      </span>
                      {isClaimedByMe && (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          Claimed by you
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-600 mb-3 line-clamp-2">
                    Donor: {donation.donor_name || "Anonymous"}
                  </p>

                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <span className="mr-2">📍</span>
                    <span className="truncate">
                      {donation.latitude.toFixed(4)}, {donation.longitude.toFixed(4)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>
                      Expires:{" "}
                      {new Date(donation.expires_at).toLocaleDateString()}
                    </span>
                    <span className={`font-medium ${
                      isClaimedByMe ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {isClaimedByMe ? 'Ready for pickup' : donation.status}
                    </span>
                  </div>
                </div>
              );
            })}

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
          </div>
        )}

        {claimedDonations.length > 0 && (
          <div className="mt-8">
            <div className="bg-white rounded-3xl shadow-lg p-8 mb-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-6 text-center">
                🎯 My Claimed Donations
              </h2>
              <p className="text-gray-600 text-center mb-6">
                Donations ready for pickup (shown as green markers on map)
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {claimedDonations.map((donation) => (
                <div
                  key={donation.donation_id}
                  className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-2xl shadow-lg hover:shadow-xl p-6 transition-all duration-300 transform hover:scale-105"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
                        <span className="text-xl text-white">🎯</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">
                          {donation.type_of_food.join(", ")}
                        </h3>
                        <p className="text-sm text-green-600 font-medium">Ready for pickup</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      {donation.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-gray-600 text-sm">
                      <strong>Donor:</strong> {donation.donor_name || "Anonymous"}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm">
                        <strong>Location:</strong> {donation.latitude.toFixed(4)}, {donation.longitude.toFixed(4)}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      <strong>Expires:</strong> {new Date(donation.expires_at).toLocaleString()}
                    </p>
                  </div>

                  <button
                    onClick={() => openInGoogleMaps(donation.latitude, donation.longitude)}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <span>🗺️</span>
                    Navigate to Pickup
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Donations as Donor Section */}
        {myDonations.length > 0 && (
          <div className="mt-8">
            <div className="bg-white rounded-3xl shadow-lg p-8 mb-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-6 text-center">
                📦 My Donations (Waiting for Pickup)
              </h2>
              <p className="text-gray-600 text-center mb-6">
                Your donations waiting for pickup (shown as orange markers on map)
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myDonations.map((donation) => (
                <div
                  key={donation.donation_id}
                  className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-2xl shadow-lg hover:shadow-xl p-6 transition-all duration-300 transform hover:scale-105"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center">
                        <span className="text-xl text-white">📦</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">
                          {donation.type_of_food.join(", ")}
                        </h3>
                        <p className="text-sm text-orange-600 font-medium">Waiting for pickup</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                      {donation.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-gray-600 text-sm">
                      <strong>Receiver:</strong> {donation.receiver_name || "Waiting for claim"}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm">
                        <strong>Pickup Location:</strong> {donation.latitude.toFixed(4)}, {donation.longitude.toFixed(4)}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      <strong>Expires:</strong> {new Date(donation.expires_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => openInGoogleMaps(donation.latitude, donation.longitude)}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <span>🗺️</span>
                      View Pickup Location
                    </button>
                    
                    {/* QR Code button for donor */}
                    <button
                      onClick={() => {
                        // This would open QR modal - will implement if needed
                        alert('QR Code feature: Show your QR code to receiver when they arrive for pickup');
                      }}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <span>📱</span>
                      Show QR for Pickup
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
                    Donor: {selectedDonation.donor_name || "Anonymous"}
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
                        (new Date(selectedDonation.expires_at).getTime() -
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
                  <p className="text-gray-600 mb-3">
                    {selectedDonation.latitude.toFixed(4)}, {selectedDonation.longitude.toFixed(4)}
                  </p>
                  <button
                    onClick={() => openInGoogleMaps(selectedDonation.latitude, selectedDonation.longitude)}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <span>🗺️</span>
                    Navigate in Google Maps
                  </button>
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
                    {new Date(selectedDonation.expires_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {selectedDonation.status === DonationStatus.Diajukan && (
                <div className="flex gap-3 pt-6">
                  <button
                    onClick={() => claimDonation(selectedDonation.donation_id, user_id)}
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

              {selectedDonation.status === DonationStatus.SiapDijemput && selectedDonation.receiver_user_id === user_id && (
                <div className="space-y-3 pt-6">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-green-800 font-medium mb-2">
                      <span>✅</span>
                      <span>Donation claimed successfully!</span>
                    </div>
                    <p className="text-green-700 text-sm">
                      This donation is ready for pickup. Navigate to the location and scan the QR code from your profile to complete the pickup.
                    </p>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => openInGoogleMaps(selectedDonation.latitude, selectedDonation.longitude)}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <span>🗺️</span>
                        Navigate to Pickup
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDonation(null);
                        navigate('/profile');
                      }}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <span>📱</span>
                        QR Scanner
                      </span>
                    </button>
                  </div>
                  
                  <button
                    onClick={() => setSelectedDonation(null)}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-2xl transition-all duration-300 border border-gray-200"
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
