import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

interface NavbarProps {
  currentPage?:
    | "home" | "donation" | "notification" | "reward" | "product"
    | "map" | "ai-food" | "admin" | "profile";
  unreadNotifications?: number;
  userInfo?: {
    name?: string; email: string; poin: number; rank: string;
    user_id: number; is_panitia?: boolean;
  };
  onLogout?: () => void;
}

export default function Navbar({
  currentPage = "home",
  unreadNotifications = 0,
  userInfo,
  onLogout,
}: NavbarProps) {
  const [scrolled, setScrolled] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.scrollY > 10 : false
  );
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { id: "home" as const, label: "Dashboard", icon: "📊" },
    { id: "donation" as const, label: "Donations", icon: "💝" },
    { id: "product" as const, label: "Marketplace", icon: "🛒" },
    { id: "map" as const, label: "Map", icon: "🗺️" },
    { id: "recipes" as const, label: "Recipes", icon: "👨‍🍳" },
    { id: "ai-food" as const, label: "AI Assistant", icon: "🤖" },
    { id: "notification" as const, label: "Alerts", icon: "🔔", badge: unreadNotifications },
    { id: "reward" as const, label: "Rewards", icon: "🎁" },
    { id: "profile" as const, label: "Account", icon: "👤" },
    ...(userInfo?.is_panitia ? [{ id: "admin" as const, label: "Admin", icon: "⚙️" }] : []),
  ];

  const getRoutePath = (id: string) => (id === "home" ? "/" : `/${id}`);

  const BASE_ITEM =
    "relative inline-flex h-16 min-w-[92px] flex-col items-center justify-center gap-1 rounded-xl px-4 text-[13px] font-semibold transition-all duration-300 transform hover:scale-105";
  const ACTIVE_ITEM =
    "bg-gradient-to-b from-emerald-600 to-emerald-700 text-white ring-2 ring-emerald-400/50 shadow-lg shadow-emerald-500/25";
  const INACTIVE_ITEM =
    "text-slate-300 hover:text-emerald-300 hover:bg-slate-800/80 hover:ring-1 hover:ring-emerald-500/30 hover:shadow-md hover:shadow-emerald-500/10";

  // 3) header nggak pakai durasi transisi panjang (biar nggak sempat “abu”)
  const HEADER_BASE = "sticky top-0 z-50 border-b border-slate-800 transition-colors duration-100";
  const HEADER_SOLID = "bg-slate-900";
  const HEADER_GLASS = "bg-slate-900";

  return (
    <>
      {/* 2) Lapisan pengaman gelap di bawah header (hindari kilat putih) */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-[80px] bg-slate-900 z-40"
      />

      <header className={`${HEADER_BASE} ${scrolled ? HEADER_GLASS : HEADER_SOLID}`}>
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex h-[72px] items-center justify-between gap-3">
            {/* Logo */}
            <div className="flex shrink-0 items-center space-x-3 pr-1">
              <div className="text-2xl">🍃</div>
              <div className="-ml-1">
                <h1 className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-xl font-extrabold leading-6 text-transparent">
                  FoodLoop
                </h1>
                <p className="leading-4 text-xs font-medium text-slate-400">
                  Food Donation<br />Platform
                </p>
              </div>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center space-x-1 ml-2 md:ml-6 lg:ml-10 xl:ml-14">
              {navItems.map((item) => {
                const isActive = currentPage === item.id;
                return (
                  <Link
                    key={item.id}
                    to={getRoutePath(item.id)}
                    onClick={() => setOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className={`${BASE_ITEM} ${isActive ? ACTIVE_ITEM : INACTIVE_ITEM}`}
                  >
                    <span className="text-[18px] leading-none">{item.icon}</span>
                    <span className="w-full text-center leading-tight">{item.label}</span>

                    {!!item.badge && item.badge > 0 && (
                      <span className="absolute right-1.5 top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold leading-none text-white shadow">
                        {item.badge > 9 ? "9+" : item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right cluster */}
            <div className="flex items-center space-x-3">
              {userInfo && (
                <div className="hidden lg:flex items-center space-x-3">
                  <div className="flex h-16 items-center rounded-xl border border-slate-700 bg-slate-800/60 px-4">
                    <div className="mr-2">
                      <p className="max-w-[180px] truncate text-sm font-semibold text-slate-100">
                        {userInfo.name || userInfo.email.split("@")[0]}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="inline-flex h-6 items-center rounded-full bg-emerald-600 px-2.5 text-xs font-bold leading-none text-white">
                          {userInfo.poin} pts
                        </span>
                        <span className="inline-flex h-6 items-center rounded-full bg-violet-600 px-2.5 text-xs font-bold leading-none text-white">
                          {userInfo.rank}
                        </span>
                      </div>
                    </div>
                  </div>

                  {onLogout && (
                    <button
                      onClick={onLogout}
                      className="rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-2 font-semibold text-white shadow-sm transition hover:from-rose-600 hover:to-rose-700"
                    >
                      Logout
                    </button>
                  )}
                </div>
              )}

              {/* Mobile toggle */}
              <button
                className="md:hidden rounded-xl p-3 text-slate-300 transition hover:bg-slate-800/60 hover:text-emerald-300"
                onClick={() => setOpen((o) => !o)}
                aria-label="Toggle menu"
              >
                <span className="text-2xl font-bold">{open ? "✕" : "☰"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav overlay */}
        {open && (
          <div className="md:hidden fixed inset-0 z-50">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            
            {/* Slide-in panel */}
            <div className={`absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-slate-900 shadow-2xl transform transition-transform duration-300 ease-in-out ${
              open ? 'translate-x-0' : 'translate-x-full'
            }`}>
              {/* Header with close button */}
              <div className="flex items-center justify-between p-6 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">🍃</div>
                  <div>
                    <h2 className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-lg font-extrabold text-transparent">
                      FoodLoop
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <span className="text-xl">✕</span>
                </button>
              </div>

              {/* User info section */}
              {userInfo && (
                <div className="p-6 border-b border-slate-800">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white font-bold">
                      {(userInfo.name || userInfo.email)?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-100 truncate">
                        {userInfo.name || userInfo.email.split("@")[0]}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="inline-flex h-5 items-center rounded-full bg-emerald-600 px-2 text-xs font-bold text-white">
                          {userInfo.poin} pts
                        </span>
                        <span className="inline-flex h-5 items-center rounded-full bg-violet-600 px-2 text-xs font-bold text-white">
                          {userInfo.rank}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation items */}
              <div className="flex-1 overflow-y-auto p-6">
                <nav className="space-y-2">
                  {navItems.map((item) => {
                    const isActive = currentPage === item.id;
                    return (
                      <Link
                        key={item.id}
                        to={getRoutePath(item.id)}
                        onClick={() => setOpen(false)}
                        className={`relative flex h-12 items-center gap-3 rounded-xl px-4 text-sm font-semibold transition-all duration-200 ${
                          isActive
                            ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg"
                            : "text-slate-300 hover:text-white hover:bg-slate-800 hover:translate-x-1"
                        }`}
                      >
                        <span className="text-lg">{item.icon}</span>
                        <span className="flex-1">{item.label}</span>

                        {!!item.badge && item.badge > 0 && (
                          <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-xs font-bold text-white">
                            {item.badge > 9 ? "9+" : item.badge}
                          </span>
                        )}
                        
                        {isActive && (
                          <span className="text-emerald-300">→</span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Logout button */}
              {userInfo && onLogout && (
                <div className="p-6 border-t border-slate-800">
                  <button
                    onClick={() => {
                      onLogout();
                      setOpen(false);
                    }}
                    className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-3 font-semibold text-white transition-all duration-200 hover:from-rose-600 hover:to-rose-700 hover:shadow-lg"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
