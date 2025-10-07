import React, { useState } from 'react';
import QRCodeScanner from '../components/QRCodeScanner';

const DonorPickupVerificationPage: React.FC = () => {
  const [verificationStep, setVerificationStep] = useState<'scan' | 'complete'>('scan');
  const [completedDonationId, setCompletedDonationId] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleQRScan = async (qrData: string) => {
    try {
      setLoading(true);
      setError('');
      
      // Send verification request to backend with QR hash
      const response = await fetch('/api/donations/verify-pickup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qr_hash: qrData.trim()
        })
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        setCompletedDonationId(result.donation_id);
        setVerificationStep('complete');
      } else {
        setError(result.detail || 'Failed to verify QR code');
      }
    } catch (err) {
      setError('Invalid QR code or network error');
      console.error('QR verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetVerification = () => {
    setVerificationStep('scan');
    setCompletedDonationId(null);
    setError('');
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Pickup Verification</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
          <button 
            onClick={() => setError('')}
            className="ml-2 text-red-800 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      {verificationStep === 'scan' && (
        <div>
          <p className="mb-4 text-gray-600 text-center">
            Ask the receiver to show you their QR code, then scan it below:
          </p>
          
          <QRCodeScanner
            onScanSuccess={handleQRScan}
            onScanFailure={(error) => setError(`Scan failed: ${error}`)}
          />
          
          {loading && (
            <div className="mt-4 text-center">
              <p className="text-blue-600">Verifying QR code...</p>
            </div>
          )}
        </div>
      )}

      {verificationStep === 'complete' && (
        <div className="text-center">
          <div className="mb-6 p-6 bg-green-50 rounded-lg">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-semibold text-green-800 mb-2">
              Pickup Completed Successfully!
            </h3>
            <p className="text-green-700 mb-2">
              Donation ID: {completedDonationId}
            </p>
            <p className="text-green-700">
              Thank you for your donation. Points have been awarded to both you and the receiver.
            </p>
          </div>
          
          <button
            onClick={resetVerification}
            className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Verify Another Pickup
          </button>
        </div>
      )}
    </div>
  );
};

export default DonorPickupVerificationPage;