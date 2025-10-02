import { useMemo, useState} from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, ArrowLeft, Bug, Search, MapPin, Gift, UtensilsCrossed} from "lucide-react";
import "./NotFound.css";

type Suggestion = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

export default function NotFoundPage() {
  const nav = useNavigate();
  const [q, setQ] = useState("");

  // Sesuaikan href dengan route yang kamu punya sekarang
  const suggestions: Suggestion[] = useMemo(
    () => [
      { href: "/donation-map", label: "Lokasi Donasi", icon: MapPin },
      { href: "/dashboard", label: "Dashboard", icon: Home },
      { href: "/recipe-suggestions", label: "Resep AI", icon: UtensilsCrossed },
      { href: "/donate", label: "Donasi Makanan", icon: Gift },      // opsional
    ],
    []
  );

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    nav(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="nf">
      <main className="nf__main" role="region" aria-labelledby="nf-title">
        <div className="nf__card">
          {/* Brand mini */}
          <div className="nf__brand">
            <span className="nf__brandIcon" aria-hidden>
              <UtensilsCrossed className="nf__icon" aria-hidden />
            </span>
            <p className="nf__brandText">FoodLoop</p>
          </div>

          {/* Title */}
          <h1 id="nf-title" className="nf__title">
            <span className="nf__badge">404</span>
            <span className="nf__titleText">Halaman tidak ditemukan</span>
          </h1>

          <p className="nf__subtitle">
            Maaf, fitur atau alamat yang kamu buka belum tersedia di FoodLoop. Kamu bisa mencari fitur lain,
            kembali ke beranda, atau laporkan agar tim kami bisa meninjau.
          </p>

          {/* Search */}
          <form onSubmit={onSearch} className="nf__search" role="search" aria-label="Cari fitur FoodLoop">
            <div className="nf__searchWrap">
              <label htmlFor="nf-search" className="sr-only">Cari fitur</label>
              <Search className="nf__searchIcon" aria-hidden />
              <input
                id="nf-search"
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari: dashboard, donation map, resep…"
                className="nf__input"
              />
            </div>
            <button type="submit" className="nf__btn nf__btn--primary">
              <Search className="nf__btnIcon" aria-hidden /> Cari
            </button>
          </form>

          {/* Quick links */}
          <div className="nf__quicklinks">
            {suggestions.map(({ href, label, icon: Icon }) => (
              <Link key={href} to={href} className="nf__ql">
                <span className="nf__qlLeft">
                  <span className="nf__qlIconWrap"><Icon className="nf__qlIcon" aria-hidden /></span>
                  <span className="nf__qlLabel">{label}</span>
                </span>
                <svg className="nf__qlArrow" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="nf__actions">
            <button onClick={() => nav(-1)} className="nf__btn nf__btn--ghost">
              <ArrowLeft className="nf__btnIcon" aria-hidden /> Kembali
            </button>
            <Link to="/" className="nf__btn nf__btn--primary">
              <Home className="nf__btnIcon" aria-hidden /> Ke Beranda
            </Link>
            <Link to="/feedback" className="nf__btn nf__btn--outline">
              <Bug className="nf__btnIcon" aria-hidden /> Laporkan Masalah
            </Link>
          </div>
        </div>

        <p className="nf__hint">
          Tip: kamu juga bisa membuka <code className="nf__code">/donation-map</code> untuk melihat pos donasi terdekat.
        </p>
      </main>
    </div>
  );
}
