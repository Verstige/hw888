// Commission calculation utilities
// Employees: 30% on their own sales
// Managers: 30% on their own sales + 3% bonus on TEAM total at shows they attend
//   (includes the manager's own sales in the team total per Julylan's direction)

import { prisma } from "@/lib/prisma";

export const DEFAULT_BASE_RATE = 0.30;
export const DEFAULT_MANAGER_BONUS = 0.03;

export type CommissionRateRecord = {
  id: string;
  userId: string;
  baseRate: number;
  managerBonus: number;
  effectiveFrom: Date;
  notes: string | null;
};

/**
 * Get the active commission rate for a user.
 * Falls back to defaults if no CommissionRate record exists.
 */
export async function getCommissionRate(userId: string): Promise<{ baseRate: number; managerBonus: number }> {
  const record = await prisma.commissionRate.findUnique({
    where: { userId },
    select: { baseRate: true, managerBonus: true },
  });
  if (record) {
    return { baseRate: record.baseRate, managerBonus: record.managerBonus };
  }
  return { baseRate: DEFAULT_BASE_RATE, managerBonus: 0 };
}

/**
 * Compute the commission for a single sale.
 */
export function computeCommission(salePrice: number, baseRate: number): number {
  return Math.round(salePrice * baseRate * 100) / 100;
}

export type CommissionBreakdown = {
  personalSales: number;          // sum of own sale prices
  personalCommission: number;     // personal commission earned
  managerBonus: number;           // bonus from team total at attended shows
  teamSales: number;              // total team sales at attended shows (counted toward bonus)
  showBonuses: Array<{
    showId: string;
    showName: string;
    teamTotal: number;
    bonus: number;
    bonusRate: number;
  }>;
  total: number;                   // personalCommission + managerBonus
  baseRate: number;
  managerBonusRate: number;
  salesCount: number;
};

/**
 * Compute a user's full commission breakdown.
 * For employees: just personal.
 * For managers: personal + 3% (configurable) on team total at shows they attended.
 *   - "attended" = assigned to the show OR is the show's manager
 *   - Team total = sum of sales at that show by ALL users (manager's own sales included)
 */
export async function computeUserCommission(userId: string, role: "ADMIN" | "MANAGER" | "EMPLOYEE"): Promise<CommissionBreakdown> {
  const rate = await getCommissionRate(userId);
  const isManager = role === "MANAGER" || role === "ADMIN";

  // Personal sales (own sales)
  const personalAgg = await prisma.sale.aggregate({
    where: { userId },
    _sum: { salePrice: true, commission: true },
    _count: true,
  });
  const personalSales = personalAgg._sum.salePrice || 0;
  const personalCommission = personalAgg._sum.commission || 0;
  const salesCount = personalAgg._count || 0;

  let managerBonus = 0;
  let teamSales = 0;
  const showBonuses: CommissionBreakdown["showBonuses"] = [];

  if (isManager && rate.managerBonus > 0) {
    // Find shows this manager attended (assigned to OR managed)
    const [assignments, managedShows] = await Promise.all([
      prisma.showAssignment.findMany({
        where: { userId },
        select: { showId: true },
      }),
      prisma.show.findMany({
        where: { managerId: userId },
        select: { id: true },
      }),
    ]);
    const showIds = Array.from(new Set([
      ...assignments.map((a) => a.showId),
      ...managedShows.map((s) => s.id),
    ]));

    if (showIds.length > 0) {
      // For each show, compute team total sales + bonus
      const showsData = await prisma.show.findMany({
        where: { id: { in: showIds } },
        select: {
          id: true,
          name: true,
          sales: { select: { salePrice: true } },
        },
      });

      for (const show of showsData) {
        const teamTotal = show.sales.reduce((sum, s) => sum + s.salePrice, 0);
        const bonus = Math.round(teamTotal * rate.managerBonus * 100) / 100;
        if (teamTotal > 0) {
          showBonuses.push({
            showId: show.id,
            showName: show.name,
            teamTotal: Math.round(teamTotal * 100) / 100,
            bonus,
            bonusRate: rate.managerBonus,
          });
        }
        managerBonus += bonus;
        teamSales += teamTotal;
      }
    }
  }

  return {
    personalSales,
    personalCommission,
    managerBonus: Math.round(managerBonus * 100) / 100,
    teamSales: Math.round(teamSales * 100) / 100,
    showBonuses: showBonuses.sort((a, b) => b.bonus - a.bonus),
    total: Math.round((personalCommission + managerBonus) * 100) / 100,
    baseRate: rate.baseRate,
    managerBonusRate: rate.managerBonus,
    salesCount,
  };
}
