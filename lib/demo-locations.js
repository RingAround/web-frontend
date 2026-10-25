// Sample saved locations for the demo. Once sign-in and saved locations are
// wired up (plan phase B), these come from /api/locations instead.
export const DEMO_LOCATIONS = [
  {
    id: "loc_pine",
    label: "Pine St Apartments",
    address: "1220 Pine St, Seattle, WA 98101",
    timeZone: "America/Los_Angeles",
    isDefault: true,
  },
  {
    id: "loc_office",
    label: "Eastside office",
    address: "88 Harbor Way, Suite 210, Bellevue, WA 98004",
    timeZone: "America/Los_Angeles",
    isDefault: false,
  },
  {
    id: "loc_mom",
    label: "Mom’s house",
    address: "14 Maple Ct, Bellevue, WA 98008",
    timeZone: "America/Los_Angeles",
    isDefault: false,
  },
  {
    id: "loc_boise",
    label: "Boise rental",
    address: "512 W Elm St, Boise, ID 83702",
    timeZone: "America/Boise",
    isDefault: false,
  },
];

export const DEFAULT_LOCATION_ID = DEMO_LOCATIONS.find((l) => l.isDefault).id;
