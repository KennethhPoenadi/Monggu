import React, { useState } from 'react';

const QRTestPage: React.FC = () => {
  const [donationId, setDonationId] = useState<string>('');
  const [qrHash, setQrHash] = useState<string>('');

  // Simulate the hashing function that matches backend
  const generateQrHash = (id: number): string => {
    const salt = "260605";
    const rawString = `${id}:${salt}`;
    
    // Simple hash simulation (in production, this should match backend exactly)
    return btoa(rawString).substring(0, 16);
  };

  const handleGenerateHash = () => {
    if (donationId) {
      const hash = generateQrHash(parseInt(donationId));
      setQrHash(hash);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">QR Code Test</h2>
      
      <div className="mb-4">
        <label htmlFor="donationId" className="block text-sm font-medium text-gray-700 mb-2">
          Donation ID:
        </label>
        <input
          type="number"
          id="donationId"
          value={donationId}
          onChange={(e) => setDonationId(e.target.value)}
          placeholder="Enter donation ID"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        onClick={handleGenerateHash}
        className="w-full mb-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Generate QR Hash
      </button>

      {qrHash && (
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="text-sm font-medium text-gray-700 mb-1">QR Hash:</p>
          <p className="text-xs break-all">{qrHash}</p>
        </div>
      )}

      {donationId && (
        <div className="text-center">
          <p className="mb-2 text-sm text-gray-600">QR Code for Donation {donationId}:</p>
          <img 
            src={`/api/donations/${donationId}/qrcode`} 
            alt="QR Code" 
            className="mx-auto border"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling!.textContent = 'Failed to load QR code';
            }}
          />
          <p className="text-red-500 text-sm mt-2" style={{ display: 'none' }}>
            Failed to load QR code
          </p>
        </div>
      )}

      <div className="mt-6 p-4 bg-yellow-50 rounded">
        <h3 className="font-semibold text-yellow-800 mb-2">Testing Instructions:</h3>
        <ol className="text-sm text-yellow-700 space-y-1">
          <li>1. Enter a donation ID that exists in your database</li>
          <li>2. Make sure the donation status is 'Siap Dijemput'</li>
          <li>3. Generate the QR hash to see what the QR code contains</li>
          <li>4. View the QR code image</li>
          <li>5. Use the scanner page to test scanning</li>
        </ol>
      </div>
    </div>
  );
};

export default QRTestPage;