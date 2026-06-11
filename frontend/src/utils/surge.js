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
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hours ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}

export const HOST_CITY_TIMEZONES = {
  Atlanta: "America/New_York",
  Boston: "America/New_York",
  Dallas: "America/Chicago",
  Guadalajara: "America/Mexico_City",
  Houston: "America/Chicago",
  "Kansas City": "America/Chicago",
  "Los Angeles": "America/Los_Angeles",
  "Mexico City": "America/Mexico_City",
  Miami: "America/New_York",
  Monterrey: "America/Monterrey",
  "New York/New Jersey": "America/New_York",
  Philadelphia: "America/New_York",
  "San Francisco Bay Area": "America/Los_Angeles",
  Seattle: "America/Los_Angeles",
  Toronto: "America/Toronto",
  Vancouver: "America/Vancouver",
};

export function hostTimeZone(city) {
  return HOST_CITY_TIMEZONES[city] || "UTC";
}

export function formatHostDate(date, city, options = {}) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: options.weekday === undefined ? undefined : options.weekday || "short",
    month: options.month || "short",
    day: options.day || "numeric",
    timeZone: hostTimeZone(city),
  }).format(new Date(date));
}

export function formatHostTime(date, city) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
    timeZone: hostTimeZone(city),
  }).format(new Date(date));
}

export const BUSINESS_TYPES = [
  { id: "restaurant", label: "Restaurant" },
  { id: "bar", label: "Bar & Brewery" },
  { id: "hotel", label: "Hotel" },
  { id: "retail", label: "Retail" },
  { id: "cafe", label: "Cafe" },
];
