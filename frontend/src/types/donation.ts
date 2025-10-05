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
  donor_user_id: number;
  receiver_user_id?: number;
  type_of_food: string[];
  latitude: number;
  longitude: number;
  status: DonationStatus;
  created_at: Date;
  expires_at: Date;
  // Relations
  donor_name?: string;
  receiver_name?: string;
}

export interface DonationCreate {
  donor_user_id: number;
  type_of_food: string[];
  latitude: number;
  longitude: number;
  status: DonationStatus;
}

export interface DonationUpdate {
  type_of_food?: string[];
  latitude?: number;
  longitude?: number;
  status?: DonationStatus;
  receiver_user_id?: number;
}

export interface DonationSearch {
  latitude: number;
  longitude: number;
  radius_km?: number;
  status?: DonationStatus;
}

export interface NearbyDonation extends Donation {
  distance_km: number;
}
