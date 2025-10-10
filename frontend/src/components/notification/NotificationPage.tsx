import React, { useState, useEffect, useCallback, useRef } from "react";
import { NotificationType, type Notification } from "../../types/notification";

interface NotificationPageProps {
  user_id: number;
}

const NotificationPage: React.FC<NotificationPageProps> = ({ user_id }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const ws = useRef<WebSocket | null>(null);

  // --- load
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/notifications/user/${user_id}`);
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

    // Initialize WebSocket connection
    ws.current = new WebSocket(`ws://localhost:8000/ws/notifications/${user_id}`);

    ws.current.onmessage = (event) => {
      const newNotification: Notification = JSON.parse(event.data);
      setNotifications((prev) => [newNotification, ...prev]);
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.current.onclose = () => {
      console.log("WebSocket connection closed.");
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [loadNotifications, user_id]);

  // --- actions
  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/notifications/${notificationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_read: true }),
      });
      const data = await response.json();
      if (data.status === "success") {
        setNotifications((prev) =>
          prev.map((n) => (n.notification_id === notificationId ? { ...n, is_read: true } : n))
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/notifications/user/${user_id}/mark-all-read`,
        { method: "PUT" }
      );
      const data = await response.json();
      if (data.status === "success") {
        setNotifications((prev) => prev.filter((n) => n.is_read));
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  // --- ui helpers
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

  const leftBorderByType = (type: NotificationType) => {
    switch (type) {
      case NotificationType.DonationApproved:
        return "border-l-emerald-500";
      case NotificationType.DonationReceived:
        return "border-l-sky-500";
      case NotificationType.ProductExpiring:
        return "border-l-amber-500";
      case NotificationType.RewardEarned:
        return "border-l-yellow-500";
      case NotificationType.SystemAnnouncement:
        return "border-l-violet-500";
      default:
        return "border-l-slate-500";
    }
  };

  // warna glow (rgba) by type
  const glowRGBA = (type: NotificationType) => {
    switch (type) {
      case NotificationType.DonationApproved:
        return "rgba(16,185,129,.12)"; // emerald-500
      case NotificationType.DonationReceived:
        return "rgba(56,189,248,.12)"; // sky-400
      case NotificationType.ProductExpiring:
        return "rgba(245,158,11,.12)"; // amber-500
      case NotificationType.RewardEarned:
        return "rgba(234,179,8,.12)"; // yellow-500
      case NotificationType.SystemAnnouncement:
        return "rgba(139,92,246,.12)"; // violet-500
      default:
        return "rgba(148,163,184,.12)"; // slate-400
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filteredNotifications = notifications.filter((n) =>
    filter === "unread" ? !n.is_read : true
  );

  // follow-mouse glow handler
  const handleGlowMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--y", `${e.clientY - rect.top}px`);
  };
  const handleGlowLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget as HTMLElement;
    el.style.removeProperty("--x");
    el.style.removeProperty("--y");
  };

  useEffect(() => {
    const checkExpiringProducts = async () => {
      try {
        const response = await fetch(`http://localhost:8000/products/user/${user_id}/expiring?days=3`);
        const data = await response.json();
        if (data.status === "success" && data.products.length > 0) {
          const expiringNotifications = data.products.map((product: { product_id: number; product_name: string; expiry_date: string }) => ({
            notification_id: `expiring-${product.product_id}`,
            title: "Product Expiring Soon",
            message: `${product.product_name} will expire on ${new Date(product.expiry_date).toLocaleDateString()}. Please take action!`,
            notification_type: NotificationType.ProductExpiring,
            is_read: false,
            created_at: new Date().toISOString(),
          }));
          setNotifications((prev) => [...expiringNotifications, ...prev]);
        }
      } catch (error) {
        console.error("Error checking expiring products:", error);
      }
    };

    checkExpiringProducts();
  }, [user_id]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
      {/* dekor blob */}
      <svg
        className="pointer-events-none absolute -left-24 -top-24 h-[36rem] w-[36rem] opacity-20 blur-3xl"
        viewBox="0 0 200 200"
        aria-hidden="true"
      >
        <path
          d="M53.6,-58.2C67.2,-45.5,74.9,-24.7,73.8,-5.7C72.8,13.3,63.1,26.6,49.5,38.9C36,51.3,18,62.7,-0.3,63.1C-18.5,63.6,-36.9,53.1,-49.1,39.6C-61.3,26.1,-67.3,9.6,-65.7,-6.1C-64.1,-21.7,-54.8,-36.5,-42.1,-49.5C-29.4,-62.6,-14.7,-73.9,3.1,-77.9C20.9,-81.9,41.9,-78.6,53.6,-58.2Z"
          transform="translate(100 100)"
          className="fill-sky-500/25"
        />
      </svg>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Header card */}
        <section className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-8 shadow-xl backdrop-blur-xl">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
              📱 Notifications
            </h1>
            <p className="mt-3 text-slate-300">Stay updated with your donation activities</p>
          </div>

          <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`rounded-2xl px-6 py-3 font-semibold transition-all ${
                  filter === "all"
                    ? "bg-sky-600 text-white shadow hover:bg-sky-700"
                    : "border border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-900"
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`rounded-2xl px-6 py-3 font-semibold transition-all ${
                  filter === "unread"
                    ? "bg-emerald-600 text-white shadow hover:bg-emerald-700"
                    : "border border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-900"
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="rounded-2xl bg-gradient-to-r from-emerald-600 to-sky-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:scale-[1.01] hover:from-emerald-700 hover:to-sky-700 hover:shadow-emerald-600/20"
              >
                ✅ Mark All as Read
              </button>
            )}
          </div>

          {unreadCount > 0 && (
            <div className="mt-6 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-2xl bg-rose-500/15 px-4 py-2 font-medium text-rose-300">
                🔔 {unreadCount} unread
              </span>
            </div>
          )}
        </section>

        {/* Loading */}
        {loading && (
          <div className="py-12 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-600 border-t-sky-500" />
            <p className="mt-4 text-slate-300">Loading notifications...</p>
          </div>
        )}

        {/* List */}
        {!loading && (
          <section className="mt-8 space-y-4">
            {filteredNotifications.map((n) => {
              const isUnread = !n.is_read;
              return (
                <div
                  key={n.notification_id}
                  onClick={() => isUnread && markAsRead(n.notification_id)}
                  onMouseMove={handleGlowMove}
                  onMouseLeave={handleGlowLeave}
                  className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-6 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl ${leftBorderByType(
                    n.notification_type
                  )} ${
                    isUnread
                      ? "border-slate-700/60 bg-slate-900/70"
                      : "border-slate-700/50 bg-slate-900/60"
                  }`}
                >
                  {/* glow overlay mengikuti kursor */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -z-10 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(600px circle at var(--x, 50%) var(--y, 50%), ${glowRGBA(
                        n.notification_type
                      )}, transparent 40%)`,
                    }}
                  />

                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-3 text-2xl">
                      {getNotificationIcon(n.notification_type)}
                    </div>

                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-3">
                        <h3
                          className={`text-lg font-bold ${
                            isUnread ? "text-sky-200" : "text-slate-100"
                          }`}
                        >
                          {n.title}
                        </h3>
                        {isUnread && <span className="h-2 w-2 animate-pulse rounded-full bg-sky-400" />}
                      </div>

                      <p className="mb-3 leading-relaxed text-slate-300">{n.message}</p>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                        <span className="rounded-lg border border-slate-700 bg-slate-800/60 px-2 py-1 font-medium">
                          {String(n.notification_type)}
                        </span>
                        <span>•</span>
                        <span>{new Date(n.created_at).toLocaleString()}</span>
                        {n.is_read && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-300">Read</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredNotifications.length === 0 && (
              <div className="grid place-items-center rounded-3xl border border-slate-700/60 bg-slate-900/70 p-16 text-center shadow-xl">
                <div className="mb-6 text-8xl">📭</div>
                <h3 className="mb-3 text-2xl font-bold text-slate-100">
                  {filter === "unread" ? "No unread notifications" : "No notifications yet"}
                </h3>
                <p className="text-slate-400">
                  {filter === "unread"
                    ? "All caught up! You have no unread notifications."
                    : "Notifications about your donations and rewards will appear here."}
                </p>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default NotificationPage;
