import { useState } from "react";
import { Link } from "react-router-dom";

interface NavbarProps {
  currentPage?:
    | "home"
    | "donation"
    | "notification"
    | "reward"
    | "product"
    | "map"
    | "recipes";
  unreadNotifications?: number;
  userInfo?: {
    name?: string;
    email: string;
    poin: number;
    rank: string;
    user_id: number;
  };
  onLogout?: () => void;
}

export default function Navbar({
  currentPage = "home",
  unreadNotifications = 0,
  userInfo,
  onLogout,
}: NavbarProps) {
  const [open, setOpen] = useState(false);

  const navItems = [
    { id: "home" as const, label: "Home", icon: "🏠" },
    { id: "donation" as const, label: "Donations", icon: "🍽️" },
    { id: "product" as const, label: "Products", icon: "📦" },
    { id: "map" as const, label: "Donation Map", icon: "🗺️" },
    { id: "recipes" as const, label: "Recipes", icon: "📝" },
    {
      id: "notification" as const,
      label: "Notifications",
      icon: "🔔",
      badge: unreadNotifications,
    },
    { id: "reward" as const, label: "Rewards", icon: "🏆" },
  ];

  const getRoutePath = (id: string) => {
    return id === "home" ? "/" : `/${id}`;
  };

  return (
    <header className="bg-white shadow-lg border-b-2 border-green-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div className="text-3xl animate-bounce">🍃</div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                Monggu
              </h1>
              <p className="text-sm text-gray-500 font-medium">
                Food Donation Platform
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.id}
                to={getRoutePath(item.id)}
                onClick={() => setOpen(false)}
                className={`relative flex flex-col items-center gap-1 px-4 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                  currentPage === item.id
                    ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-200"
                    : "text-gray-600 hover:bg-green-50 hover:text-green-600 hover:shadow-md"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-xs font-semibold">{item.label}</span>

                {/* Notification Badge */}
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse shadow-lg">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* User Info & Mobile Menu */}
          <div className="flex items-center space-x-4">
            {/* User Info */}
            {userInfo && (
              <div className="hidden lg:flex items-center space-x-4">
                <div className="bg-gradient-to-r from-gray-50 to-green-50 rounded-xl px-4 py-2 border border-green-100">
                  <p className="font-bold text-gray-800 text-sm">
                    {userInfo.name || userInfo.email.split("@")[0]}
                  </p>
                  <div className="flex items-center space-x-3 text-xs mt-1">
                    <span className="bg-green-500 text-white px-2 py-1 rounded-full font-bold">
                      {userInfo.poin} pts
                    </span>
                    <span className="bg-purple-500 text-white px-2 py-1 rounded-full font-bold">
                      {userInfo.rank}
                    </span>
                  </div>
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    Logout
                  </button>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-3 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-200"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
            >
              <span className="text-2xl font-bold">{open ? "✕" : "☰"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {open && (
        <div className="md:hidden bg-white border-t border-green-100 shadow-lg">
          <div className="px-6 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.id}
                to={getRoutePath(item.id)}
                onClick={() => setOpen(false)}
                className={`relative w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                  currentPage === item.id
                    ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg"
                    : "text-gray-600 hover:bg-green-50 hover:text-green-600"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-semibold">{item.label}</span>

                {/* Notification Badge */}
                {item.badge && item.badge > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </Link>
            ))}

            {/* Mobile User Info */}
            {userInfo && (
              <div className="border-t border-green-100 pt-4 mt-4">
                <div className="bg-gradient-to-r from-gray-50 to-green-50 rounded-xl p-4 border border-green-100">
                  <p className="font-bold text-gray-800">
                    {userInfo.name || userInfo.email}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {userInfo.poin} points
                    </span>
                    <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {userInfo.rank}
                    </span>
                  </div>
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="w-full mt-3 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg"
                  >
                    Logout
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
