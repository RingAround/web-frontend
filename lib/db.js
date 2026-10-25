import { getCloudflareContext } from "@opennextjs/cloudflare";

// Server-only: the D1 database bound as `DB` in wrangler.jsonc. Every query
// here is scoped to the user ID the caller got from the session; nothing takes
// a user ID from the browser.

function db() {
  return getCloudflareContext().env.DB;
}

// --- Profile -----------------------------------------------------------------

export async function getProfile(userId) {
  const row = await db()
    .prepare("SELECT name, phone, company, default_address FROM profiles WHERE user_id = ?")
    .bind(userId)
    .first();
  return row ? { name: row.name, phone: row.phone, company: row.company, defaultAddress: row.default_address } : null;
}

export async function saveProfile(userId, profile) {
  await db()
    .prepare(
      `INSERT INTO profiles (user_id, name, phone, company, default_address) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (user_id) DO UPDATE SET name = excluded.name, phone = excluded.phone, company = excluded.company,
         default_address = excluded.default_address, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
    )
    .bind(userId, profile.name, profile.phone, profile.company, profile.defaultAddress)
    .run();
}

// --- Saved locations ---------------------------------------------------------

const toLocation = (row) => ({ id: row.id, label: row.label, address: row.address, timeZone: row.time_zone ?? undefined, isDefault: false });

export async function listLocations(userId) {
  const { results } = await db()
    .prepare("SELECT id, label, address, time_zone FROM saved_locations WHERE user_id = ? ORDER BY created_at")
    .bind(userId)
    .all();
  return results.map(toLocation);
}

// Saves an address the first time it's used; an address the user already has
// (ignoring case) comes back as the existing row.
export async function addLocation(userId, { label, address, timeZone }) {
  const id = `loc_${crypto.randomUUID().replaceAll("-", "")}`;
  await db()
    .prepare(
      `INSERT INTO saved_locations (id, user_id, label, address, time_zone) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT DO NOTHING`,
    )
    .bind(id, userId, label, address, timeZone ?? null)
    .run();
  const row = await db()
    .prepare("SELECT id, label, address, time_zone FROM saved_locations WHERE user_id = ? AND address = ? COLLATE NOCASE")
    .bind(userId, address)
    .first();
  return toLocation(row);
}

// --- Account application -----------------------------------------------------

export async function getApplication(userId) {
  const row = await db()
    .prepare("SELECT name, email, company, role, plan, submitted_at FROM account_applications WHERE user_id = ?")
    .bind(userId)
    .first();
  return row
    ? { name: row.name, email: row.email, company: row.company, role: row.role, plan: row.plan, submittedAt: row.submitted_at }
    : null;
}

export async function saveApplication(userId, application) {
  await db()
    .prepare(
      `INSERT INTO account_applications (user_id, name, email, company, role, plan) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (user_id) DO UPDATE SET name = excluded.name, email = excluded.email, company = excluded.company,
         role = excluded.role, plan = excluded.plan, submitted_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
    )
    .bind(userId, application.name, application.email, application.company, application.role, application.plan)
    .run();
}

// --- Requests ----------------------------------------------------------------

export async function recordRequest(userId, { sessionId, title }) {
  await db()
    .prepare("INSERT INTO requests (session_id, user_id, title) VALUES (?, ?, ?) ON CONFLICT (session_id) DO NOTHING")
    .bind(sessionId, userId, title)
    .run();
}

export async function listRequests(userId, limit) {
  const { results } = await db()
    .prepare("SELECT session_id, title, created_at FROM requests WHERE user_id = ? ORDER BY created_at DESC LIMIT ?")
    .bind(userId, limit)
    .all();
  return results.map((row) => ({ sessionId: row.session_id, title: row.title, createdAt: row.created_at }));
}

export async function ownsRequest(userId, sessionId) {
  const row = await db()
    .prepare("SELECT 1 AS owned FROM requests WHERE user_id = ? AND session_id = ?")
    .bind(userId, sessionId)
    .first();
  return Boolean(row);
}
