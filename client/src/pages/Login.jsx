import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * `/login` → sign in, `/signup` → create an account.
 * The `?next=` target is carried across both so a redirect sent to /login
 * still lands after a first-time sign-up.
 */
export default function Login({ mode = "login" }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const isSignup = mode === "signup";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const search = params.toString();
  const switchTo = (path) => (search ? `${path}?${search}` : path);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (isSignup) {
        await register({ name: name.trim(), email: email.trim(), password });
      } else {
        await login(email.trim(), password);
      }
      navigate(next, { replace: true });
    } catch (err) {
      setError(err.message || (isSignup ? "Sign-up failed" : "Login failed"));
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

        <h1>{isSignup ? "Create your account" : "Welcome back"}</h1>
        <p className="auth-sub">
          {isSignup
            ? "Join the workspace and start managing client projects."
            : "Sign in to reach your private dashboard."}
        </p>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {isSignup && (
            <label>
              Name
              <input
                type="text"
                autoComplete="name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
          )}

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
              autoComplete={isSignup ? "new-password" : "current-password"}
              placeholder={isSignup ? "At least 8 characters" : "••••••••"}
              minLength={isSignup ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button className="btn btn-primary btn-lg auth-submit" disabled={submitting}>
            {submitting
              ? isSignup
                ? "Creating account…"
                : "Signing in…"
              : isSignup
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        {isSignup ? (
          <p className="auth-hint">New accounts get the <code>Member</code> role.</p>
        ) : null}

        <p className="auth-foot">
          {isSignup ? (
            <>
              Already have an account? <Link to={switchTo("/login")}>Sign in</Link>
            </>
          ) : (
            <>
              Don’t have an account? <Link to={switchTo("/signup")}>Create one</Link>
            </>
          )}
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
