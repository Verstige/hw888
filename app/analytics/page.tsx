import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AnalyticsClient from "./AnalyticsClient";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const userId = (session.user as any).id;
  const userName = session.user?.name || "User";
  const userRole = (session.user as any).role as "ADMIN" | "MANAGER" | "EMPLOYEE";
  if (userRole === "EMPLOYEE") {
    redirect("/dashboard");
  }
  return <AnalyticsClient user={{ id: userId, name: userName, role: userRole }} />;
}
