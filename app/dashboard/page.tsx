import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { signOut } from "next-auth/react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;

  // Get today's sales for this user
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaySales = await prisma.sale.aggregate({
    where: { userId, createdAt: { gte: today } },
    _sum: { salePrice: true, commission: true },
    _count: true,
  });

  // Active show (if any)
  const activeShows = await prisma.show.findMany({
    where: {
      status: "ACTIVE",
      assignments: { some: { userId } },
    },
    take: 1,
    include: {
      manager: { select: { name: true } },
    },
  });

  const activeShow = activeShows[0] || null;

  // Recent sales
  const recentSales = await prisma.sale.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      show: { select: { name: true, location: true } },
    },
  });

  const roleLabel = ({ ADMIN: "Admin", MANAGER: "Manager", EMPLOYEE: "Employee" } as Record<string, string>)[userRole as string];

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Header */}
      <header className="bg-[var(--color-primary)] text-white px-6 py-5">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Welcome back,</p>
              <h1 className="text-xl font-bold">{session.user?.name}</h1>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full mt-1 inline-block">{roleLabel}</span>
            </div>
            <form action={async () => {
              "use server";
              const { logoutAction } = await import("@/app/login/actions");
              await logoutAction();
            }}>
              <button type="submit" className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors">
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card text-center">
            <p className="text-sm text-[var(--color-text-muted)]">Today&apos;s Sales</p>
            <p className="text-2xl font-bold text-[var(--color-primary)]">
              ${(todaySales._sum.salePrice || 0).toLocaleString()}
            </p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-[var(--color-text-muted)]">Commission Today</p>
            <p className="text-2xl font-bold text-[var(--color-secondary)]">
              ${(todaySales._sum.commission || 0).toLocaleString()}
            </p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-[var(--color-text-muted)]">Sales Count</p>
            <p className="text-2xl font-bold">{todaySales._count}</p>
          </div>
        </div>

        {/* Active Show Banner */}
        {activeShow ? (
          <div className="card border-l-4 border-[var(--color-primary)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[var(--color-primary)] uppercase tracking-wide mb-0.5">Active Show</p>
                <h2 className="text-lg font-bold">{activeShow.name}</h2>
                <p className="text-sm text-[var(--color-text-muted)]">{activeShow.location}</p>
              </div>
              <Link
                href="/sale"
                className="px-5 py-2.5 bg-[var(--color-primary)] text-white font-semibold rounded-lg hover:bg-[var(--color-primary-light)] transition-colors"
              >
                Open POS
              </Link>
            </div>
          </div>
        ) : (
          <div className="card border-l-4 border-[var(--color-warning)]">
            <p className="text-sm text-[var(--color-text-muted)]">No active show assigned. Check your calendar for upcoming shows.</p>
            <Link href="/shows" className="text-sm text-[var(--color-primary)] font-medium mt-1 inline-block">
              View Shows →
            </Link>
          </div>
        )}

        {/* Quick Nav */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { href: "/sale", label: "Record Sale", icon: "💰", color: "bg-[var(--color-primary)]" },
            { href: "/shows", label: "Shows", icon: "📅", color: "bg-[var(--color-secondary)]" },
            { href: "/leaderboard", label: "Leaderboard", icon: "🏆", color: "bg-[var(--color-accent)]" },
            { href: "/travel", label: "My Travel", icon: "✈️", color: "bg-blue-600" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${item.color} text-white rounded-xl p-4 text-center hover:opacity-90 transition-opacity`}
            >
              <div className="text-2xl mb-1">{item.icon}</div>
              <p className="text-sm font-semibold">{item.label}</p>
            </Link>
          ))}
        </div>

        {/* Admin-only links */}
        {userRole === "ADMIN" && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--color-text)]">Admin</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { href: "/admin/users", label: "Users" },
                { href: "/admin/inventory", label: "Inventory" },
                { href: "/admin/equipment", label: "Equipment" },
                { href: "/admin/grocery", label: "Grocery" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="card text-center hover:border-[var(--color-primary)] transition-colors"
                >
                  <p className="font-semibold text-[var(--color-text)]">{item.label}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Sales */}
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text)] mb-3">Recent Sales</h2>
          {recentSales.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-[var(--color-text-muted)]">No sales recorded yet. Head to the POS to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentSales.map((sale) => (
                <div key={sale.id} className="card flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{sale.productLevel.replace("LEVEL_", "")} — {sale.productModel}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{sale.show?.name} · {sale.productStyle}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[var(--color-primary)]">${sale.salePrice}</p>
                    <p className="text-xs text-[var(--color-secondary)]">+${sale.commission} commission</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
