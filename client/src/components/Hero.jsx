import { Link } from "react-router-dom";

export default function Hero({ hero }) {
  return (
    <section className="hero" id="top">
      <div className="hero-copy">
        <span className="eyebrow">{hero.eyebrow}</span>
        <h1>
          {hero.title} <span className="accent">{hero.highlight}</span>
        </h1>
        <p className="lede">{hero.subtitle}</p>

        <div className="hero-actions">
          <Link className="btn btn-primary btn-lg" to="/login?next=%2Fdashboard">
            {hero.primaryCta}
          </Link>
          <a className="btn btn-outline btn-lg" href="#how-it-works">
            {hero.secondaryCta} →
          </a>
        </div>

        <ul className="hero-trust">
          <li>✓ No credit card</li>
          <li>✓ Unlimited projects</li>
          <li>✓ Setup in 2 minutes</li>
        </ul>
      </div>

      <div className="hero-visual" aria-hidden="true">
        <div className="mock-window">
          <div className="mock-bar">
            <span className="dot red" />
            <span className="dot yellow" />
            <span className="dot green" />
            <span className="mock-title">Acme Rebrand · Dashboard</span>
          </div>

          <div className="mock-body">
            <div className="mock-sidebar">
              <span className="chip active">Overview</span>
              <span className="chip">Timeline</span>
              <span className="chip">Clients</span>
              <span className="chip">Invoices</span>
            </div>

            <div className="mock-main">
              <div className="mock-cards">
                <div className="mini-card">
                  <small>On track</small>
                  <strong>14</strong>
                </div>
                <div className="mini-card">
                  <small>Awaiting approval</small>
                  <strong>3</strong>
                </div>
                <div className="mini-card">
                  <small>Budget used</small>
                  <strong>62%</strong>
                </div>
              </div>

              <div className="timeline">
                <div className="bar b1" style={{ "--w": "78%" }}>
                  Discovery
                </div>
                <div className="bar b2" style={{ "--w": "55%" }}>
                  Design
                </div>
                <div className="bar b3" style={{ "--w": "34%" }}>
                  Build
                </div>
                <div className="bar b4" style={{ "--w": "18%" }}>
                  Launch
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="float-card float-1">
          <span className="avatar">AR</span>
          <div>
            <strong>Design approved</strong>
            <small>Acme Rebrand · just now</small>
          </div>
        </div>

        <div className="float-card float-2">
          <span className="avatar green">$$</span>
          <div>
            <strong>Invoice #1042 paid</strong>
            <small>$8,400 · milestone 2</small>
          </div>
        </div>
      </div>
    </section>
  );
}
