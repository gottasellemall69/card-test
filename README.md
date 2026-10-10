# Card Price App

The original Pages Router app, refactored with React 19 and Next.js 16. The routes, collection tools, card matching, set views, deck builder, sports browser, charts and CSV formats are retained. The new catalogue tracker collects Yu-Gi-Oh prices independently of page visits.

## Run locally

Use Node.js 22 or newer and a reachable MongoDB instance. Extract the ZIP, then open a terminal in `card-test`.

```sh
npm ci
```

Keep your existing environment values in `.env.local` (Next.js also reads `.env`). Compare them with `.env.example`; your real secrets are intentionally excluded from this package. For a new installation, copy `.env.example` to `.env.local` (`copy .env.example .env.local` on Windows, `cp .env.example .env.local` on macOS/Linux).

Set `MONGODB_URI`, a random `JWT_SECRET` of at least 32 bytes, and `APP_URL`. Set `ADMIN_USERS` to your exact registered username to enable on-demand tracking. Generate a separate random `CRON_SECRET` for scheduled HTTP requests. This command generates a suitable secret; run it separately for each secret:

```sh
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

```sh
npm run db:setup
npm run dev
```

Open http://localhost:3000. Register an account and log in. Existing password hashes and collection records remain compatible; existing sessions require a fresh login because tokens now require an issuer, audience and expiry.

`db:setup` creates indexes without deleting records. If an existing database contains duplicate usernames/counter keys/cache keys, it reports an error so those conflicts can be resolved deliberately. Back up an existing database before running maintenance commands. Change `APP_URL` to the actual HTTPS origin in production. Only enable `TRUST_PROXY` behind an ingress that replaces untrusted forwarded IP headers.

For production:

```sh
npm run build
npm start
```

## TCGPlayer pricing without an API key

Pricing uses the original publicly responding TCGPlayer paths on the server:

- `https://mpapi.tcgplayer.com/v2/Catalog/SetNames?categoryId=2`
- `https://infinite-api.tcgplayer.com/priceguide/set/{setNameId}/cards/?rows=5000&offset={offset}`

These are public catalogue/price-guide endpoints, separate from the credentialed TCGPlayer developer API. No API key is required by this implementation. They are subject to TCGPlayer availability and changes; failures and rate limits are reported and retried without manufacturing prices. There is no scraping or credential workaround in the Yu-Gi-Oh tracker.

YGOPRODeck supplies names, images, descriptions, card types and set metadata. TCGPlayer is preferred for set/printing/condition prices. The original metadata price fallback remains for detail lookups when a matching TCGPlayer row is absent; those fallback values are never written as TCGPlayer daily snapshots.

## Track the whole catalogue

Run the initial sweep, or resume a previous incomplete sweep:

```sh
npm run prices:track
```

Recheck all sets on the same UTC day:

```sh
npm run prices:track -- --restart
```

Alternatively, open `/yugioh/price-tracker` while logged in as a username listed in `ADMIN_USERS`, then select **Track all prices now** or **Resume tracking**. The UI runs bounded requests until complete, or stops with saved progress when a provider error needs retrying.

The tracker requests all catalogue sets, including inactive sets, and saves every returned product/printing/condition row in `cardPriceSnapshots`. Product identity is retained even when multiple products share a printed number. Each product/variant has one snapshot per UTC day; rerunning updates that day's point. Set checkpoints, rate-limit backoff and a database lock prevent silently skipped failures and overlapping sweeps. Failed sets remain pending. Catalogue coverage and unavailable-price counts appear on the tracker page.

History exists before the first detail-page visit once the initial sweep has collected that printing. Detail visits only read history. Missing market prices are stored as `null`, rather than zero. The charts show observed dates; they do not append a fabricated current-day price. Existing legacy history is retained, and manual price points are restricted to their owner. Collection value history applies the current quantities to observed prices; it is not a historical record of purchases and sales.

Coverage is limited to cards and variants actually published in the TCGPlayer catalogue. Cards with no published price cannot have a priced observation, and current price guides cannot recover earlier historical prices. History starts when collection runs. A resumed job records the actual fetch date, never an earlier day. Ensure MongoDB has capacity for the full catalogue's daily rows; daily snapshots intentionally have no automatic expiry.

### Daily scheduling

`vercel.json` starts a daily sweep at 00:00 UTC and resumes pending sets every five minutes. Both requests require `Authorization: Bearer <CRON_SECRET>`, which Vercel supplies when `CRON_SECRET` is set in the production environment. The server validates that secret independently of browser sessions. Requests run for at most four minutes and checkpoint work so a large catalogue can span several invocations.

The included five-minute schedule requires a Vercel plan that permits frequent cron invocations. Hobby permits only daily invocations and is insufficient to finish a large catalogue within one bounded request. For Hobby, remove the `crons` section and schedule the full CLI worker on your own machine/server, or use an external scheduler to call the authenticated daily-start and resume endpoints. See [Vercel cron documentation](https://vercel.com/docs/cron-jobs/manage-cron-jobs).

For a server you control, schedule this daily with cron (replace the absolute project path; the environment file is loaded automatically):

```cron
0 0 * * * cd /absolute/path/card-test && /usr/bin/npm run prices:track >> /absolute/path/card-test-price-job.log 2>&1
```

This runs to completion without a serverless time limit. Optionally add a later retry using the same command; completed daily jobs return without refetching. On Windows, create a daily Task Scheduler task using `cmd.exe`, arguments `/c npm run prices:track`, and set **Start in** to your `card-test` folder. Set the task to avoid overlapping instances and retry after failures. Check the tracker page or job log for completeness. The schedules become active only when deployed/configured; building the ZIP does not start a live job on your database.

## Sports cards and optional assets

Sports cards retain their existing SportsCardsPro data source, 21 set options, server-side cache, graded prices, browser selections and CSV exports. Refresh requests with supplied provider cookies/headers require an administrator. Browser authentication headers/cookies are never forwarded from ordinary page requests.

For the original browser-based cache refresh utility, use your own authenticated browser profile and installed Chrome:

```sh
npm run refresh:sports-cache
```

Use `npm run refresh:sports-cache -- --help` for options. Sports access depends on the provider and your existing access; a TCGPlayer key is not involved.

The supplied archive contained no `public` artwork or card-cache files. Small SVG backgrounds and a card placeholder are included as functional fallbacks; the original decorative dragon/character/glow artwork cannot be reconstructed from the source archive. You can restore original assets under their original `public` paths. Metadata and card images can load from YGOPRODeck, and an optional metadata cache can be generated with:

```sh
npm run refresh:yugioh-cache
```

## Validation and layout of the code

```sh
npm run check
npm run build
npx playwright install chromium
npm run test:e2e
npm audit --omit=dev
```

The automated tests use disposable local MongoDB databases and synthetic card data, never the configured production database. The first test run may download a MongoDB binary. `MONGOMS_SYSTEM_BINARY` can point to an installed `mongod` when needed. Browser tests require a production build and Chromium; `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` can select an existing compatible Chromium executable.

- `lib/server`: database, session/authentication, request validation, provider access, price tracking and history.
- `lib/cards`: pure price matching, identity normalization, input parsing, deck state and history calculations.
- `lib/client`: same-origin JSON requests and CSV downloads.
- `pages/api`: existing route contracts plus the authenticated tracker/cron routes.
- `tests`: pricing/security/database tests and browser feature checks.

See `REFACTOR_NOTES.md` for the defects addressed, feature parity, validation results and remaining provider/deployment limits.
