import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCodeScanner from '../components/QRCodeScanner';
import ExpiryWarning from '../components/ExpiryWarning';

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
  
  // QR Scanner states
  const [showQRScanner, setShowQRScanner] = useState(false);

  useEffect(() => {
    loadUserProfile(user_id);
    loadClaimedDonations(user_id);

    // Check if there's a newly claimed donation from localStorage
    const claimedDonationId = localStorage.getItem('claimedDonationId');
    if (claimedDonationId) {
      setSelectedDonationId(parseInt(claimedDonationId));
      localStorage.removeItem('claimedDonationId'); // Remove after using
    }
  }, [user_id]);

  // Function to open Google Maps navigation
  const openInGoogleMaps = (latitude: number, longitude: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    window.open(url, '_blank');
  };

  const loadUserProfile = async (userId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/accounts/${userId}`);
      const data = await response.json();
      if (data.status === 'success') {
        setUserProfile(data.account);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadClaimedDonations = async (userId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/donations/user/${userId}/claimed`);
      const data = await response.json();
      if (data.status === 'success') {
        setClaimedDonations(data.donations);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading claimed donations:', error);
      setLoading(false);
    }
  };

  const handleScanQR = () => {
    setShowQRScanner(true);
  };

  const handleQRScanSuccess = async (scannedData: string) => {
    try {
      const response = await fetch('http://localhost:8000/donations/verify-pickup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qr_hash: scannedData
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        alert(`Pickup verified successfully!`);
        setShowQRScanner(false);
        loadUserProfile(user_id); // Refresh profile to update points
      } else {
        alert(`Verification failed: ${data.detail}`);
      }
    } catch (error) {
      console.error('Error verifying pickup:', error);
      alert('Failed to verify pickup');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading profile...</div>
      </div>
    );
  }

  // Check for expiring items (mock data for demo)
  const expiringItems = claimedDonations
    .filter(donation => {
      const expiryDate = new Date(donation.expires_at);
      const today = new Date();
      const diffTime = expiryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 2 && diffDays > 0;
    })
    .flatMap(donation => donation.type_of_food);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>
      
      {/* Food Expiry Warning */}
      {expiringItems.length > 0 && (
        <ExpiryWarning 
          foodItems={expiringItems} 
          expiryDays={2} 
        />
      )}
      
      {/* User Profile Section */}
      {userProfile && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">User Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Name</p>
              <p className="font-semibold text-lg">{userProfile.name}</p>
            </div>
            <div>
              <p className="text-gray-600">Email</p>
              <p className="font-semibold text-lg">{userProfile.email}</p>
            </div>
            <div>
              <p className="text-gray-600">Points</p>
              <p className="font-semibold text-lg text-green-600">{userProfile.poin} points</p>
            </div>
          </div>
        </div>
      )}

      {/* Claimed Donations Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">My Claimed Donations</h2>
        {claimedDonations.length === 0 ? (
          <p className="text-gray-600">No claimed donations yet.</p>
        ) : (
          <div className="space-y-4">
            {claimedDonations.map((donation) => (
              <div key={donation.donation_id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{donation.type_of_food.join(', ')}</h3>
                    <p className="text-sm text-gray-600">From: {donation.donor_name}</p>
                    <p className="text-sm text-gray-600">Status: {donation.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      Expires: {new Date(donation.expires_at).toLocaleDateString()}
                    </p>
                    <button
                      onClick={() => openInGoogleMaps(donation.latitude, donation.longitude)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs transition-colors"
                    >
                      🗺️ Navigate
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pickup Instructions Section */}
      {selectedDonationId && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Pickup Instructions</h2>
          <div className="text-center">
            <p className="mb-4 text-gray-600">
              When you arrive at the pickup location:
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-blue-800 mb-2">📱 For Pickup Verification:</h3>
              <ol className="text-left text-blue-700 text-sm space-y-1">
                <li>1. Navigate to the pickup location using the button above</li>
                <li>2. Meet the donor at the location</li>
                <li>3. Ask the donor to show their QR code</li>
                <li>4. Use the "Scan QR for Pickup Verification" button below</li>
                <li>5. Scan the donor's QR code to complete pickup</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={handleScanQR}
          className="bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-colors"
        >
          Scan QR for Pickup Verification
        </button>
        
        <button
          onClick={() => navigate('/donation')}
          className="bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-colors"
        >
          Browse Donations
        </button>
      </div>

      {/* AI Chatbot Info */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">🤖</span>
          <div>
            <h3 className="font-semibold text-purple-800">AI Recipe Assistant Available</h3>
            <p className="text-purple-700 text-sm">
              Look for the floating AI button (🤖) at the bottom-right corner of any page to chat about recipes and cooking tips!
            </p>
          </div>
        </div>
      </div>
      
      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">Scan QR Code for Pickup</h3>
              <p className="text-sm text-gray-600 mb-4">
                Point your camera at the donor's QR code to verify pickup
              </p>
              
              {/* QR Scanner */}
              <div className="mb-4">
                <QRCodeScanner onScanSuccess={handleQRScanSuccess} />
              </div>
              
              <button
                onClick={() => setShowQRScanner(false)}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;