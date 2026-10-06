import { useState } from "react";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#stats", label: "Why us" },
  { href: "#cta", label: "Pricing" },
];

export default function Navbar({ brand, tagline }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="navbar">
      <a className="brand" href="#top" aria-label={`${brand} home`}>
        <span className="brand-mark">◆</span>
        <span className="brand-text">
          <strong>{brand}</strong>
          <small>{tagline}</small>
        </span>
      </a>

      <nav className={`nav-links ${open ? "open" : ""}`}>
        {LINKS.map((link) => (
          <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
            {link.label}
          </a>
        ))}
      </nav>

      <div className="nav-actions">
        <a className="btn btn-ghost" href="#cta">
          Sign in
        </a>
        <a className="btn btn-primary" href="#cta">
          Get started
        </a>
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
