import React, { useState, useEffect, useCallback } from "react";
import {
  DonationStatus,
  type Donation,
  type DonationCreate,
  type NearbyDonation,
} from "../../types/donation";
import { type Product } from "../../types/product";

interface DonationPageProps {
  user_id: number;
}

const DonationPage: React.FC<DonationPageProps> = ({ user_id }) => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [nearbyDonations, setNearbyDonations] = useState<NearbyDonation[]>([]);
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [expiringProducts, setExpiringProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Load user's donations
  const loadMyDonations = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:8000/donations/user/${user_id}`);
      const data = await response.json();
      if (data.status === "success") {
        setDonations(data.donations);
      }
    } catch (error) {
      console.error("Error loading donations:", error);
    }
  }, [user_id]);

  // Load user products
  const loadUserProducts = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:8000/products/user/${user_id}`);
      const data = await response.json();
      if (data.status === "success") {
        setUserProducts(data.products);
      }
    } catch (error) {
      console.error("Error loading user products:", error);
    }
  }, [user_id]);

  // Load expiring products
  const loadExpiringProducts = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:8000/products/user/${user_id}/expiring?days=3`);
      const data = await response.json();
      if (data.status === "success") {
        setExpiringProducts(data.products);
      }
    } catch (error) {
      console.error("Error loading expiring products:", error);
    }
  }, [user_id]);

  // Load nearby donations
  const loadNearbyDonations = useCallback(async () => {
    if (!userLocation) return;

    try {
      const response = await fetch(
        `http://localhost:8000/donations/nearby/?latitude=${userLocation.lat}&longitude=${userLocation.lng}&radius_km=10&user_id=${user_id}`
      );
      const data = await response.json();
      if (data.status === "success") {
        setNearbyDonations(data.donations);
      }
    } catch (error) {
      console.error("Error loading nearby donations:", error);
    }
  }, [userLocation, user_id]);

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
    loadUserProducts();
    loadExpiringProducts();
  }, [loadMyDonations, loadUserProducts, loadExpiringProducts]);

  useEffect(() => {
    if (userLocation) {
      loadNearbyDonations();
    }
  }, [userLocation, loadNearbyDonations]);

  // Create donation from selected products
  const handleCreateDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProducts.length === 0) {
      alert("Please select at least one product to donate.");
      return;
    }
    if (!userLocation) {
      alert("Please allow location access to create a donation.");
      return;
    }

    setLoading(true);

    try {
      const donationData: DonationCreate = {
        donor_user_id: user_id,
        type_of_food: selectedProducts.map(p => p.product_name),
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        status: DonationStatus.Diajukan,
      };

      const response = await fetch("http://localhost:8000/donations/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(donationData),
      });

      const data = await response.json();
      if (data.status === "success") {
        alert("Donation created successfully!");
        setShowCreateForm(false);
        setSelectedProducts([]);
        loadMyDonations();
      } else {
        alert(`Error: ${data.detail}`);
      }
    } catch (error) {
      console.error("Error creating donation:", error);
      alert("Failed to create donation");
    } finally {
      setLoading(false);
    }
  };

  // Toggle product selection
  const toggleProductSelection = (product: Product) => {
    setSelectedProducts(prev => {
      const isSelected = prev.some(p => p.product_id === product.product_id);
      if (isSelected) {
        return prev.filter(p => p.product_id !== product.product_id);
      } else {
        return [...prev, product];
      }
    });
  };

  // Add expiring product to selection
  const addExpiringProduct = (product: Product) => {
    setSelectedProducts(prev => {
      const isAlreadySelected = prev.some(p => p.product_id === product.product_id);
      if (!isAlreadySelected) {
        return [...prev, product];
      }
      return prev;
    });
  };

  // Use current location
  const useMyLocation = () => {
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
          alert("Could not get your location. Please try again.");
        }
      );
    }
  };

  // Cancel donation and restore products
  const handleCancelDonation = async (donationId: number) => {
    if (!confirm("Are you sure you want to cancel this donation? The products will be restored to your inventory.")) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/donations/${donationId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (data.status === "success") {
        alert("Donation cancelled successfully! Products restored to inventory.");
        loadMyDonations(); // Refresh donations list
        loadUserProducts(); // Refresh products list
      } else {
        alert(`Error: ${data.detail}`);
      }
    } catch (error) {
      console.error("Error cancelling donation:", error);
      alert("Failed to cancel donation");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Food Donations</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Create Donation
        </button>
      </div>

      {/* Expiring Products Alert */}
      {expiringProducts.length > 0 && (
        <div className="bg-orange-100 border-l-4 border-orange-500 p-4 rounded">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-5 h-5 text-orange-500">⚠️</div>
            </div>
            <div className="ml-3">
              <p className="text-sm text-orange-700">
                <strong>Products Expiring Soon!</strong> You have {expiringProducts.length} products expiring in the next 3 days.
                Consider donating them to help reduce food waste.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {expiringProducts.map((product) => (
                  <button
                    key={product.product_id}
                    onClick={() => addExpiringProduct(product)}
                    className="bg-orange-200 hover:bg-orange-300 text-orange-800 px-3 py-1 rounded-full text-xs transition-colors"
                  >
                    + {product.product_name} (expires {new Date(product.expiry_date).toLocaleDateString()})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Donation Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ marginTop: '10vh', marginBottom: '10vh' }}>
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">Create New Donation</h2>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setSelectedProducts([]);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateDonation} className="p-6 space-y-4">
              {/* Product Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Products to Donate *
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                  {userProducts.length === 0 ? (
                    <p className="text-gray-500 text-sm">No products found. Add some products first!</p>
                  ) : (
                    userProducts.map((product) => {
                      const isSelected = selectedProducts.some(p => p.product_id === product.product_id);
                      const isExpiring = new Date(product.expiry_date).getTime() - new Date().getTime() <= 3 * 24 * 60 * 60 * 1000;
                      
                      return (
                        <div
                          key={product.product_id}
                          className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-100 border-blue-300'
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                          onClick={() => toggleProductSelection(product)}
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // Handled by parent click
                              className="w-4 h-4 text-blue-600"
                            />
                            <div>
                              <p className="font-medium">{product.product_name}</p>
                              <p className="text-sm text-gray-500">
                                Count: {product.count} | Expires: {new Date(product.expiry_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {isExpiring && (
                            <span className="bg-orange-200 text-orange-800 px-2 py-1 rounded-full text-xs">
                              Expiring Soon
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                {selectedProducts.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-green-600">
                      Selected: {selectedProducts.map(p => p.product_name).join(', ')}
                    </p>
                  </div>
                )}
              </div>

              {/* Location Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pickup Location
                </label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={useMyLocation}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors text-sm"
                  >
                    📍 Use My Current Location
                  </button>
                  {userLocation ? (
                    <p className="text-sm text-gray-600">
                      Location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                    </p>
                  ) : (
                    <p className="text-sm text-red-600">Location not available. Please allow location access.</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setSelectedProducts([]);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || selectedProducts.length === 0 || !userLocation}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating..." : "Create Donation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* My Donations */}
      <div>
        <h2 className="text-xl font-semibold mb-4">My Donations</h2>
        {donations.length === 0 ? (
          <p className="text-gray-500">No donations yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {donations.map((donation) => (
              <div key={donation.donation_id} className="bg-white p-4 rounded-lg shadow border">
                <div className="mb-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      donation.status === "Diajukan"
                        ? "bg-yellow-100 text-yellow-800"
                        : donation.status === "Siap Dijemput"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {donation.status}
                  </span>
                </div>
                
                <div className="space-y-1 text-sm">
                  <p><strong>Foods:</strong> {donation.type_of_food.join(", ")}</p>
                  <p><strong>Location:</strong> {donation.latitude.toFixed(4)}, {donation.longitude.toFixed(4)}</p>
                  <p><strong>Created:</strong> {new Date(donation.created_at).toLocaleString()}</p>
                  <p><strong>Expires:</strong> {new Date(donation.expires_at).toLocaleString()}</p>
                  {donation.receiver_name && (
                    <p><strong>Receiver:</strong> {donation.receiver_name}</p>
                  )}
                </div>
                
                {/* Cancel button - only show for pending donations */}
                {donation.status === "Diajukan" && (
                  <div className="mt-3">
                    <button 
                      onClick={() => handleCancelDonation(donation.donation_id)}
                      className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded transition-colors text-sm"
                    >
                      Cancel Donation
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nearby Donations */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Nearby Donations</h2>
        {nearbyDonations.length === 0 ? (
          <p className="text-gray-500">No nearby donations found.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {nearbyDonations.map((donation) => (
              <div key={donation.donation_id} className="bg-white p-4 rounded-lg shadow border">
                <div className="mb-2 flex justify-between items-center">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      donation.status === "Diajukan"
                        ? "bg-yellow-100 text-yellow-800"
                        : donation.status === "Siap Dijemput"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {donation.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    {donation.distance_km.toFixed(1)} km away
                  </span>
                </div>
                
                <div className="space-y-1 text-sm">
                  <p><strong>Foods:</strong> {donation.type_of_food.join(", ")}</p>
                  <p><strong>Donor:</strong> {donation.donor_name || "Anonymous"}</p>
                  <p><strong>Location:</strong> {donation.latitude.toFixed(4)}, {donation.longitude.toFixed(4)}</p>
                  <p><strong>Expires:</strong> {new Date(donation.expires_at).toLocaleString()}</p>
                </div>
                
                {donation.status === "Diajukan" && (
                  <button className="mt-3 w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded transition-colors text-sm">
                    Claim Donation
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DonationPage;
