import React, { useState, useEffect, useCallback } from "react";
import { NotificationType, type Notification } from "../../types/notification";

interface NotificationPageProps {
  user_id: number;
}

const NotificationPage: React.FC<NotificationPageProps> = ({ user_id }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  // Load notifications
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/notifications/user/${user_id}`
      );
      const data = await response.json();
      if (data.status === "success") {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [user_id]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Mark notification as read
  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(
        `http://localhost:8000/notifications/${notificationId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ is_read: true }),
        }
      );

      const data = await response.json();
      if (data.status === "success") {
        setNotifications(
          notifications.map((notif) =>
            notif.notification_id === notificationId
              ? { ...notif, is_read: true }
              : notif
          )
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/notifications/user/${user_id}/mark-all-read`,
        {
          method: "PUT",
        }
      );

      const data = await response.json();
      if (data.status === "success") {
        setNotifications(
          notifications.map((notif) => ({ ...notif, is_read: true }))
        );
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Get notification icon
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.DonationApproved:
        return "✅";
      case NotificationType.DonationReceived:
        return "🎉";
      case NotificationType.ProductExpiring:
        return "⏰";
      case NotificationType.RewardEarned:
        return "🏆";
      case NotificationType.SystemAnnouncement:
        return "📢";
      default:
        return "📋";
    }
  };

  // Get notification color
  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case NotificationType.DonationApproved:
        return "border-l-green-500";
      case NotificationType.DonationReceived:
        return "border-l-blue-500";
      case NotificationType.ProductExpiring:
        return "border-l-orange-500";
      case NotificationType.RewardEarned:
        return "border-l-yellow-500";
      case NotificationType.SystemAnnouncement:
        return "border-l-purple-500";
      default:
        return "border-l-gray-500";
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "unread") {
      return !notification.is_read;
    }
    return true;
  });

  const unreadCount = notifications.filter((notif) => !notif.is_read).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-sm px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>

          {/* Filters and Actions */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === "unread"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Mark All as Read
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading notifications...</p>
          </div>
        )}

        {/* Notifications List */}
        {!loading && (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.notification_id}
                className={`bg-white rounded-lg shadow-sm border-l-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors ${getNotificationColor(
                  notification.notification_type
                )} ${!notification.is_read ? "bg-blue-50" : ""}`}
                onClick={() =>
                  !notification.is_read &&
                  markAsRead(notification.notification_id)
                }
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">
                    {getNotificationIcon(notification.notification_type)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3
                        className={`font-semibold ${
                          !notification.is_read
                            ? "text-blue-800"
                            : "text-gray-800"
                        }`}
                      >
                        {notification.title}
                      </h3>
                      {!notification.is_read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>

                    <p className="text-gray-600 mb-2">{notification.message}</p>

                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>{notification.notification_type}</span>
                      <span>•</span>
                      <span>
                        {new Date(notification.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredNotifications.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  {filter === "unread"
                    ? "No unread notifications"
                    : "No notifications yet"}
                </h3>
                <p className="text-gray-500">
                  {filter === "unread"
                    ? "All caught up! You have no unread notifications."
                    : "Notifications about your donations and rewards will appear here."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPage;
