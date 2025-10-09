import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Home,
  ArrowLeft,
  Bug,
  Search,
  MapPin,
  Gift,
  UtensilsCrossed,
  Package, // ← icon box untuk Products
} from "lucide-react";

type Suggestion = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

export default function NotFoundPage() {
  const nav = useNavigate();
  const [q, setQ] = useState("");

  const suggestions: Suggestion[] = useMemo(
    () => [
      { href: "/map",      label: "Lokasi Donasi",  icon: MapPin },
      { href: "/product",  label: "Products",       icon: Package }, // ← diubah
      { href: "/ai-food",  label: "Resep AI",       icon: UtensilsCrossed },
      { href: "/donation", label: "Donasi Makanan", icon: Gift },
    ],
    []
  );

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const s = q.trim();
    if (!s) return;
    nav(`/recipes?search=${encodeURIComponent(s)}`);
  }

  return (
    <div className="relative min-h-[calc(100vh-120px)] bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
      <svg
        className="pointer-events-none absolute -right-20 -top-20 w-[36rem] h-[36rem] opacity-20 blur-3xl"
        viewBox="0 0 200 200"
        aria-hidden
      >
        <path
          d="M53.6,-58.2C67.2,-45.5,74.9,-24.7,73.8,-5.7C72.8,13.3,63.1,26.6,49.5,38.9C36,51.3,18,62.7,-0.3,63.1C-18.5,63.6,-36.9,53.1,-49.1,39.6C-61.3,26.1,-67.3,9.6,-65.7,-6.1C-64.1,-21.7,-54.8,-36.5,-42.1,-49.5C-29.4,-62.6,-14.7,-73.9,3.1,-77.9C20.9,-81.9,41.9,-78.6,53.6,-58.2Z"
          transform="translate(100 100)"
          className="fill-emerald-500/30"
        />
      </svg>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <section className="rounded-2xl border border-slate-700/60 bg-slate-900/70 backdrop-blur-xl p-6 md:p-8 shadow-xl">
          <div className="mb-4 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <UtensilsCrossed className="h-5 w-5" aria-hidden />
            </span>
            <p className="text-sm text-slate-400">FoodLoop</p>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1]">
            <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 bg-clip-text text-transparent">
              404
            </span>
            <span className="ml-3">Halaman tidak ditemukan</span>
          </h1>

          <p className="mt-3 text-slate-300">
            Maaf, fitur atau alamat yang kamu buka belum tersedia di FoodLoop. Kamu bisa mencari fitur lain,
            kembali ke beranda, atau laporkan agar tim kami bisa meninjau.
          </p>

          <form onSubmit={onSearch} className="mt-6 flex gap-3" role="search" aria-label="Cari fitur FoodLoop">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" aria-hidden />
              <input
                id="nf-search"
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari: resep, donation map, products…"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 pl-10 pr-4 py-3 placeholder:text-slate-400
                           text-slate-100 outline-none focus:ring-4 focus:ring-emerald-500/25 focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-500/30"
            >
              <Search className="h-4 w-4" aria-hidden /> Cari
            </button>
          </form>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestions.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                to={href}
                className="group flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/60 p-4
                           hover:border-emerald-500/60 hover:bg-slate-900"
              >
                <span className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="font-medium">{label}</span>
                </span>
                <svg
                  className="h-5 w-5 text-slate-400 group-hover:text-emerald-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => nav(-1)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 font-semibold hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden /> Kembali
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold hover:bg-emerald-700"
            >
              <Home className="h-4 w-4" aria-hidden /> Ke Beranda
            </Link>
            <Link
              to="/feedback"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 font-semibold hover:bg-slate-800"
            >
              <Bug className="h-4 w-4" aria-hidden /> Laporkan Masalah
            </Link>
          </div>
        </section>

        <p className="mt-4 text-center text-sm text-slate-400">
          Tip: kamu juga bisa membuka <code className="rounded bg-slate-800 px-1.5 py-0.5">/map</code> untuk melihat pos donasi terdekat.
        </p>
      </main>
    </div>
  );
}
