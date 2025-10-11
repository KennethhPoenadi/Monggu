// Reward related types
export const RewardType = {
  VOUCHER: "Voucher",
  DISCOUNT: "Discount", 
  FREE_ITEM: "Free Item",
  BADGE: "Badge",
} as const;

export type RewardType = (typeof RewardType)[keyof typeof RewardType];

export interface Reward {
  reward_id: number;
  name: string;
  description: string;
  points_required: number;
  reward_type: RewardType;
  value: string;  // Changed from number to string to match backend
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  // For user context
  user_reward_id?: number;
  claimed_at?: Date;
  is_used?: boolean;
  used_at?: Date;
  user_points?: number;
  can_claim?: boolean;
}

export interface RewardCreate {
  name: string;
  description: string;
  points_required: number;
  reward_type: RewardType;
  value: string;  // Changed from number to string
  is_active?: boolean;
}

export interface RewardUpdate {
  name?: string;
  description?: string;
  points_required?: number;
  reward_type?: RewardType;
  value?: string;  // Changed from number to string
  is_active?: boolean;
}

export interface UserReward {
  user_reward_id: number;
  user_id: number;
  reward_id: number;
  claimed_at: Date;
  is_used: boolean;
  used_at?: Date;
  // From JOIN with rewards table
  name: string;
  description: string;
  reward_type: RewardType;
  value: string;  // Changed from number to string
}

export interface UserRewardCreate {
  user_id: number;
  reward_id: number;
}
