"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "1rem" }}>
      <div className="glass" style={{ padding: "2.5rem", width: "100%", maxWidth: "420px" }}>
        {/* Logo / Title */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              fontSize: "2.5rem",
              fontWeight: 700,
              letterSpacing: "0.15em",
              background: "linear-gradient(135deg, #C9A84C 0%, #E0C36A 50%, #C9A84C 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: "0.25rem",
            }}
          >
            HW888
          </div>
          <p style={{ color: "#8A9E8C", fontSize: "0.85rem", fontWeight: 500 }}>
            Holistic World · Sales Platform
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#8A9E8C", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="employee@holisticworldus.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#8A9E8C", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div style={{ background: "rgba(196,68,68,0.15)", border: "1px solid rgba(196,68,68,0.3)", borderRadius: "8px", padding: "0.75rem", color: "#e05555", fontSize: "0.85rem", textAlign: "center" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-gold"
            disabled={loading}
            style={{ width: "100%", padding: "0.875rem", fontSize: "1rem", marginTop: "0.5rem" }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="divider" style={{ margin: "1.5rem 0" }} />
        <p style={{ textAlign: "center", color: "#5A6E5C", fontSize: "0.8rem" }}>
          Contact your manager to get your login credentials.
        </p>
      </div>
    </div>
  );
}
