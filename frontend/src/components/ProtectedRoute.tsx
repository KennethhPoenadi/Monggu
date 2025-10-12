import type { ReactNode } from "react";
import LoginGoogle from "./login/LoginGoogle";
import Navbar from "./navbar";
import Footer from "./footer";
import type { User } from "../types/user";

interface ProtectedRouteProps {
  children: ReactNode;
  userInfo: (User & { name?: string }) | null;
  error?: string;
}

export default function ProtectedRoute({
  children,
  userInfo,
  error,
}: ProtectedRouteProps) {
  if (userInfo) return <>{children}</>;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-slate-100 overflow-hidden">
      <Navbar />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg
          className="absolute -right-32 -top-32 h-[45rem] w-[45rem] opacity-20 blur-3xl animate-pulse"
          viewBox="0 0 200 200"
          aria-hidden
        >
          <path
            d="M53.6,-58.2C67.2,-45.5,74.9,-24.7,73.8,-5.7C72.8,13.3,63.1,26.6,49.5,38.9C36,51.3,18,62.7,-0.3,63.1C-18.5,63.6,-36.9,53.1,-49.1,39.6C-61.3,26.1,-67.3,9.6,-65.7,-6.1C-64.1,-21.7,-54.8,-36.5,-42.1,-49.5C-29.4,-62.6,-14.7,-73.9,3.1,-77.9C20.9,-81.9,41.9,-78.6,53.6,-58.2Z"
            transform="translate(100 100)"
            className="fill-emerald-500/30"
          />
        </svg>
        
        <svg
          className="absolute -left-32 bottom-0 h-[35rem] w-[35rem] opacity-15 blur-3xl"
          viewBox="0 0 200 200"
          aria-hidden
        >
          <path
            d="M40.2,-45.3C52.7,-36.8,63.4,-23.2,65.8,-8.1C68.2,7,62.3,23.6,52.1,37.4C41.9,51.2,27.4,62.2,10.7,64.8C-6,67.4,-24.9,61.6,-38.7,51.2C-52.5,40.8,-61.2,25.8,-63.1,9.4C-65,-7,-60.1,-24.8,-49.8,-33.8C-39.5,-42.8,-23.8,-43,-8.9,-43.2C6,-43.4,22.7,-53.8,40.2,-45.3Z"
            transform="translate(100 100)"
            className="fill-teal-500/20"
          />
        </svg>
        
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-emerald-400/30 rounded-full animate-ping"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-teal-400/40 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-sky-400/30 rounded-full animate-ping" style={{animationDelay: '2s'}}></div>
      </div>

      <main className="relative mx-auto max-w-7xl px-6 py-16 min-h-screen flex items-center">
        <div className="w-full grid lg:grid-cols-2 gap-16 items-center">
          <div className="text-center lg:text-left space-y-8">
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 backdrop-blur-sm">
              <span className="text-xl animate-bounce">�</span>
              <span className="text-sm font-medium">Bergabunglah dengan gerakan anti food waste</span>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-tight">
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
                  Selamat datang di
                </span>
                <br />
                <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  FoodLoop
                </span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Platform donasi makanan yang menghubungkan donor dengan penerima untuk mengurangi food waste dan berbagi kebaikan.
              </p>
            </div>

            <div className="flex flex-wrap gap-6 justify-center lg:justify-start">
              <div className="flex items-center gap-3 bg-slate-800/50 backdrop-blur-sm rounded-xl px-4 py-3 border border-slate-700/50">
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-slate-300">Donasi mudah & aman</span>
              </div>
              <div className="flex items-center gap-3 bg-slate-800/50 backdrop-blur-sm rounded-xl px-4 py-3 border border-slate-700/50">
                <div className="w-3 h-3 bg-teal-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                <span className="text-slate-300">Reward menarik</span>
              </div>
              <div className="flex items-center gap-3 bg-slate-800/50 backdrop-blur-sm rounded-xl px-4 py-3 border border-slate-700/50">
                <div className="w-3 h-3 bg-sky-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                <span className="text-slate-300">Dampak nyata</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 max-w-md mx-auto lg:mx-0 pt-8">
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-emerald-400">100+</div>
                <div className="text-sm text-slate-400">Donasi</div>
              </div>
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-teal-400">50+</div>
                <div className="text-sm text-slate-400">Pengguna</div>
              </div>
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-sky-400">25kg</div>
                <div className="text-sm text-slate-400">Makanan</div>
              </div>
            </div>
          </div>

          <div className="w-full max-w-lg mx-auto">
            <div className="rounded-3xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-xl p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-sky-500/10 to-emerald-500/10 rounded-full blur-2xl"></div>
              
              <div className="relative">
                <div className="text-center mb-8">
                  <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 mb-6 shadow-xl">
                    <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  
                  <h2 className="text-3xl font-bold text-white mb-3">
                    Mari Bergabung!
                  </h2>
                  
                  <p className="text-slate-400">
                    Masuk untuk mulai berdonasi dan mendapatkan reward menarik
                  </p>
                </div>

                {error && (
                  <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-4 text-red-200 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="font-semibold text-sm">Login gagal</p>
                        <p className="text-xs text-red-300 mt-1">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  <LoginGoogle />
                </div>

                <div className="mt-8 pt-6 border-t border-slate-700/50">
                  <div className="text-center">
                    <p className="text-sm text-slate-400 mb-4">Setelah login, Anda dapat:</p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center gap-2 text-slate-300 bg-slate-800/30 rounded-lg p-2">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                        <span>Berdonasi makanan</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300 bg-slate-800/30 rounded-lg p-2">
                        <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                        <span>Dapatkan reward</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300 bg-slate-800/30 rounded-lg p-2">
                        <div className="w-2 h-2 bg-sky-400 rounded-full"></div>
                        <span>Lihat notifikasi</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300 bg-slate-800/30 rounded-lg p-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span>Akses lengkap</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
