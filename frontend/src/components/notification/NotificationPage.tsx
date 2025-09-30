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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-4">
              📱 Notifications
            </h1>
            <p className="text-gray-600 text-lg">
              Stay updated with your donation activities
            </p>
          </div>

          <div className="flex items-center justify-center mb-6">
            {unreadCount > 0 && (
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-2xl shadow-lg">
                <span className="flex items-center gap-2 font-semibold">
                  <span className="animate-pulse">🔔</span>
                  {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          {/* Filters and Actions */}
          <div className="flex flex-wrap gap-4 items-center justify-center">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-6 py-3 rounded-2xl transition-all duration-300 font-semibold ${
                  filter === "all"
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`px-6 py-3 rounded-2xl transition-all duration-300 font-semibold ${
                  filter === "unread"
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-6 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <span className="flex items-center gap-2">
                  <span>✅</span>
                  Mark All as Read
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600 text-lg font-medium">
              Loading notifications...
            </p>
          </div>
        )}

        {/* Notifications List */}
        {!loading && (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.notification_id}
                className={`bg-white rounded-2xl shadow-lg hover:shadow-xl border-l-4 p-6 cursor-pointer transition-all duration-300 transform hover:scale-105 ${getNotificationColor(
                  notification.notification_type
                )} ${
                  !notification.is_read
                    ? "bg-gradient-to-r from-blue-50 to-white"
                    : ""
                }`}
                onClick={() =>
                  !notification.is_read &&
                  markAsRead(notification.notification_id)
                }
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl bg-gray-100 p-3 rounded-2xl">
                    {getNotificationIcon(notification.notification_type)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3
                        className={`font-bold text-lg ${
                          !notification.is_read
                            ? "text-blue-800"
                            : "text-gray-800"
                        }`}
                      >
                        {notification.title}
                      </h3>
                      {!notification.is_read && (
                        <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
                      )}
                    </div>

                    <p className="text-gray-600 mb-3 leading-relaxed">
                      {notification.message}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="bg-gray-100 px-2 py-1 rounded-lg font-medium">
                        {notification.notification_type}
                      </span>
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
              <div className="text-center py-16 bg-white rounded-3xl shadow-lg">
                <div className="text-8xl mb-6">📭</div>
                <h3 className="text-2xl font-bold text-gray-600 mb-3">
                  {filter === "unread"
                    ? "No unread notifications"
                    : "No notifications yet"}
                </h3>
                <p className="text-gray-500 text-lg">
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
