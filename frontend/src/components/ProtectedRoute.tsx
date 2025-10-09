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
  // Sudah login → render konten aslinya
  if (userInfo) return <>{children}</>;

  // Belum login → tampilkan halaman login dengan gaya NotFound
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
      <Navbar />

      {/* dekorasi blob */}
      <svg
        className="pointer-events-none absolute -right-24 -top-24 h-[36rem] w-[36rem] opacity-20 blur-3xl"
        viewBox="0 0 200 200"
        aria-hidden
      >
        <path
          d="M53.6,-58.2C67.2,-45.5,74.9,-24.7,73.8,-5.7C72.8,13.3,63.1,26.6,49.5,38.9C36,51.3,18,62.7,-0.3,63.1C-18.5,63.6,-36.9,53.1,-49.1,39.6C-61.3,26.1,-67.3,9.6,-65.7,-6.1C-64.1,-21.7,-54.8,-36.5,-42.1,-49.5C-29.4,-62.6,-14.7,-73.9,3.1,-77.9C20.9,-81.9,41.9,-78.6,53.6,-58.2Z"
          transform="translate(100 100)"
          className="fill-emerald-500/30"
        />
      </svg>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <section className="rounded-2xl border border-slate-700/60 bg-slate-900/70 backdrop-blur-xl p-6 md:p-10 shadow-xl">
          <div className="text-center mb-6">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <span className="text-2xl">🍃</span>
            </span>
            <h1 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 bg-clip-text text-transparent">
                Selamat datang di FoodLoop!
              </span>
            </h1>
            <p className="mt-2 text-slate-300">
              Platform donasi makanan untuk berbagi kebaikan
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-200">
              <p className="font-semibold">Login gagal</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <p className="mb-4 text-center text-slate-300">
            Silakan login untuk melanjutkan
          </p>

          {/* kartu login (Google) */}
          <div className="mx-auto max-w-2xl">
            <LoginGoogle />
          </div>

          <div className="mt-6 text-center text-sm text-slate-400">
            <p>Dengan login, Anda dapat:</p>
            <ul className="mt-2 space-y-1">
              <li>• Berdonasi makanan</li>
              <li>• Mendapatkan reward</li>
              <li>• Melihat notifikasi</li>
              <li>• Mengakses semua fitur</li>
            </ul>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
