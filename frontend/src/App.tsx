import { Routes, Route, useLocation, BrowserRouter } from "react-router-dom";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import DonationPage from "./components/donation/DonationPage";
import NotificationPage from "./components/notification/NotificationPage";
import RewardPage from "./components/reward/RewardPage";
import HomePage from "./pages/HomePage";
import ProductPage from "./pages/ProductPage";
import MapPage from "./pages/MapPage";
import RecipesPage from "./pages/RecipesPage";
import AIFoodPage from "./pages/AIFoodPage";
import AdminPage from "./pages/AdminPage";
import ProtectedRoute from "./components/ProtectedRoute";
import "./index.css";
import { useEffect, useState, useCallback } from "react";
import type { User } from "./types/user";
import LoadingScreen from "./loading";
import NotFoundPage from "./notfound";

type UserInfo = User & { name?: string };

function Dashboard({
  userInfo,
  onLogout,
}: {
  userInfo: UserInfo;
  onLogout: () => void;
}) {
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const location = useLocation();

  // Get current page from URL path
  const getCurrentPageFromPath = (pathname: string) => {
    switch (pathname) {
      case "/":
        return "home";
      case "/donation":
        return "donation";
      case "/notification":
        return "notification";
      case "/reward":
        return "reward";
      case "/product":
        return "product";
      case "/map":
        return "map";
      case "/recipes":
        return "recipes";
      case "/ai-food":
        return "ai-food";
      case "/admin":
        return "admin";
      default:
        return "home";
    }
  };

  const currentPage = getCurrentPageFromPath(location.pathname);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        currentPage={currentPage}
        unreadNotifications={unreadNotifications}
        userInfo={userInfo}
        onLogout={onLogout}
      />

      <div className="">
        <Routes>
          <Route path="/" element={<HomePage userInfo={userInfo} />} />
          <Route path="/donation" element={<DonationPage user_id={userInfo.user_id} />} />
          <Route path="/notification" element={<NotificationPage user_id={userInfo.user_id} />} />
          <Route path="/reward" element={<RewardPage user_id={userInfo.user_id} />} />
          <Route path="/product" element={<ProductPage user_id={userInfo.user_id} />} />
          <Route path="/map" element={<MapPage user_id={userInfo.user_id} />} />
          <Route path="/recipes" element={<RecipesPage user_id={userInfo.user_id} />} />
          <Route path="/ai-food" element={<AIFoodPage />} />
          <Route path="/admin" element={<AdminPage user_id={userInfo.user_id} />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>

      <Footer />
    </div>
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

    if (loginSuccessUserId) {
      fetch(`http://localhost:8000/auth/user/${loginSuccessUserId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "success") {
            localStorage.setItem("userInfo", JSON.stringify(data.user));
            setUserInfo(data.user);
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

    if (errorParam) {
      setError(errorParam);
      setLoading(false);
      return;
    }

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
    return <LoadingScreen />;
  }

  return (
    <BrowserRouter>
      <ProtectedRoute userInfo={userInfo} error={error || undefined}>
        <Dashboard userInfo={userInfo!} onLogout={handleLogout} />
      </ProtectedRoute>
    </BrowserRouter>
  );
}
