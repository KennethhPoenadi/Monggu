// Donation related types
export const DonationStatus = {
  Diajukan: "Diajukan",
  SiapDijemput: "Siap Dijemput",
  Diterima: "Diterima",
} as const;

export type DonationStatus =
  (typeof DonationStatus)[keyof typeof DonationStatus];

export interface Donation {
  donation_id: number;
  user_id: number;
  type_of_food: string[];
  description?: string;
  lat: number;
  lng: number;
  address: string;
  expiry_time: Date;
  status: DonationStatus;
  created_at: Date;
  updated_at: Date;
  // Relations
  user_name?: string;
  user_email?: string;
}

export interface DonationCreate {
  type_of_food: string[];
  description?: string;
  lat: number;
  lng: number;
  address: string;
}

export interface DonationUpdate {
  type_of_food?: string[];
  description?: string;
  lat?: number;
  lng?: number;
  address?: string;
  status?: DonationStatus;
}

export interface DonationSearch {
  lat: number;
  lng: number;
  radius_km?: number;
  status?: DonationStatus;
}

export interface NearbyDonation extends Donation {
  distance_km: number;
}
