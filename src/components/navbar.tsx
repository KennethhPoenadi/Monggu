import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const linkBase =
    "px-3 py-2 rounded hover:bg-slate-800 transition-colors";
  const active =
    "bg-emerald-600 text-white hover:bg-emerald-700";

  return (
    <header className="nav">
      <div className="nav__inner">
        {/* brand pakai Link, bukan <a> */}
        <Link className="brand" to="/">FoodLoop</Link>

        <button
          className="hamburger"
          onClick={() => setOpen(v => !v)}
          aria-label="Toggle menu"
        >
          ☰
        </button>

        <nav className={`nav__links ${open ? "is-open" : ""}`}>
          <ul>
            <li>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? active : ""}`
                }
                end
              >
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? active : ""}`
                }
              >
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/donation-map"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? active : ""}`
                }
              >
                Donation Map
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/recipe-suggestions"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? active : ""}`
                }
              >
                Recipes
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
