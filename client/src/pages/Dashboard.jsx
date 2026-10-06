import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { fetchProjects, createProject } from "../services/api.js";

const STATUS_LABEL = {
  planning: "Planning",
  "in-progress": "In progress",
  review: "In review",
  delivered: "Delivered",
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", client: "", budget: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setError("");
    try {
      const res = await fetchProjects();
      setProjects(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await createProject({
        name: form.name.trim(),
        client: form.client.trim(),
        budget: Number(form.budget) || 0,
        progress: 0,
        status: "planning",
      });
      setProjects((prev) => [res.data, ...prev]);
      setForm({ name: "", client: "", budget: "" });
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/", { replace: true });
  }

  const totals = useMemo(() => {
    const active = projects.filter((p) => p.status !== "delivered").length;
    const budget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const progress = projects.length
      ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
      : 0;
    return { active, budget, progress };
  }, [projects]);

  return (
    <div className="dash">
      <header className="dash-top">
        <Link className="brand" to="/">
          <span className="brand-mark">◆</span>
          <span className="brand-text">
            <strong>ClientFlow</strong>
            <small>Private dashboard</small>
          </span>
        </Link>

        <div className="dash-user">
          <span className="avatar">{user.name?.slice(0, 2).toUpperCase()}</span>
          <span className="dash-user-name">
            {user.name}
            <small>{user.role}</small>
          </span>
          <button className="btn btn-outline" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </header>

      <main className="dash-main">
        <div className="dash-head">
          <div>
            <span className="eyebrow">Your workspace</span>
            <h1>Welcome back, {user.name.split(" ")[0]}</h1>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Close" : "+ New project"}
          </button>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        {showForm && (
          <form className="dash-form" onSubmit={handleCreate}>
            <input
              placeholder="Project name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              placeholder="Client"
              value={form.client}
              onChange={(e) => setForm({ ...form, client: e.target.value })}
              required
            />
            <input
              type="number"
              min="0"
              placeholder="Budget"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
            />
            <button className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Add project"}
            </button>
          </form>
        )}

        <section className="dash-stats">
          <div className="kpi">
            <small>Projects</small>
            <strong>{projects.length}</strong>
          </div>
          <div className="kpi">
            <small>Active</small>
            <strong>{totals.active}</strong>
          </div>
          <div className="kpi">
            <small>Total budget</small>
            <strong>${totals.budget.toLocaleString()}</strong>
          </div>
          <div className="kpi">
            <small>Avg. progress</small>
            <strong>{totals.progress}%</strong>
          </div>
        </section>

        <section className="dash-panel">
          <div className="dash-panel-head">
            <h2>Projects</h2>
            <span>Only visible to you — protected API</span>
          </div>

          {loading ? (
            <div className="page-loader">
              <span className="spinner" />
              Loading projects…
            </div>
          ) : projects.length === 0 ? (
            <p className="empty">No projects yet — create your first one.</p>
          ) : (
            <ul className="project-list">
              {projects.map((p) => (
                <li className="project-row" key={p._id}>
                  <div className="project-name">
                    <strong>{p.name}</strong>
                    <small>{p.client}</small>
                  </div>

                  <span className={`badge badge-${p.status}`}>
                    {STATUS_LABEL[p.status] || p.status}
                  </span>

                  <div className="progress">
                    <div className="progress-fill" style={{ width: `${p.progress}%` }} />
                  </div>
                  <span className="progress-value">{p.progress}%</span>

                  <span className="project-budget">
                    ${(p.budget || 0).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
