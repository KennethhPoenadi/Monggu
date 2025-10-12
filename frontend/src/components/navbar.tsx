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
    { id: "home" as const, label: "Dashboard" },
    { id: "donation" as const, label: "Donations" },
    { id: "product" as const, label: "Products" },
    { id: "map" as const, label: "Map" },
    { id: "notification" as const, label: "Alerts", badge: unreadNotifications },
    { id: "reward" as const, label: "Rewards" },
    { id: "profile" as const, label: "Account" },
    ...(userInfo?.is_panitia ? [{ id: "admin" as const, label: "Admin" }] : []),
  ];

  const getRoutePath = (id: string) => (id === "home" ? "/" : `/${id}`);

  const BASE_ITEM =
    "relative inline-flex h-12 min-w-[70px] flex-col items-center justify-center gap-0.5 rounded-lg px-2 text-[11px] font-semibold transition-all duration-300 transform hover:scale-105 hover:bg-slate-800 hover:shadow-lg hover:shadow-emerald-500/25";
  const ACTIVE_ITEM =
    "bg-gradient-to-b from-emerald-600 to-emerald-700 text-white ring-2 ring-emerald-400/50 shadow-lg shadow-emerald-500/25 hover:ring-emerald-300 hover:shadow-xl";
  const INACTIVE_ITEM =
    "text-slate-300 hover:text-emerald-300 hover:bg-slate-800/80 hover:ring-1 hover:ring-emerald-500/30 hover:shadow-md hover:shadow-emerald-500/10";

  const HEADER_BASE = "sticky top-0 z-50 border-slate-800 transition-colors duration-100";
  const HEADER_SOLID = "bg-slate-900 h-[90px]";
  const HEADER_GLASS = "bg-slate-900 h-[90px]";

  useEffect(() => {
    const scrollbarStyles = `
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
    `;
    
    const style = document.createElement('style');
    style.textContent = scrollbarStyles;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (!userInfo) {
    return null;
  }

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-[80px] bg-slate-900 z-40"
      />

      <header className={`${HEADER_BASE} ${scrolled ? HEADER_GLASS : HEADER_SOLID}`}>
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex h-[13vh] items-center gap-3 justify-between">
            <div className="flex shrink-0 items-center space-x-3 pr-1">
              <img src="/foodloopaseli.png" alt="FoodLoop" className="h-15 w-auto rounded-full" />
              <div className="-ml-1">
                <h1 className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-xl font-extrabold leading-6 text-transparent">
                  FoodLoop
                </h1>
                <p className="leading-4 text-xs font-medium text-slate-400">
                  Food Saved<br />Smiles Shared
                </p>
              </div>
            </div>

            {/* Desktop nav - only show on XL screens */}
            <div className="hidden xl:flex flex-1 min-w-0 mx-2">
              <nav className="flex items-center justify-center w-full space-x-1 lg:space-x-2">
                {navItems.map((item) => {
                  const isActive = currentPage === item.id;
                  return (
                    <Link
                      key={item.id}
                      to={getRoutePath(item.id)}
                      onClick={() => setOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                      className={`${BASE_ITEM} ${isActive ? ACTIVE_ITEM : INACTIVE_ITEM} hover:scale-105`}
                    >
                      <span className="w-full text-center leading-tight truncate">{item.label}</span>

                      {!!item.badge && item.badge > 0 && (
                        <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold leading-none text-white shadow">
                          {item.badge > 9 ? "9+" : item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center space-x-3 flex-shrink-0">
              {userInfo && (
                <div className="hidden xl:flex items-center space-x-3">
                  <div className="flex h-16 items-center rounded-xl border border-slate-700 bg-slate-800/60 px-4">
                    <div className="mr-2">
                      <p
                        className="max-w-[180px] truncate text-sm font-semibold text-slate-100"
                        title={userInfo.name || userInfo.email.split("@")[0]}
                      >
                        {userInfo.name || userInfo.email.split("@")[0]}
                      </p>
                      <div className="mt-1 flex items-center gap-3">
                        
                        <span className="inline-flex h-6 items-center rounded-full bg-gradient-to-r from-violet-500 to-violet-700 px-3 text-xs font-bold leading-none text-white shadow-md">
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

              {/* Logout button for tablet sizes */}
              {userInfo && onLogout && (
                <button
                  onClick={onLogout}
                  className="hidden lg:xl:hidden lg:flex rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 px-3 py-2 font-semibold text-white shadow-sm transition hover:from-rose-600 hover:to-rose-700"
                >
                  Logout
                </button>
              )}

              {/* Mobile toggle - show for anything smaller than XL */}
              <button
                className="xl:hidden rounded-xl p-3 text-slate-300 transition hover:bg-slate-800/60 hover:text-emerald-300"
                onClick={() => setOpen((o) => !o)}
                aria-label="Toggle menu"
              >
                <span className="text-2xl font-bold">{open ? "✕" : "☰"}</span>
              </button>
            </div>
          </div>
        </div>

        {open && (
          <div className="xl:hidden fixed inset-0 z-50">
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            
            <div className={`absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-slate-900/95 backdrop-blur-xl shadow-2xl border-l border-slate-700 transform transition-transform duration-300 ease-in-out flex flex-col ${
              open ? 'translate-x-0' : 'translate-x-full'
            }`}>
              <div className="flex items-center justify-between p-6 border-b border-slate-700/50 flex-shrink-0">
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
                  className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-200"
                >
                  <span className="text-xl">✕</span>
                </button>
              </div>

              {/* User info section */}
              {userInfo && (
                <div className="p-6 border-b border-slate-700/50 flex-shrink-0">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold text-lg shadow-lg">
                      {(userInfo.name || userInfo.email)?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-semibold text-slate-100 truncate">
                        {userInfo.name || userInfo.email.split("@")[0]}
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="inline-flex h-7 items-center rounded-full bg-gradient-to-r from-emerald-500 to-emerald-700 px-3 text-sm font-bold leading-none text-white shadow-md">
                          {userInfo.poin} pts
                        </span>
                        <span className="inline-flex h-7 items-center rounded-full bg-gradient-to-r from-violet-500 to-violet-700 px-3 text-sm font-bold leading-none text-white shadow-md">
                          {userInfo.rank}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation items */}
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="p-6">
                  <nav className="space-y-3">
                    {navItems.map((item) => {
                      const isActive = currentPage === item.id;
                      return (
                        <Link
                          key={item.id}
                          to={getRoutePath(item.id)}
                          onClick={() => setOpen(false)}
                          className={`relative flex h-14 items-center gap-4 rounded-xl px-4 text-base font-semibold transition-all duration-200 ${
                            isActive
                              ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/25"
                              : "text-slate-300 hover:text-white hover:bg-slate-800/80 hover:translate-x-1"
                          }`}
                        >
                          <span className="flex-1">{item.label}</span>

                          {!!item.badge && item.badge > 0 && (
                            <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-rose-500 px-2 text-xs font-bold text-white shadow-md">
                              {item.badge > 9 ? "9+" : item.badge}
                            </span>
                          )}
                          
                          {isActive && (
                            <span className="text-emerald-300 text-lg">→</span>
                          )}
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              </div>

              {/* Logout button */}
              {userInfo && onLogout && (
                <div className="p-6 border-t border-slate-700/50 flex-shrink-0">
                  <button
                    onClick={() => {
                      onLogout();
                      setOpen(false);
                    }}
                    className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-4 font-bold text-white transition-all duration-200 hover:from-rose-600 hover:to-rose-700 hover:shadow-lg shadow-lg"
                  >
                    🚪 Logout
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
