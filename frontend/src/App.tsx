import Navbar from "./components/navbar";
import Footer from "./components/footer";
import DonationPage from "./components/donation/DonationPage";
import NotificationPage from "./components/notification/NotificationPage";
import RewardPage from "./components/reward/RewardPage";
import HomePage from "./pages/HomePage";
import ProductPage from "./pages/ProductPage";
import MapPage from "./pages/MapPage";
import RecipesPage from "./pages/RecipesPage";
import "./index.css";
import LoginGoogle from "../src/components/login/LoginGoogle";
import { useEffect, useState, useCallback } from "react";
import type { User } from "./types/user";

type UserInfo = User & { name?: string };

function Dashboard({
  userInfo,
  onLogout,
}: {
  userInfo: UserInfo;
  onLogout: () => void;
}) {
  const [currentPage, setCurrentPage] = useState<
    | "home"
    | "donation"
    | "notification"
    | "reward"
    | "product"
    | "map"
    | "recipes"
  >("home");
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Load unread notification count
  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/notifications/user/${userInfo.user_id}`
      );
      const data = await response.json();
      if (data.status === "success") {
        const unread = data.notifications.filter(
          (notif: { is_read: boolean }) => !notif.is_read
        ).length;
        setUnreadNotifications(unread);
      }
    } catch (error) {
      console.error("Error loading unread notifications:", error);
    }
  }, [userInfo.user_id]);

  useEffect(() => {
    loadUnreadCount();
    // Refresh unread count every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [loadUnreadCount]);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "home":
        return <HomePage userInfo={userInfo} />;
      case "donation":
        return <DonationPage user_id={userInfo.user_id} />;
      case "notification":
        return <NotificationPage user_id={userInfo.user_id} />;
      case "reward":
        return <RewardPage user_id={userInfo.user_id} />;
      case "product":
        return <ProductPage user_id={userInfo.user_id} />;
      case "map":
        return <MapPage user_id={userInfo.user_id} />;
      case "recipes":
        return <RecipesPage user_id={userInfo.user_id} />;
      default:
        return (
          <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <div className="text-6xl mb-4">🏠</div>
                <h1 className="text-3xl font-bold text-gray-800 mb-4">
                  Welcome to Monggu
                </h1>
                <p className="text-gray-600">
                  Your food donation platform. Share food, earn points, and make
                  a difference!
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        unreadNotifications={unreadNotifications}
        userInfo={userInfo}
        onLogout={onLogout}
      />

      {/* Main Content */}
      <div className="">{renderCurrentPage()}</div>

      <Footer />
    </div>
  );
}

function LoginPage({ error }: { error?: string }) {
  return (
    <>
      <Navbar />
      <main className="container">
        <h1>Selamat datang di FoodLoop!</h1>
        <p>belmiro dan kenneth ganteng</p>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Login gagal: {error}
          </div>
        )}
        <LoginGoogle />
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get("error");
    const loginSuccessUserId = urlParams.get("login_success");

    // Handle successful login
    if (loginSuccessUserId) {
      // Fetch user info and store in localStorage
      fetch(`http://localhost:8000/auth/user/${loginSuccessUserId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "success") {
            localStorage.setItem("userInfo", JSON.stringify(data.user));
            setUserInfo(data.user);
            // Clean URL
            window.history.replaceState({}, "", "/");
          } else {
            setError("Failed to load user info");
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching user info:", err);
          setError("Failed to connect to server");
          setLoading(false);
        });
      return;
    }

    // Handle error parameters
    if (errorParam) {
      setError(errorParam);
      setLoading(false);
      return;
    }

    // Check localStorage for existing user info
    const storedUserInfo = localStorage.getItem("userInfo");
    if (storedUserInfo) {
      try {
        const userInfo = JSON.parse(storedUserInfo);
        setUserInfo(userInfo);
      } catch (err) {
        console.error("Error parsing stored user info:", err);
        localStorage.removeItem("userInfo");
      }
    }

    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    setUserInfo(null);
    window.history.replaceState({}, "", "/");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (userInfo) {
    return <Dashboard userInfo={userInfo} onLogout={handleLogout} />;
  }

  return <LoginPage error={error || undefined} />;
}
