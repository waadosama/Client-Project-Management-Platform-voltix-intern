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

  // People who can be assigned to a project (you are the owner, so not a member).
  const assignable = useMemo(
    () => users.filter((u) => String(u.id) !== String(user.id)),
    [users, user.id]
  );

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
          <span className="avatar">{initials(user.name)}</span>
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
          <button className="btn btn-primary" onClick={showForm ? closeForm : openCreate}>
            {showForm ? "Close" : "+ New project"}
          </button>
        </div>

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
            <span>
              {user.role === "admin"
                ? "All projects — admin access"
                : "Owned by or assigned to you"}
            </span>
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
              {projects.map((p) => {
                const members = p.teamMembers || [];
                return (
                  <li className="project-row" key={p._id}>
                    <div className="project-name">
                      <strong>{p.name}</strong>
                      <small className="project-desc">
                        {p.description || "No description yet"}
                      </small>
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
          )}
        </section>
      </main>
    </div>
  );
}
