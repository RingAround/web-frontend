// Locations saved from the request form, kept in this browser until accounts
// have a server-side store.
const LOCATIONS_KEY = "ringaround:locations:v1";

export function readLocations() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(LOCATIONS_KEY) ?? "[]");
    if (!Array.isArray(saved)) return [];
    return saved.filter(
      (l) => l && typeof l.id === "string" && typeof l.label === "string" && typeof l.address === "string",
    );
  } catch {
    return [];
  }
}

export function writeLocations(locations) {
  try {
    window.localStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations));
  } catch {
    // Storage blocked: the address is used for this request only.
  }
}

// Saves an address the first time it's used; the first saved location becomes
// the default. Returns the updated list, the saved (or matching) location, and
// whether it was newly added.
export function addLocation(locations, { label, address, timeZone }) {
  const existing = locations.find((l) => l.address.toLowerCase() === address.toLowerCase());
  if (existing) return { locations, location: existing, added: false };
  const location = {
    id: `loc_${Date.now().toString(36)}`,
    label: label || address.split(",")[0].trim(),
    address,
    timeZone,
    isDefault: locations.length === 0,
  };
  return { locations: [...locations, location], location, added: true };
}
