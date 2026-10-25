# Deployment

The site runs on Cloudflare Workers at https://ringaround.me, built with [OpenNext for Cloudflare](https://opennext.js.org/cloudflare). `.github/workflows/deploy.yml` deploys it:

- **Push to `main`** deploys production (Worker `ringaround`, custom domain `ringaround.me`).
- **Open or update a PR** deploys a preview Worker `ringaround-preview-pr-<number>` on workers.dev and comments the URL on the PR.
- **Close or merge the PR** deletes that preview.

Worker names, the custom domain, and the R2 cache buckets are configured in `wrangler.jsonc`.

## One-time CI setup

Everything lives on the `prod` GitHub Environment (Settings → Environments → prod):

| Name | Kind | Purpose |
| --- | --- | --- |
| `CF_API_TOKEN` | secret | Cloudflare API token with Workers Scripts edit and Workers R2 Storage edit on the account, plus Workers Routes edit and DNS edit on the `ringaround.me` zone (for the custom domain) |
| `CF_ACCOUNT_ID` | variable | Cloudflare account ID |
| `CF_S3_ACCESS_KEY_ID` | variable | R2 S3 API access key, used to upload the incremental cache |
| `CF_S3_SECRET_ACCESS_KEY` | secret | Its secret key |
| `AUTH_SECRET` | secret | Session encryption key, from `openssl rand -base64 32`. Keep it stable: changing it signs everyone out |
| `GOOGLE_AUTH_ID` | variable | Google OAuth client ID |
| `GOOGLE_AUTH_SECRET` | secret | Google OAuth client secret |

When `AUTH_SECRET`, `GOOGLE_AUTH_ID` and `GOOGLE_AUTH_SECRET` are all set, each production deploy uploads them to the Worker as `AUTH_SECRET`, `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`, the names `auth.js` reads.

The `ringaround.me` zone must be in the same Cloudflare account. The workflow creates the R2 buckets `ringaround-opennext-cache` and `ringaround-preview-opennext-cache` on first deploy if they don't exist yet.

### Google sign-in in production

`AUTH_URL` is set to `https://ringaround.me` in `wrangler.jsonc`. The three credentials can either go on the `prod` environment (above) or straight onto the Worker under the names `auth.js` reads:

```sh
npx wrangler secret put AUTH_SECRET
npx wrangler secret put AUTH_GOOGLE_ID
npx wrangler secret put AUTH_GOOGLE_SECRET
```

In Google Cloud Console, add `https://ringaround.me` as an authorized JavaScript origin and `https://ringaround.me/api/auth/callback/google` as a redirect URI. Previews have no OAuth credentials, so sign-in shows as unavailable there.

## Running the Workers build locally

```sh
npm run preview   # opennextjs-cloudflare build, then serve it in workerd
npm run deploy    # build and deploy production from your machine (needs `wrangler login`)
```

`npm run dev` is still plain `next dev`.

## Cache Components are off

`cacheComponents` (and `partialPrefetching`, which depends on it) are disabled in `next.config.mjs`. With them on, every page hangs in the Workers runtime under OpenNext 1.20 and returns a 500. Nothing in the app uses `"use cache"` yet. Before turning them back on, run `npm run preview` and confirm that pages load.
