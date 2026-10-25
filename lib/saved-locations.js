// Extra addresses saved from the request form, per signed-in user, kept in this
// browser until accounts have a server-side store. The profile address stays
// the default.
const LOCATIONS_KEY = "ringaround:locations:v1";

const storageKey = (userId) => (userId ? `${LOCATIONS_KEY}:${encodeURIComponent(userId)}` : LOCATIONS_KEY);

export function readLocations(userId) {
  try {
    const saved = JSON.parse(window.localStorage.getItem(storageKey(userId)) ?? "[]");
    if (!Array.isArray(saved)) return [];
    return saved.filter(
      (l) => l && typeof l.id === "string" && typeof l.label === "string" && typeof l.address === "string",
    );
  } catch {
    return [];
  }
}

export function writeLocations(userId, locations) {
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(locations));
  } catch {
    // Storage blocked: the address is used for this request only.
  }
}

// Saves an address the first time it's used. Returns the updated list, the
// saved (or matching) location, and whether it was newly added.
export function addLocation(locations, { label, address, timeZone }) {
  const existing = locations.find((l) => l.address.toLowerCase() === address.toLowerCase());
  if (existing) return { locations, location: existing, added: false };
  const location = {
    id: `loc_${Date.now().toString(36)}`,
    label: label || address.split(",")[0].trim(),
    address,
    timeZone,
    isDefault: false,
  };
  return { locations: [...locations, location], location, added: true };
}
