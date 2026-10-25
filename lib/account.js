// Browser storage for the account application made at checkout. Only contact
// details and the chosen plan are kept; payment details are never stored or
// sent anywhere.
export const ACCOUNT_KEY = "ringaround:account:v1";
export const REQUEST_DRAFT_KEY = "ringaround:request-draft:v1";
export const PENDING_REQUEST_KEY = "ringaround:pending-request";

export function readAccount() {
  try {
    const account = JSON.parse(window.localStorage.getItem(ACCOUNT_KEY) ?? "null");
    return account && typeof account.email === "string" && typeof account.plan === "string" ? account : null;
  } catch {
    return null;
  }
}

export function saveAccount(account) {
  try {
    window.localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
  } catch {
    // Storage blocked: the review page falls back to its generic message.
  }
}

export function hasRequestDraft() {
  try {
    return Boolean(window.sessionStorage.getItem(PENDING_REQUEST_KEY) || window.localStorage.getItem(REQUEST_DRAFT_KEY));
  } catch {
    return false;
  }
}

export function formatSubmittedDate(iso) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
