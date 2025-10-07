// Notification related types
export const NotificationType = {
  DonationApproved: "Donation Approved",
  DonationReceived: "Donation Received",
  ProductExpiring: "Product Expiring",
  RewardEarned: "Reward Earned",
  SystemAnnouncement: "System Announcement",
} as const;

export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

export interface Notification {
  notification_id: number;
  user_id: number;
  title: string;
  message: string;
  notification_type: NotificationType;
  is_read: boolean;
  created_at: Date;
}

export interface NotificationCreate {
  user_id: number;
  title: string;
  message: string;
  notification_type: NotificationType;
}

export interface NotificationUpdate {
  is_read?: boolean;
}
