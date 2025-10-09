import React, { useEffect, useState } from "react";
import axios from "axios";

interface HomePageProps {
  userInfo: {
    name?: string;
    email?: string;
    poin: number;
    rank: string;
  } | null;
}

const HomePage: React.FC<HomePageProps> = ({ userInfo }) => {
  const [stats, setStats] = useState({
    total_donations: 0,
    active_users: 0,
    successful_pickups: 0,
    co2_saved: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get("http://localhost:8000/donations/stats");
        setStats(response.data);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };

    fetchStats();
  }, []);

  const features = [
    { icon: "🍽️", title: "Food Donations", description: "Share surplus food with those in need", color: "from-emerald-500 to-emerald-600" },
    { icon: "📦", title: "Product Management", description: "Track and manage your food inventory", color: "from-sky-500 to-sky-600" },
    { icon: "🗺️", title: "Donation Map", description: "Find nearby food donations on interactive map", color: "from-violet-500 to-violet-600" },
    { icon: "📝", title: "Recipe Ideas", description: "Get creative recipes to reduce food waste", color: "from-orange-500 to-orange-600" },
    { icon: "🏆", title: "Rewards System", description: "Earn points and rewards for your contributions", color: "from-yellow-500 to-amber-600" },
    { icon: "📱", title: "Real-time Notifications", description: "Stay updated with instant notifications", color: "from-pink-500 to-rose-600" },
  ];

  return (
    <div className="relative min-h-[calc(100vh-120px)] overflow-x-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
      {/* Welcome Back Section */}
      {userInfo && (
        <div className="mx-auto mt-8 max-w-7xl px-6 text-center md:text-left">
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:gap-10">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg md:h-28 md:w-28"
            >
              <span className="text-4xl text-white md:text-6xl">👋</span>
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-slate-100 md:text-4xl">
                Welcome back, <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">{userInfo.name || userInfo.email}</span>!
              </h3>
              <p className="mt-2 text-sm text-slate-400 md:text-lg">
                We're thrilled to have you here. Let's make a difference together!
              </p>
              <div className="mt-4 flex flex-col items-center gap-4 md:flex-row md:items-center md:gap-6">
                <span className="flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-600 md:text-lg">
                  <span className="text-lg">⭐</span>
                  <span className="font-extrabold text-yellow-700">{userInfo.poin} Points</span>
                </span>
                <span className="flex items-center gap-2 rounded-full bg-purple-100 px-4 py-2 text-sm font-medium text-purple-600 md:text-lg">
                  <span className="text-lg">🏆</span>
                  <span className="font-extrabold text-purple-700 capitalize">{userInfo.rank}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Section */}
      <section className="mt-12 rounded-2xl border border-slate-700/60 bg-slate-900/50 p-8 backdrop-blur-md">
        <h2 className="mb-8 text-center text-3xl font-bold text-slate-100 md:text-4xl">
          Our Impact
        </h2>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {[
            { label: "Food Items Donated", value: stats.total_donations, icon: "🍽️" },
            { label: "Active Users", value: stats.active_users, icon: "👥" },
            { label: "Successful Pickups", value: stats.successful_pickups, icon: "✅" },
            { label: "CO2 Saved (kg)", value: stats.co2_saved, icon: "🌱" },
          ].map((stat, index) => (
            <div
              key={index}
              className="rounded-xl border border-slate-700 bg-slate-900/60 p-6 text-center shadow-lg hover:shadow-xl hover:shadow-emerald-500/20"
            >
              <span className="text-4xl">{stat.icon}</span>
              <h3 className="mt-4 text-lg font-semibold text-slate-200">{stat.label}</h3>
              <p className="mt-2 text-2xl font-bold text-emerald-400">{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="mt-12 rounded-2xl border border-slate-700/60 bg-slate-900/50 p-8 backdrop-blur-md">
        <h2 className="mb-10 text-center text-3xl font-bold text-slate-100 md:text-4xl">
          Why Choose Us
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative transform-gpu rounded-3xl border border-slate-700/60 bg-slate-900/60 p-8 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:border-emerald-500/60 hover:shadow-xl hover:shadow-emerald-500/10"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-emerald-400/0 via-teal-400/0 to-sky-400/0 opacity-0 blur-2xl transition-opacity duration-300 group-hover:from-emerald-400/12 group-hover:via-teal-400/10 group-hover:to-sky-400/12 group-hover:opacity-100"
              />
              <div
                className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r ${feature.color} shadow-lg transition-transform duration-300 group-hover:scale-110`}
              >
                <span className="text-2xl text-white">{feature.icon}</span>
              </div>

              <h3 className="mb-3 text-xl font-bold text-slate-100">
                {feature.title}
              </h3>
              <p className="leading-relaxed text-slate-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="mt-12 rounded-2xl bg-gradient-to-r from-emerald-600 to-sky-600 p-12 text-white shadow-xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-6 text-4xl font-bold md:text-5xl">
            Ready to Make a Difference?
          </h2>
          <p className="mb-8 text-lg text-emerald-50/90">
            Join thousands of users who are already making an impact in their communities. Every donation counts, every share matters.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <button className="rounded-xl bg-white px-8 py-4 font-semibold text-emerald-700 transition-all hover:bg-emerald-50">
              Get Started Today
            </button>
            <button className="rounded-xl border-2 border-white px-8 py-4 font-semibold text-white transition-all hover:bg-white/10">
              Learn More
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
