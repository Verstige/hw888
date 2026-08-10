import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { loginAction } from "./actions";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--color-primary)] mb-4">
            <span className="text-white font-bold text-2xl">HW</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">HW888</h1>
          <p className="text-[var(--color-text-muted)] mt-1">Holistic World Sales Platform</p>
        </div>

        <div className="card">
          <form action={loginAction} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text)] mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@holisticworldus.com"
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-[var(--color-text)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text)] mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-[var(--color-text)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[var(--color-primary)] text-white font-semibold rounded-lg hover:bg-[var(--color-primary-light)] transition-colors"
            >
              Sign In
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[var(--color-text-muted)] mt-6">
          HW888 — Holistic World Internal Platform
        </p>
      </div>
    </div>
  );
}
