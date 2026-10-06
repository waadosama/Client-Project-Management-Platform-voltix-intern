export default function HowItWorks({ steps = [] }) {
  if (!steps.length) return null;

  return (
    <section className="section section-alt" id="how-it-works">
      <div className="section-head">
        <span className="eyebrow">How it works</span>
        <h2>Up and running in three steps</h2>
        <p>Most teams onboard their first client project the same day.</p>
      </div>

      <div className="steps">
        {steps.map((item) => (
          <article className="step" key={item.step}>
            <span className="step-num">{item.step}</span>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
