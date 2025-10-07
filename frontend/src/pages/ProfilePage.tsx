import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCodeScanner from '../components/QRCodeScanner';

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
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
    window.open(googleMapsUrl, '_blank');
  };

  const loadUserProfile = async (userId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/users/${userId}`);
      const data = await response.json();
      if (data.status === 'success') {
        setUserProfile({
          user_id: data.user.user_id,
          name: data.user.email ? data.user.email.split('@')[0] : 'User', // Extract name from email with fallback
          email: data.user.email || '',
          poin: data.user.poin || 0
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadClaimedDonations = async (userId: number) => {
    try {
      // Get donations where this user is the receiver
      const response = await fetch(`http://localhost:8000/donations/?user_id=${userId}&active_only=false`);
      const data = await response.json();
      if (data.status === 'success') {
        // Filter donations where current user is receiver and status is "Siap Dijemput"
        const claimed = data.donations.filter((donation: ClaimedDonation & { receiver_user_id: number }) => 
          donation.receiver_user_id === userId && 
          (donation.status === 'Siap Dijemput' || donation.status === 'Diterima')
        );
        setClaimedDonations(claimed);
      }
    } catch (error) {
      console.error('Error loading claimed donations:', error);
    } finally {
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>
      
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
          <p className="text-gray-500">No claimed donations yet.</p>
        ) : (
          <div className="space-y-4">
            {claimedDonations.map((donation) => (
              <div 
                key={donation.donation_id} 
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedDonationId === donation.donation_id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedDonationId(donation.donation_id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">Donation #{donation.donation_id}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    donation.status === 'Siap Dijemput' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {donation.status}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Food Items:</strong> {donation.type_of_food.join(', ')}</p>
                  <p><strong>Donor:</strong> {donation.donor_name}</p>
                  <p><strong>Claimed:</strong> {new Date(donation.created_at).toLocaleString()}</p>
                  <p><strong>Expires:</strong> {new Date(donation.expires_at).toLocaleString()}</p>
                  {/* Add location and navigate button */}
                  <div className="flex items-center justify-between mt-2">
                    <span><strong>Location:</strong> {donation.latitude?.toFixed(4) || 'N/A'}, {donation.longitude?.toFixed(4) || 'N/A'}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (donation.latitude && donation.longitude) {
                          openInGoogleMaps(donation.latitude, donation.longitude);
                        } else {
                          alert('Location not available for this donation');
                        }
                      }}
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
            
            {/* Pickup verification instructions - no QR display needed */}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={handleScanQR}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-colors"
        >
          Scan QR for Pickup Verification
        </button>
        
        <button
          onClick={() => navigate('/donations')}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-colors"
        >
          Browse Donations
        </button>
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