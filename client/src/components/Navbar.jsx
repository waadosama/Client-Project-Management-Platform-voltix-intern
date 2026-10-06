import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#stats", label: "Why us" },
  { href: "#cta", label: "Pricing" },
];

export default function Navbar({ brand, tagline }) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/", { replace: true });
  }

  return (
    <header className="navbar">
      <Link className="brand" to="/" aria-label={`${brand} home`}>
        <span className="brand-mark">◆</span>
        <span className="brand-text">
          <strong>{brand}</strong>
          <small>{tagline}</small>
        </span>
      </Link>

      <nav className={`nav-links ${open ? "open" : ""}`}>
        {LINKS.map((link) => (
          <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
            {link.label}
          </a>
        ))}
      </nav>

      <div className="nav-actions">
        {user ? (
          <>
            <Link className="btn btn-ghost" to="/dashboard">
              Dashboard
            </Link>
            <button className="btn btn-outline" onClick={handleLogout}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link className="btn btn-ghost" to="/login">
              Sign in
            </Link>
            <Link className="btn btn-primary" to="/login?next=%2Fdashboard">
              Get started
            </Link>
          </>
        )}
      </div>

      <button
        className="nav-toggle"
        aria-label="Toggle navigation"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        ☰
      </button>
    </header>
  );
}
