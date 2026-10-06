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
          <a className="btn btn-light btn-lg" href="#top">
            {cta.button}
          </a>
          <small>No credit card required</small>
        </div>
      </div>
    </section>
  );
}
