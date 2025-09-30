import React from "react";

interface MainNavigationProps {
  currentPage: "donation" | "notification" | "reward" | "product";
  onPageChange: (
    page: "donation" | "notification" | "reward" | "product"
  ) => void;
  unreadNotifications?: number;
}

const MainNavigation: React.FC<MainNavigationProps> = ({
  currentPage,
  onPageChange,
  unreadNotifications = 0,
}) => {
  const navItems = [
    {
      id: "donation" as const,
      label: "Donations",
      icon: "🍽️",
      description: "Manage food donations",
    },
    {
      id: "product" as const,
      label: "Products",
      icon: "📦",
      description: "Track your products",
    },
    {
      id: "notification" as const,
      label: "Notifications",
      icon: "🔔",
      description: "View your notifications",
      badge: unreadNotifications,
    },
    {
      id: "reward" as const,
      label: "Rewards",
      icon: "🏆",
      description: "Claim your rewards",
    },
  ];

  return (
    <nav className="bg-white shadow-sm border-b mb-6">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-green-600">🍃 Monggu</h1>
            <span className="ml-2 text-sm text-gray-500">
              Food Donation App
            </span>
          </div>

          {/* Navigation Items */}
          <div className="flex space-x-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  currentPage === item.id
                    ? "bg-green-100 text-green-800 border-2 border-green-200"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>

                {/* Notification Badge */}
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Page Description */}
        <div className="pb-4">
          {navItems.map(
            (item) =>
              item.id === currentPage && (
                <p key={item.id} className="text-sm text-gray-600">
                  {item.description}
                </p>
              )
          )}
        </div>
      </div>
    </nav>
  );
};

export default MainNavigation;
