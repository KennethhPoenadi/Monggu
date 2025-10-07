// API utility functions for donation QR code functionality

const API_BASE_URL = '/api';

export interface DonationPickupRequest {
  donation_id: number;
  receiver_user_id: number;
}

export interface QRCodeVerification {
  qr_hash: string;
}

export interface DonationData {
  donation_id: number;
  type_of_food: string[];
  status: string;
  donor_name: string;
  receiver_name?: string;
  pickup_code?: string;
  verification_token?: string;
  latitude: number;
  longitude: number;
  created_at: string;
  expires_at: string;
}

export interface ApiResponse<T> {
  status: string;
  message?: string;
  data?: T;
  detail?: string;
  donation?: T;
  donations?: T[];
}

// Accept a donation and generate QR code
export const acceptDonation = async (donationId: number, receiverUserId: number): Promise<ApiResponse<DonationData>> => {
  const response = await fetch(`${API_BASE_URL}/donations/${donationId}/accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      donation_id: donationId,
      receiver_user_id: receiverUserId
    })
  });
  
  return response.json();
};

// Get QR code image for a donation
export const getQRCodeUrl = (donationId: number): string => {
  return `${API_BASE_URL}/donations/${donationId}/qrcode`;
};

// Verify QR code for pickup
export const verifyPickup = async (qrHash: string): Promise<ApiResponse<{ donation_id: number }>> => {
  const response = await fetch(`${API_BASE_URL}/donations/verify-pickup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      qr_hash: qrHash
    })
  });
  
  return response.json();
};

// Complete donation pickup with verification code - REMOVED (now done in single step)
// export const completeDonation = async (donationId: number, pickupCode: string): Promise<ApiResponse<{ donation_id: number }>> => {

// Get donation details
export const getDonation = async (donationId: number): Promise<ApiResponse<DonationData>> => {
  const response = await fetch(`${API_BASE_URL}/donations/${donationId}`);
  return response.json();
};

// Utility function to get current user ID from storage
export const getCurrentUserId = (): number | null => {
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      return user.user_id || user.id;
    }
  } catch (error) {
    console.error('Error getting user ID from storage:', error);
  }
  return null;
};