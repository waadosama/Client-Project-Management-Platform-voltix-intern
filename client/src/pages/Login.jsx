import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(next, { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <Link className="brand auth-brand" to="/">
          <span className="brand-mark">◆</span>
          <span className="brand-text">
            <strong>ClientFlow</strong>
            <small>Client Project Management Platform</small>
          </span>
        </Link>

        <h1>Welcome back</h1>
        <p className="auth-sub">Sign in to reach your private dashboard.</p>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button className="btn btn-primary btn-lg auth-submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="auth-hint">
          Demo account: <code>admin@clientflow.io</code> / <code>Admin123!</code>
        </p>
        <p className="auth-foot">
          Don’t have an account? Ask your workspace admin to invite you.
        </p>
      </div>

      <aside className="auth-side">
        <h2>Every client project. One calm workspace.</h2>
        <ul>
          <li>✓ Timelines, budgets and approvals</li>
          <li>✓ Client-facing progress views</li>
          <li>✓ Proposals and invoices in one place</li>
        </ul>
      </aside>
    </div>
  );
}
