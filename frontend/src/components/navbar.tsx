import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="nav">
      <div className="nav__inner">
        <a className="brand" href="/">FoodLoop</a>

        <button
          className="hamburger"
          onClick={() => setOpen(v => !v)}
          aria-label="Toggle menu"
        >
          ☰
        </button>

        <nav className={`nav__links ${open ? "is-open" : ""}`}>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/dashboard">Dashboard</a></li>
            <li><a href="/donation-map">Donation Map</a></li>
            <li><a href="/recipe-suggestions">Recipes</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
