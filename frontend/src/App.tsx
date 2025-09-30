import Navbar from "./components/navbar";
import Footer from "./components/footer";
import "./index.css";
import LoginGoogle from "../src/components/login/LoginGoogle";
import { useEffect, useState } from "react";
import type { User } from "./types/user";

type UserInfo = User & { name?: string };

function Dashboard({
  userInfo,
  onLogout,
}: {
  userInfo: UserInfo;
  onLogout: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-800">
              Selamat datang, {userInfo.name || userInfo.email}!
            </h1>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition duration-200"
            >
              Logout
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-100 p-4 rounded">
              <h3 className="font-semibold text-blue-800">User ID</h3>
              <p className="text-blue-600">{userInfo.user_id}</p>
            </div>
            <div className="bg-green-100 p-4 rounded">
              <h3 className="font-semibold text-green-800">Poin</h3>
              <p className="text-green-600">{userInfo.poin || 0}</p>
            </div>
            <div className="bg-purple-100 p-4 rounded">
              <h3 className="font-semibold text-purple-800">Rank</h3>
              <p className="text-purple-600">{userInfo.rank || "beginner"}</p>
            </div>
          </div>
        </div>
      </div>
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
