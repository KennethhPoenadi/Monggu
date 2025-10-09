import React, { useEffect, useState } from "react";
import axios from "axios";

interface HomePageProps {
  userInfo?: {
    name?: string;
    email: string;
    poin: number;
    rank: string;
    user_id: number;
  };
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
    { icon: "🍽️", title: "Food Donations",         description: "Share surplus food with those in need",                  color: "from-emerald-500 to-emerald-600" },
    { icon: "📦",  title: "Product Management",      description: "Track and manage your food inventory",                  color: "from-sky-500 to-sky-600" },
    { icon: "🗺️",  title: "Donation Map",            description: "Find nearby food donations on interactive map",         color: "from-violet-500 to-violet-600" },
    { icon: "📝",  title: "Recipe Ideas",            description: "Get creative recipes to reduce food waste",             color: "from-orange-500 to-orange-600" },
    { icon: "🏆",  title: "Rewards System",          description: "Earn points and rewards for your contributions",        color: "from-yellow-500 to-amber-600" },
    { icon: "📱",  title: "Real-time Notifications", description: "Stay updated with instant notifications",               color: "from-pink-500 to-rose-600" },
  ];

  return (
    <div className="relative min-h-[calc(100vh-120px)] overflow-x-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
      {/* decorative blob */}
      <svg
        className="pointer-events-none absolute -right-20 -top-20 h-[36rem] w-[36rem] opacity-20 blur-3xl"
        viewBox="0 0 200 200"
        aria-hidden="true"
      >
        <path
          d="M53.6,-58.2C67.2,-45.5,74.9,-24.7,73.8,-5.7C72.8,13.3,63.1,26.6,49.5,38.9C36,51.3,18,62.7,-0.3,63.1C-18.5,63.6,-36.9,53.1,-49.1,39.6C-61.3,26.1,-67.3,9.6,-65.7,-6.1C-64.1,-21.7,-54.8,-36.5,-42.1,-49.5C-29.4,-62.6,-14.7,-73.9,3.1,-77.9C20.9,-81.9,41.9,-78.6,53.6,-58.2Z"
          transform="translate(100 100)"
          className="fill-emerald-500/30"
        />
      </svg>

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* HERO */}
        <section className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-6 shadow-xl backdrop-blur-xl md:p-10">
          <div className="text-center">
            <span className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 shadow">
              <span className="text-3xl">🍽️</span>
            </span>

            <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 bg-clip-text text-transparent">
                Welcome to FoodLoop
              </span>
            </h1>

            <p className="mx-auto mt-4 max-w-3xl text-lg leading-relaxed text-slate-300 md:text-xl">
              Connecting communities to reduce food waste and fight hunger together.
              Share surplus food, discover nearby donations, and make a positive impact.
            </p>

            {userInfo && (
              <div className="mx-auto mt-8 max-w-md rounded-2xl border border-slate-700 bg-slate-900/60 p-6 shadow">
                <div className="flex items-center gap-4 text-left">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-sky-500">
                    <span className="text-2xl text-white">👋</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">
                      Welcome back, {userInfo.name || userInfo.email}!
                    </h3>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="rounded-full bg-yellow-400/15 px-3 py-1 text-sm font-semibold text-yellow-300">
                        ⭐ {userInfo.poin} points
                      </span>
                      <span className="rounded-full bg-violet-400/15 px-3 py-1 text-sm font-semibold text-violet-300">
                        🏆 {userInfo.rank}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <button className="rounded-xl bg-emerald-600 px-8 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:bg-emerald-700 hover:shadow-emerald-600/20">
                <span className="flex items-center gap-2">🎁 Start Donating</span>
              </button>
              <button className="rounded-xl border border-slate-700 px-8 py-4 font-semibold text-slate-100 transition-all duration-300 hover:bg-slate-800">
                <span className="flex items-center gap-2">🗺️ Explore Map</span>
              </button>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="mt-8 rounded-2xl border border-slate-700/60 bg-slate-900/50 p-6 backdrop-blur md:p-8">
          <h2 className="mb-8 text-center text-2xl font-bold text-slate-100 md:text-3xl">
            Our Impact Together
          </h2>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-5 text-center">
              <span className="text-3xl">🍽️</span>
              <h3 className="mt-2 text-lg font-semibold">Food Items Donated</h3>
              <p className="text-xl font-bold text-emerald-400">{stats.total_donations}</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-5 text-center">
              <span className="text-3xl">👥</span>
              <h3 className="mt-2 text-lg font-semibold">Active Users</h3>
              <p className="text-xl font-bold text-emerald-400">{stats.active_users}</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-5 text-center">
              <span className="text-3xl">✅</span>
              <h3 className="mt-2 text-lg font-semibold">Successful Pickups</h3>
              <p className="text-xl font-bold text-emerald-400">{stats.successful_pickups}</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-5 text-center">
              <span className="text-3xl">🌱</span>
              <h3 className="mt-2 text-lg font-semibold">CO2 Saved (kg)</h3>
              <p className="text-xl font-bold text-emerald-400">{stats.co2_saved}</p>
            </div>
          </div>
        </section>

        {/* FEATURES with small backlight */}
        <section className="mt-8 rounded-2xl border border-slate-700/60 bg-slate-900/50 p-6 backdrop-blur md:p-8">
          <div className="mb-10 text-center">
            <h2 className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
              Powerful Features
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-300">
              Everything you need to make food sharing simple, efficient, and rewarding.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative transform-gpu rounded-3xl border border-slate-700/60 bg-slate-900/60 p-8 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:border-emerald-500/60 hover:shadow-xl hover:shadow-emerald-500/10"
              >
                {/* backlight kecil */}
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

        {/* CTA */}
        <section className="mt-8 rounded-2xl bg-gradient-to-r from-emerald-600 to-sky-600 p-10 text-white shadow-xl">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Ready to Make a Difference?
            </h2>
            <p className="mb-6 text-emerald-50/90">
              Join thousands of users who are already making an impact in their communities.
              Every donation counts, every share matters.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <button className="rounded-xl bg-white px-8 py-3 font-semibold text-emerald-700 transition-all hover:bg-emerald-50">
                Get Started Today
              </button>
              <button className="rounded-xl border-2 border-white px-8 py-3 font-semibold text-white transition-all hover:bg-white/10">
                Learn More
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
