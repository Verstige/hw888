// HW888 — Product Catalog & Pricing Constants

export const PRODUCT_LEVELS = {
  LEVEL_1X: { label: "1X", retail: 200, commission: 60 },
  LEVEL_2X: { label: "2X", retail: 300, commission: 90 },
  LEVEL_3X: { label: "3X", retail: 400, commission: 120 },
  LEVEL_6X: { label: "6X", retail: 600, commission: 180 },
} as const;

export type ProductLevel = keyof typeof PRODUCT_LEVELS;

export const PRODUCT_MODELS: Record<ProductLevel, string[]> = {
  LEVEL_1X: ["Rolex", "Classic Small", "Classic Large", "XOXO", "Butterfly"],
  LEVEL_2X: ["Classic"],
  LEVEL_3X: ["Classic Large", "Classic Slim"],
  LEVEL_6X: ["Classic Large", "Classic Slim"],
};

export const PRODUCT_STYLES = [
  "Black",
  "Silver",
  "Gold",
  "Copper",
  "Silver/Gold",
  "Rose Gold/Silver",
  "Black/Silver",
] as const;

export type ProductStyle = (typeof PRODUCT_STYLES)[number];

// Men's Bracelet product names from holisticworldus.com
export const MENS_PRODUCTS = [
  // 6X
  "Thick Design 6X Black HW",
  "Thick Design 6X Silver HW",
  "Thick Design 6X Silver Gold HW",
  "Thick Design 6X Silver Black HW",
  "Thick Design 6X Gold HW",
  "Thick Design 6X Black Gold HW",
  // 3X
  "Thick Design 3X Black HW",
  "Thick Design 3X Silver HW",
  "Thick Design 3X Silver Gold HW",
  "Thick Design 3X Black Gold HW",
  "Thick Design 3X Silver Black HW",
  "Thick Design 3X Gold HW",
  "Copper Thick Design 3X HW",
  // 2X
  "Plain Color 2X Design Black Matte HW",
  "Plain Color Shine 2X Design Silver HW",
  "Plain Color 2X Bracelet Gold HW",
] as const;

// Women's Bracelet product names from holisticworldus.com
export const WOMENS_PRODUCTS = [
  // XOXO
  "XoXo Ladies Single Gold Silver HW",
  "XoXo Ladies Single Rose Gold and Silver HW",
  "XoXo Ladies Single Gold HW",
  "XoXo Design Silver HW",
  "XoXo Ladies Single Black HW",
  "XoXo Design Rose Gold HW",
  // Ladies Single
  "Ladies Single Silver HW",
  "Ladies Single Black Gold HW",
  "Ladies Single Silver Gold HW",
  "Ladies Single Black HW",
  "Ladies Single Gold HW",
  "Ladies Single Silver Rose Gold HW",
  // Butterfly
  "Butterfly Silver Rose Gold HW",
  "Butterfly Silver HW",
  "Butterfly Silver Gold HW",
] as const;

export const ALL_PRODUCTS = [...MENS_PRODUCTS, ...WOMENS_PRODUCTS] as const;

export function calculateCommission(salePrice: number): number {
  return Math.round(salePrice * 0.3 * 100) / 100;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}
