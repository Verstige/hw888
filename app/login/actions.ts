"use server";

import { redirect } from "next/navigation";

export async function logoutAction() {
  // Simple server-side logout: clear the session cookie by redirecting to NextAuth signout
  redirect("/api/auth/signout");
}
