import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';

interface DonationData {
  donation_id: number;
  type_of_food: string[];
  status: string;
  donor_name: string;
  qr_hash?: string;
}

const DonationPickupPage: React.FC = () => {
  const { donationId } = useParams<{ donationId: string }>();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [donationData, setDonationData] = useState<DonationData | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  // Get current user ID from localStorage or context
  const getCurrentUserId = () => {
    // This should be implemented based on your auth system
    const userData = localStorage.getItem('user');
    if (userData) {
      return JSON.parse(userData).user_id;
    }
    return null;
  };

  const loadDonationData = useCallback(async () => {
    if (!donationId) return;
    
    try {
      const response = await fetch(`/api/donations/${donationId}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setDonationData(data.donation);
        
        // If donation is already accepted and ready for pickup, show QR code
        if (data.donation.status === 'Siap Dijemput') {
          setQrCodeUrl(`/api/donations/${donationId}/qrcode`);
        }
      }
    } catch (err) {
      console.error('Error loading donation:', err);
    }
  }, [donationId]);

  const acceptDonation = async () => {
    if (!donationId) return;
    
    const userId = getCurrentUserId();
    if (!userId) {
      setError('You must be logged in to accept donations');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/donations/${donationId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          donation_id: parseInt(donationId),
          receiver_user_id: userId
        })
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        setDonationData(data.donation);
        // Generate QR code URL
        setQrCodeUrl(`/api/donations/${donationId}/qrcode`);
      } else {
        setError(data.detail || 'Failed to accept donation');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error accepting donation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonationData();
  }, [loadDonationData]);

  if (!donationId) {
    return <div className="p-4">Invalid donation ID</div>;
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Donation Pickup</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {donationData && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Donation Details</h3>
          <div className="bg-gray-50 p-4 rounded">
            <p><strong>Food Items:</strong> {donationData.type_of_food?.join(', ') || 'N/A'}</p>
            <p><strong>Status:</strong> {donationData.status}</p>
            <p><strong>Donor:</strong> {donationData.donor_name}</p>
          </div>
        </div>
      )}
      
      {donationData?.status === 'Diajukan' && (
        <div className="text-center">
          <button
            onClick={acceptDonation}
            disabled={loading}
            className={`px-6 py-3 rounded text-white font-semibold ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {loading ? 'Accepting...' : 'Accept Donation'}
          </button>
        </div>
      )}
      
      {donationData?.status === 'Siap Dijemput' && qrCodeUrl && (
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">Show this QR Code to the Donor</h3>
          <div className="bg-white p-4 rounded border-2 border-gray-300">
            <img 
              src={qrCodeUrl} 
              alt="Pickup QR Code" 
              className="mx-auto max-w-full h-auto"
              style={{ maxWidth: '250px' }}
            />
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded">
            <p className="text-sm text-blue-800">
              <strong>Instructions:</strong> Show this QR code to the donor to complete pickup
            </p>
            <p className="text-xs text-blue-600 mt-1">
              The donor will scan this code to verify and complete the donation
            </p>
          </div>
        </div>
      )}
      
      {donationData?.status === 'Diterima' && (
        <div className="text-center p-4 bg-green-50 rounded">
          <p className="text-green-800 font-semibold">
            ✅ Pickup completed successfully!
          </p>
          <p className="text-sm text-green-600 mt-1">
            Thank you for participating in food sharing
          </p>
        </div>
      )}
    </div>
  );
};

export default DonationPickupPage;