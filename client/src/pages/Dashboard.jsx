import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
  fetchClients,
  createClient,
  fetchUsers,
} from "../services/api.js";

const STATUS_LABEL = {
  planning: "Planning",
  "in-progress": "In progress",
  review: "In review",
  delivered: "Delivered",
};

const EMPTY_FORM = {
  name: "",
  description: "",
  client: "",
  status: "planning",
  progress: "0",
  budget: "",
  dueDate: "",
  teamMembers: [],
};

const initials = (name = "?") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?";

/** "Jane Doe" → "Jane D." — keeps the member list readable in a narrow column. */
const shortName = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] || "";
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
};

/** Feather-style stroke icons — decoration only, they add no behaviour. */
function Icon({ name, size = 18 }) {
  const paths = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    folder: (
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    ),
    bolt: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />,
    cash: (
      <>
        <rect x="2" y="6" width="20" height="12" rx="3" />
        <circle cx="12" cy="12" r="2.5" />
        <path d="M6 12h.01M18 12h.01" />
      </>
    ),
    chart: (
      <>
        <path d="m3 17 5-5 4 3 6-7" />
        <path d="M15 8h4v4" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" />
      </>
    ),
    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5" />
        <path d="M21 12H9" />
      </>
    ),
  };
  return (
    <svg
      className="ico"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

/** Deterministic monogram tint, so a project keeps the same colour every render. */
const MONO_COLORS = [
  "#4f46e5",
  "#0ea5e9",
  "#f59e0b",
  "#10b981",
  "#ec4899",
  "#8b5cf6",
  "#f43f5e",
  "#14b8a6",
];

const monogramStyle = (name = "?") => {
  const color = MONO_COLORS[(name.charCodeAt(0) || 0) % MONO_COLORS.length];
  return { background: `${color}1f`, color };
};

/** Dots for the per-status summary chips. */
const STATUS_DOT = {
  planning: "#94a3b8",
  "in-progress": "#0ea5e9",
  review: "#f59e0b",
  delivered: "#10b981",
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); // null → create mode
  const [form, setForm] = useState(EMPTY_FORM);
  const [newClientName, setNewClientName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null); // row whose status is saving

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [projectsRes, clientsRes, usersRes] = await Promise.allSettled([
        fetchProjects(),
        fetchClients(),
        fetchUsers(),
      ]);
      if (cancelled) return;

      if (clientsRes.status === "fulfilled") setClients(clientsRes.value.data);
      if (usersRes.status === "fulfilled") setUsers(usersRes.value.data);
      if (projectsRes.status === "fulfilled") setProjects(projectsRes.value.data);
      else setError(projectsRes.reason.message);

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleMember(id) {
    setForm((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.includes(id)
        ? prev.teamMembers.filter((m) => m !== id)
        : [...prev.teamMembers, id],
    }));
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setNewClientName("");
    setError("");
    setShowForm(true);
  }

  function openEdit(project) {
    setEditingId(project._id);
    setNewClientName("");
    setError("");
    setForm({
      name: project.name,
      description: project.description || "",
      client: project.client?._id || "",
      status: project.status,
      progress: String(project.progress ?? 0),
      budget: String(project.budget ?? 0),
      dueDate: project.dueDate ? String(project.dueDate).slice(0, 10) : "",
      teamMembers: (project.teamMembers || []).map((m) => m._id || m),
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setNewClientName("");
    setError("");
  }

  /** Creates the project — or updates it when `editingId` is set. */
  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      // The optional "new client" box wins over the select.
      let clientId = form.client;
      const typedClient = newClientName.trim();
      if (typedClient) {
        try {
          const created = await createClient({ name: typedClient });
          clientId = created.data._id;
          setClients((prev) =>
            [...prev, created.data].sort((a, b) => a.name.localeCompare(b.name))
          );
        } catch (err) {
          // A client with that name already exists → just reuse it.
          const existing = clients.find(
            (c) => c.name.toLowerCase() === typedClient.toLowerCase()
          );
          if (!existing) throw err;
          clientId = existing._id;
        }
      }

      if (!clientId) {
        throw new Error("Pick a client, or type a new client name");
      }

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        client: clientId,
        status: form.status,
        progress: Number(form.progress) || 0,
        budget: Number(form.budget) || 0,
        // `null` clears the date; `undefined` would mean "leave it alone".
        dueDate: form.dueDate || null,
        teamMembers: form.teamMembers,
      };

      if (editingId) {
        const res = await updateProject(editingId, payload);
        setProjects((prev) => prev.map((p) => (p._id === editingId ? res.data : p)));
      } else {
        const res = await createProject(payload);
        setProjects((prev) => [res.data, ...prev]);
      }

      closeForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(project) {
    if (!window.confirm(`Delete "${project.name}"? This cannot be undone.`)) return;

    setDeletingId(project._id);
    setError("");
    try {
      await deleteProject(project._id);
      setProjects((prev) => prev.filter((p) => p._id !== project._id));
      if (editingId === project._id) closeForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  /**
   * Quick status change straight from the list (owner or admin only — the API
   * enforces the same rule). Sends just `{ status }`; the rest is untouched.
   */
  async function handleStatusChange(project, status) {
    if (status === project.status) return;

    setUpdatingId(project._id);
    setError("");
    try {
      const res = await updateProject(project._id, { status });
      setProjects((prev) => prev.map((p) => (p._id === project._id ? res.data : p)));
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/", { replace: true });
  }

  /** Only the owner (or an admin) may change a project — mirrors the API rule. */
  const canManage = (project) =>
    user.role === "admin" || String(project.owner) === String(user.id);

  const totals = useMemo(() => {
    const active = projects.filter((p) => p.status !== "delivered").length;
    const budget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const progress = projects.length
      ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
      : 0;
    return { active, budget, progress };
  }, [projects]);

  // Per-status tally for the summary chips — derived from data already loaded.
  const statusCounts = useMemo(() => {
    const counts = { planning: 0, "in-progress": 0, review: 0, delivered: 0 };
    for (const p of projects) counts[p.status] = (counts[p.status] || 0) + 1;
    return counts;
  }, [projects]);

  // People who can be assigned to a project (you are the owner, so not a member).
  const assignable = useMemo(
    () => users.filter((u) => String(u.id) !== String(user.id)),
    [users, user.id]
  );

  return (
    <div className="dash">
      <aside className="dash-side">
        <Link className="dash-side-brand" to="/">
          <span className="brand-mark">◆</span>
          <span className="brand-text">
            <strong>ClientFlow</strong>
            <small>Project workspace</small>
          </span>
        </Link>

        <nav className="dash-nav" aria-label="Dashboard sections">
          <span className="dash-nav-label">Menu</span>
          <a className="dash-nav-item active" href="#overview">
            <Icon name="grid" /> Overview
          </a>
          <a className="dash-nav-item" href="#projects">
            <Icon name="folder" /> Projects
            <em className="dash-nav-count">{projects.length}</em>
          </a>
        </nav>

        <div className="dash-side-foot">
          <div className="dash-side-user">
            <span className="avatar">{initials(user.name)}</span>
            <span className="dash-side-user-name">
              {user.name}
              <small>{user.role}</small>
            </span>
          </div>
          <Link className="dash-side-link" to="/">
            <Icon name="globe" size={16} /> View site
          </Link>
          <button className="dash-side-link" onClick={handleLogout}>
            <Icon name="logout" size={16} /> Sign out
          </button>
        </div>
      </aside>

      <div className="dash-body">
        <header className="dash-top">
          <div className="dash-crumbs">
            Workspace <span>/</span> <strong>Dashboard</strong>
          </div>
          <div className="dash-top-right">
            <span className="dash-date">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </span>
            <button className="btn btn-primary" onClick={showForm ? closeForm : openCreate}>
              {showForm ? (
                "Close"
              ) : (
                <>
                  <Icon name="plus" size={16} /> New project
                </>
              )}
            </button>
          </div>
        </header>

        <main className="dash-main">
          <section className="dash-welcome" id="overview">
            <div>
              <span className="eyebrow">Your workspace</span>
              <h1>Welcome back, {user.name.split(" ")[0]} 👋</h1>
              <p>Everything your team is shipping for clients, in one place.</p>
            </div>
            <span className={`dash-role dash-role-${user.role}`}>
              {user.role === "admin" ? "Admin access" : "Member access"}
            </span>
          </section>

          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

        {showForm && (
          <form className="dash-form" onSubmit={handleSubmit}>
            <div className="dash-form-head">
              <h2>{editingId ? "Edit project" : "New project"}</h2>
              <button type="button" className="btn btn-ghost btn-sm" onClick={closeForm}>
                Cancel
              </button>
            </div>

            <div className="f-field">
              <label htmlFor="f-name">Project name</label>
              <input
                id="f-name"
                placeholder="Acme Rebrand"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
              />
            </div>

            <div className="f-field">
              <label htmlFor="f-client">Client</label>
              <select
                id="f-client"
                value={form.client}
                onChange={(e) => set("client", e.target.value)}
                required={!newClientName.trim()}
              >
                <option value="" disabled>
                  {clients.length ? "Select a client…" : "No clients yet"}
                </option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                className="f-inline"
                placeholder="…or type a new client name"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
              />
            </div>

            <div className="f-field f-wide">
              <label htmlFor="f-desc">Description</label>
              <textarea
                id="f-desc"
                placeholder="What is this project about? Scope, goals, deliverables…"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>

            <div className="f-field">
              <label htmlFor="f-status">Status</label>
              <select
                id="f-status"
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                {Object.entries(STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="f-field">
              <label htmlFor="f-progress">Progress (%)</label>
              <input
                id="f-progress"
                type="number"
                min="0"
                max="100"
                value={form.progress}
                onChange={(e) => set("progress", e.target.value)}
              />
            </div>

            <div className="f-field">
              <label htmlFor="f-budget">Budget (USD)</label>
              <input
                id="f-budget"
                type="number"
                min="0"
                placeholder="0"
                value={form.budget}
                onChange={(e) => set("budget", e.target.value)}
              />
            </div>

            <div className="f-field">
              <label htmlFor="f-due">Due date</label>
              <input
                id="f-due"
                type="date"
                value={form.dueDate}
                onChange={(e) => set("dueDate", e.target.value)}
              />
            </div>

            <div className="f-field f-wide" role="group" aria-labelledby="f-team-label">
              <span className="f-label" id="f-team-label">
                Team members
              </span>
              {assignable.length === 0 ? (
                <span className="hint">No other accounts yet — nobody to assign.</span>
              ) : (
                <div className="team-picker">
                  {assignable.map((u) => {
                    const on = form.teamMembers.includes(u.id);
                    return (
                      <label className={`team-chip${on ? " on" : ""}`} key={u.id}>
                        <input type="checkbox" checked={on} onChange={() => toggleMember(u.id)} />
                        <span className="avatar avatar-xs">{initials(u.name)}</span>
                        {u.name}
                        <small>{u.role}</small>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="dash-form-actions">
              <button className="btn btn-primary" disabled={saving}>
                {saving ? "Saving…" : editingId ? "Save changes" : "Create project"}
              </button>
            </div>
          </form>
        )}

        <section className="dash-stats">
          <div className="kpi">
            <span className="kpi-icon kpi-icon-brand">
              <Icon name="folder" />
            </span>
            <div className="kpi-text">
              <small>Projects</small>
              <strong>{projects.length}</strong>
              <span className="kpi-foot">
                across {clients.length} client{clients.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          <div className="kpi">
            <span className="kpi-icon kpi-icon-sky">
              <Icon name="bolt" />
            </span>
            <div className="kpi-text">
              <small>Active</small>
              <strong>{totals.active}</strong>
              <span className="kpi-foot">
                {projects.length - totals.active} delivered
              </span>
            </div>
          </div>

          <div className="kpi">
            <span className="kpi-icon kpi-icon-green">
              <Icon name="cash" />
            </span>
            <div className="kpi-text">
              <small>Total budget</small>
              <strong>${totals.budget.toLocaleString()}</strong>
              <span className="kpi-foot">
                avg $
                {Math.round(totals.budget / (projects.length || 1)).toLocaleString()} per
                project
              </span>
            </div>
          </div>

          <div className="kpi">
            <span className="kpi-icon kpi-icon-amber">
              <Icon name="chart" />
            </span>
            <div className="kpi-text">
              <small>Avg. progress</small>
              <strong>{totals.progress}%</strong>
              <span className="kpi-bar">
                <span style={{ width: `${totals.progress}%` }} />
              </span>
            </div>
          </div>
        </section>

        <section className="dash-panel" id="projects">
          <div className="dash-panel-head">
            <div className="dash-panel-title">
              <h2>Projects</h2>
              <span>
                {user.role === "admin"
                  ? "All projects — admin access"
                  : "Owned by or assigned to you"}
              </span>
            </div>
            <div className="status-summary">
              {Object.entries(STATUS_LABEL).map(([value, label]) => (
                <span className="status-dot" key={value}>
                  <i style={{ background: STATUS_DOT[value] }} />
                  {label} <b>{statusCounts[value] || 0}</b>
                </span>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="page-loader">
              <span className="spinner" />
              Loading projects…
            </div>
          ) : projects.length === 0 ? (
            <p className="empty">No projects yet — create your first one.</p>
          ) : (
            <>
              <div className="project-list-head">
                <span>Project</span>
                <span>Status</span>
                <span>Client &amp; team</span>
                <span>Progress</span>
                <span className="col-right">Budget</span>
                <span className="col-right">Actions</span>
              </div>
              <ul className="project-list">
              {projects.map((p) => {
                const members = p.teamMembers || [];
                return (
                  <li className="project-row" key={p._id}>
                    <div className="project-name">
                      <div className="project-title">
                        <span className="monogram" style={monogramStyle(p.name)}>
                          {(p.name || "?").trim().slice(0, 1).toUpperCase() || "?"}
                        </span>
                        <div className="project-title-text">
                          <strong>{p.name}</strong>
                          <small className="project-desc">
                            {p.description || "No description yet"}
                          </small>
                        </div>
                      </div>
                    </div>

                    {canManage(p) ? (
                      <select
                        className={`badge status-select badge-${p.status}`}
                        value={p.status}
                        disabled={updatingId === p._id}
                        aria-label={`Status of ${p.name}`}
                        onChange={(e) => handleStatusChange(p, e.target.value)}
                      >
                        {Object.entries(STATUS_LABEL).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={`badge badge-${p.status}`}>
                        {STATUS_LABEL[p.status] || p.status}
                      </span>
                    )}

                    <div className="project-meta">
                      <span className="project-client">{p.client?.name || "No client"}</span>
                      <div
                        className="team-block"
                        title={
                          members.length
                            ? `Assigned: ${members.map((m) => m.name).join(", ")}`
                            : "Nobody assigned"
                        }
                      >
                        <div className="team-avatars">
                          {members.length === 0 ? (
                            <small className="hint">Nobody assigned</small>
                          ) : (
                            <>
                              {members.slice(0, 3).map((m) => (
                                <span className="avatar avatar-xs" key={m._id} title={m.name}>
                                  {initials(m.name)}
                                </span>
                              ))}
                              {members.length > 3 && (
                                <span className="avatar avatar-xs avatar-more">
                                  +{members.length - 3}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                        {members.length > 0 && (
                          <small className="team-names">
                            {members.map((m) => shortName(m.name)).join(", ")}
                          </small>
                        )}
                      </div>
                    </div>

                    <div className="project-progress">
                      <div className="progress">
                        <div
                          className="progress-fill"
                          style={{ width: `${p.progress || 0}%` }}
                        />
                      </div>
                      <span className="progress-value">{p.progress || 0}%</span>
                    </div>

                    <span className="project-budget">
                      ${(p.budget || 0).toLocaleString()}
                    </span>

                    <div className="project-actions">
                      {canManage(p) ? (
                        <>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => openEdit(p)}
                            disabled={deletingId === p._id}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(p)}
                            disabled={deletingId === p._id}
                          >
                            {deletingId === p._id ? "Deleting…" : "Delete"}
                          </button>
                        </>
                      ) : (
                        <span className="hint">View only</span>
                      )}
                    </div>
                  </li>
                );
              })}
              </ul>
              <div className="dash-panel-foot">
                <span>
                  Showing {projects.length} project{projects.length === 1 ? "" : "s"}
                </span>
                <span>Owners &amp; admins can edit — teammates get read-only access</span>
              </div>
            </>
          )}
        </section>
        </main>
      </div>
    </div>
  );
}
