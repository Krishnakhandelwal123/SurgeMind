export function surgeColor(score) {
  if (score >= 9) return "surge-critical";
  if (score >= 7) return "surge-high";
  if (score >= 4) return "surge-mid";
  return "surge-low";
}

export function surgeHex(score) {
  if (score >= 9) return "#F43F5E";
  if (score >= 7) return "#F97316";
  if (score >= 4) return "#F59E0B";
  return "#22C55E";
}

export function alertTypeBadge(type) {
  const map = {
    STOCK_UP: "badge-stock",
    HIRE_STAFF: "badge-hire",
    MENU_TRANSLATE: "badge-menu",
    PRICE_ADJUST: "badge-price",
    HOURS_EXTEND: "badge-purple",
  };
  return map[type] || "badge-purple";
}

export function formatTimeAgo(date) {
  const d = new Date(date);
  const diff = Date.now() - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hours ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}

export const BUSINESS_TYPES = [
  { id: "restaurant", label: "Restaurant", icon: "🍕" },
  { id: "bar", label: "Bar & Brewery", icon: "🍺" },
  { id: "hotel", label: "Hotel", icon: "🏨" },
  { id: "retail", label: "Retail", icon: "🛍️" },
  { id: "cafe", label: "Cafe", icon: "☕" },
];
