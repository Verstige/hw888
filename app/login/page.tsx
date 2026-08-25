"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const csrfRes = await fetch("/api/auth/csrf", { credentials: "include" });
      const csrfData = await csrfRes.json();
      const csrfToken: string = csrfData.csrfToken;

      const body = new URLSearchParams({
        csrfToken,
        email,
        password,
        callbackUrl: "/dashboard",
        json: "true",
      });
      const res = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        credentials: "include",
        redirect: "manual",
      });
      if (res.status === 200 || res.status === 302) {
        router.push("/dashboard");
        router.refresh();
        return;
      }
      setError("Invalid email or password");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="hero-bg" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <div className="hero-orb" style={{ width: 320, height: 320, top: "-8%", left: "-10%", background: "radial-gradient(circle, rgba(201, 168, 76, 0.55) 0%, transparent 70%)" }} />
      <div className="hero-orb" style={{ width: 380, height: 380, bottom: "-12%", right: "-8%", background: "radial-gradient(circle, rgba(45, 90, 61, 0.55) 0%, transparent 70%)" }} />
      <div className="hero-orb" style={{ width: 240, height: 240, top: "40%", right: "8%", background: "radial-gradient(circle, rgba(196, 114, 74, 0.45) 0%, transparent 70%)" }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 80,
            height: 80,
            borderRadius: 24,
            background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)",
            boxShadow: "0 16px 48px rgba(45, 90, 61, 0.40), inset 0 2px 0 rgba(255, 255, 255, 0.20)",
            marginBottom: "1rem",
            position: "relative",
          }}>
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2.5c4 5 6 8 6 12a6 6 0 0 1-12 0c0-4 2-7 6-12z" />
              <path d="M12 7v13" />
            </svg>
          </div>
          <h1 style={{
            fontSize: "2.5rem",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: "var(--color-text)",
            lineHeight: 1,
            marginBottom: "0.5rem",
          }}>
            HW888
          </h1>
          <p style={{
            fontSize: "0.9375rem",
            color: "var(--color-text-muted)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}>
            Holistic World
          </p>
          <p style={{
            fontSize: "0.9375rem",
            color: "var(--color-text-muted)",
            marginTop: "0.75rem",
            lineHeight: 1.5,
            maxWidth: 320,
            marginLeft: "auto",
            marginRight: "auto",
          }}>
            Field sales, commissions, and operations — all in one place.
          </p>
        </div>

        <div className="glass-strong" style={{ padding: "1.75rem" }}>
          <h2 style={{
            fontSize: "1.125rem",
            fontWeight: 700,
            letterSpacing: "-0.01em",
            marginBottom: "1.25rem",
            color: "var(--color-text)",
          }}>
            Sign in
          </h2>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.875rem" }}>
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@holisticworldus.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
              />
            </div>

            {error && (
              <div style={{
                padding: "0.625rem 0.875rem",
                background: "rgba(196, 68, 68, 0.10)",
                color: "var(--color-danger)",
                fontSize: "0.8125rem",
                fontWeight: 600,
                borderRadius: 12,
                border: "1px solid rgba(196, 68, 68, 0.20)",
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary btn-block"
              style={{ marginTop: "0.5rem" }}
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p style={{
          textAlign: "center",
          fontSize: "0.75rem",
          color: "var(--color-text-muted)",
          marginTop: "1.5rem",
          opacity: 0.7,
        }}>
          HW888 · Internal Platform · v2.0
        </p>
      </div>
    </div>
  );
}
