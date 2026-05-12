import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authClient } from "@/lib/auth-client";

export function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await authClient.signIn.email({ email, password });
    setLoading(false);
    if (res.error) {
      setError(res.error.message ?? "Could not sign in");
      return;
    }
    nav("/account");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-white">Welcome back</h1>
      <p className="mt-2 text-sm text-zinc-400">
        No account yet?{" "}
        <Link to="/register" className="text-brand-400 hover:underline">
          Register
        </Link>
      </p>
      <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
        <div>
          <label className="text-sm text-zinc-300" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white outline-none ring-brand-500 focus:ring-2"
          />
        </div>
        <div>
          <label className="text-sm text-zinc-300" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white outline-none ring-brand-500 focus:ring-2"
          />
        </div>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
