"use server";

import { signIn } from "next-auth/react";
import { signOut } from "next-auth/react";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const result = await signIn("credentials", {
    email,
    password,
    redirect: false,
  });

  if (result?.error) {
    throw new Error("Invalid email or password");
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  await signOut({ redirect: false });
  redirect("/login");
}
