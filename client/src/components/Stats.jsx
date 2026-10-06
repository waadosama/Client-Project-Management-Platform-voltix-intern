export default function Stats({ stats = [] }) {
  if (!stats.length) return null;

  return (
    <section className="stats" id="stats">
      <div className="stats-inner">
        {stats.map((stat) => (
          <div className="stat" key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
