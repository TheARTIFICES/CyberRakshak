import { useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AlertCircle, Loader2, Lock, User as UserIcon } from "lucide-react";
import logo from "../assets/indian logo.png";
import { login } from "../services/api";

/**
 * Login — minimum-viable auth surface per FRONTEND_ROADMAP.md §5: a real
 * form against POST /api/auth/token, real JWT storage, and a client-side
 * route guard (see router/ProtectedRoute.tsx).
 *
 * Known limitation, documented rather than hidden: backend/app/config.py
 * still has AUTH_DISABLED=True (the Phase 1 auth-default-flip item), so
 * every API endpoint accepts unauthenticated requests regardless of what
 * happens here. This screen and its guard are the real, honest frontend
 * half of the login workflow — server-side enforcement is separate,
 * backend work that is explicitly out of scope for this session.
 */
const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { access_token } = await login(username, password);
      localStorage.setItem("token", access_token);
      navigate(from, { replace: true });
    } catch (err) {
      console.error("Login failed:", err);
      setError(err instanceof Error ? err.message : "Login failed. Check your credentials and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="CyberRakshak" className="w-16 h-16 object-contain mb-3" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">CyberRakshak</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Sign in to the security & governance portal</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-800 shadow rounded-xl p-6 space-y-4"
        >
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Username</label>
            <div className="flex items-center gap-2 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500">
              <UserIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                required
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none dark:text-white"
                placeholder="admin"
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Password</label>
            <div className="flex items-center gap-2 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500">
              <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none dark:text-white"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-4">
          Bearer token issued by <code className="font-mono">POST /api/auth/token</code>
        </p>
      </div>
    </div>
  );
};

export default Login;
