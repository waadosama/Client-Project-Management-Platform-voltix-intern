import { Link } from "react-router-dom";

export default function CallToAction({ cta }) {
  if (!cta?.title) return null;

  return (
    <section className="section" id="cta">
      <div className="cta-box">
        <div>
          <h2>{cta.title}</h2>
          <p>{cta.subtitle}</p>
        </div>
        <div className="cta-actions">
          <Link className="btn btn-light btn-lg" to="/signup?next=%2Fdashboard">
            {cta.button}
          </Link>
          <small>No credit card required</small>
        </div>
      </div>
    </section>
  );
}
