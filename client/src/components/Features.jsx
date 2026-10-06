export default function Features({ features = [] }) {
  if (!features.length) return null;

  return (
    <section className="section" id="features">
      <div className="section-head">
        <span className="eyebrow">Everything in one place</span>
        <h2>Built for teams who deliver client work</h2>
        <p>From the first kickoff call to the final invoice — no tool switching.</p>
      </div>

      <div className="feature-grid">
        {features.map((feature) => (
          <article className="feature-card" key={feature.title}>
            <span className="feature-icon">{feature.icon}</span>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
