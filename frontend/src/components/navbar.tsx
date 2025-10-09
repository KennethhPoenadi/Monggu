import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

interface NavbarProps {
  currentPage?:
    | "home" | "donation" | "notification" | "reward" | "product"
    | "map" | "recipes" | "ai-food" | "admin" | "profile";
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
  // 1) init scrolled sinkron biar nggak flicker di render awal
  const [scrolled, setScrolled] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.scrollY > 2 : false
  );
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 2);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { id: "home" as const, label: "Home", icon: "🏠" },
    { id: "donation" as const, label: "Donations", icon: "🍽️" },
    { id: "product" as const, label: "Products", icon: "📦" },
    { id: "map" as const, label: "Donation Map", icon: "🗺️" },
    { id: "recipes" as const, label: "Recipes", icon: "📝" },
    { id: "ai-food" as const, label: "AI Food", icon: "🤖" },
    { id: "notification" as const, label: "Notifications", icon: "🔔", badge: unreadNotifications },
    { id: "reward" as const, label: "Rewards", icon: "🏆" },
    { id: "profile" as const, label: "Profile", icon: "👤" },
    ...(userInfo?.is_panitia ? [{ id: "admin" as const, label: "Admin", icon: "⚙️" }] : []),
  ];

  const getRoutePath = (id: string) => (id === "home" ? "/" : `/${id}`);

  const BASE_ITEM =
    "relative inline-flex h-16 min-w-[92px] flex-col items-center justify-center gap-1 rounded-xl px-4 text-[13px] font-semibold transition-all duration-300";
  const ACTIVE_ITEM =
    "bg-gradient-to-b from-emerald-600 to-emerald-700 text-white ring-1 ring-emerald-400/40 shadow-sm";
  const INACTIVE_ITEM =
    "text-slate-300 hover:text-emerald-300 hover:bg-slate-800/60";

  // 3) header nggak pakai durasi transisi panjang (biar nggak sempat “abu”)
  const HEADER_BASE = "sticky top-0 z-50 border-b border-slate-800 transition-colors duration-100";
  const HEADER_SOLID = "bg-slate-900";
  const HEADER_GLASS = "bg-slate-900/85 backdrop-blur supports-[backdrop-filter]:bg-slate-900/70";

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

        {/* Mobile nav */}
        {open && (
          <div className="md:hidden border-t border-slate-800 bg-slate-900/90 backdrop-blur">
            <div className="space-y-2 px-6 py-4">
              {navItems.map((item) => {
                const isActive = currentPage === item.id;
                return (
                  <Link
                    key={item.id}
                    to={getRoutePath(item.id)}
                    onClick={() => setOpen(false)}
                    className={`relative flex h-12 items-center gap-3 rounded-xl px-4 text-sm font-semibold transition ${
                      isActive
                        ? "bg-gradient-to-b from-emerald-600 to-emerald-700 text-white ring-1 ring-emerald-400/40"
                        : "text-slate-300 hover:text-emerald-300 hover:bg-slate-800/60"
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="w-full text-center leading-tight">{item.label}</span>

                    {!!item.badge && item.badge > 0 && (
                      <span className="ml-auto flex h-6 min-w-[24px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-xs font-bold text-white">
                        {item.badge > 9 ? "9+" : item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}

              {userInfo && (
                <div className="flex h-16 items-center rounded-xl border border-slate-700 bg-slate-800/60 px-4">
                  <div className="mr-2">
                    <p className="max-w-[180px] truncate text-sm font-semibold text-slate-100">
                      {userInfo.name || userInfo.email}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="rounded-full bg-emerald-600 px-3 py-1 text-sm font-bold text-white">
                        {userInfo.poin} points
                      </span>
                      <span className="rounded-full bg-violet-600 px-3 py-1 text-sm font-bold text-white">
                        {userInfo.rank}
                      </span>
                    </div>
                  </div>
                  {onLogout && (
                    <button
                      onClick={onLogout}
                      className="mt-3 w-full rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-3 font-semibold text-white transition hover:from-rose-600 hover:to-rose-700"
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
    </>
  );
}
