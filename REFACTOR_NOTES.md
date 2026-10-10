# Refactor and validation notes

Reviewed and implemented on 10 October 2026. The supplied source archive is the baseline; its original page markup and styling were retained wherever possible. The app remains on the supported Next.js Pages Router rather than introducing a second routing architecture.

## Feature parity

All 42 original page/API source paths remain. There are 47 now: two catalogue endpoints, a tracker status/on-demand endpoint, an authenticated cron endpoint and the tracker page were added. All 25 original API paths remain.

| Feature                                                                                  | Result                                                                                                                                                                    |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Landing page, account registration/login/logout, sidebar and mobile navigation           | Retained. Sessions are now checked independently by protected API routes.                                                                                                 |
| Freeform and comma-separated Yu-Gi-Oh list input, quantities, matching                   | Retained. Parsing is a shared pure module; matching validates printing, rarity and condition.                                                                             |
| Fuzzy search and condition selection                                                     | Retained. Failed/cancelled requests recover correctly; selected condition follows the detail link.                                                                        |
| Alphabetical set index, set search/filter/sort, grid/table and variant controls          | Retained. The conditional hook error in letter browsing was corrected.                                                                                                    |
| Card details, version selection, images, facts, collection additions and history         | Retained. History reads stored daily snapshots rather than relying on a first visit to start collection.                                                                  |
| Personal collection, quantities/prices, filtering/sorting, folders, selection and export | Retained. Ownership is enforced on reads and mutations. Unchanged updates return success; unknown or other users' cards return 404.                                       |
| Personal collection price refresh and resumable jobs                                     | Retained. Failed sets remain retryable, and exact condition/edition matching prevents using cheaper damaged printings.                                                    |
| Collection value chart                                                                   | Retained. Includes catalogue snapshots, preserves legacy observations and applies the current quantities.                                                                 |
| Deck builder, archetype suggestions and copy/size warnings                               | Retained. Pure reducer updates allow 40–60 main cards and 15 extra cards; Xyz classification and overlapping remove controls were fixed.                                  |
| Sports browser, all 21 set options, graded prices, local selections and CSV              | Retained. Selection hydration/storage is safe and cache refresh preserves complete cached data when upstream requests are incomplete.                                     |
| Original test page                                                                       | Retained behind session protection.                                                                                                                                       |
| CSV formats                                                                              | Yu-Gi-Oh remains pipe-separated; sports remains comma-separated. Both escape quotes and spreadsheet formulas and release download URLs.                                   |
| New daily tracking                                                                       | All active and inactive TCGPlayer catalogue sets, every returned product/printing/condition row, daily upserts, checkpoints, retries, locks and admin on-demand controls. |

## Main changes

- Replaced eager/per-request Mongo connections with a lazy shared connection. Server imports/builds no longer require a reachable database, and all routes respect `MONGODB_DATABASE` with the original `cardPriceApp` default.
- Stopped trusting the incoming `x-authenticated-user` header. API authentication verifies signed, expiring HS256 tokens, the expected issuer/audience and the existing database user. Cookies remain HttpOnly/Secure in production with SameSite restrictions.
- Added shared API method checks, scalar query/body validation, same-origin write checks, process-level request throttling and persistent login/registration limits. Query-string variations do not bypass persistent auth limits. Non-public errors and logs do not expose raw database/provider credentials.
- Restricted collection/folder operations to their owner, fixed the unauthenticated aggregation route and protected manual history from cross-user writes. Bulk card requests are validated entirely before any write. Negative/nonfinite prices, invalid quantities, Mongo operator objects and untrusted image hosts are rejected.
- Added nonce-based script CSP and response security headers. Pages are rendered per request so their script nonces match the response; the `_app.getInitialProps` static-optimization warning is an intentional consequence. Styles still permit inline styles for the existing Tailwind/styled-jsx and chart code.
- Separated server-side provider access from browser requests. TCGPlayer host configuration and any provider credentials remain on the server. Fetches have deadlines, pagination is checked for incomplete/repeated pages, caches are bounded and failed cache promises are discarded.
- Replaced the collection price updater's large duplicated matching/job logic with a server module and shared pure matching functions. Added a catalogue-wide tracker that operates independently of the collection and page traffic.
- Daily snapshots retain product identity, printing, rarity, condition, source, fetch timestamp and missing-price state. Daily reruns upsert instead of duplicating history. A timed-out worker can resume without inventing a price for an earlier day.
- Corrected a set-page server fetch that used a browser helper, and fixed set-link routing. Corrected hook ordering, dependencies, render-time ref access, updater side effects, async search cancellation, SSR/localStorage hydration and deck layout issues. Pure deck/history/input code is independently testable.
- Consolidated TypeScript/ESLint/PostCSS/Tailwind configuration, pinned dependencies and added a lockfile. Direct runtime dependencies were reduced from 41 to 17. Strict TypeScript checks apply to TypeScript code; retained JavaScript pages are checked with ESLint and production compilation.

## Validation

- `npm run lint`: passed, zero warnings.
- `npm run typecheck`: passed.
- `npm test`: 15 passing tests. These exercise a real disposable MongoDB server, not a mocked database: account and collection/folder CRUD, owner isolation, signed sessions, CSRF checks, row validation, first-visit-independent history, missing prices, daily upserts, legacy/manual privacy, job checkpoints/retries/concurrency, provider pagination, input parsing, deck limits and CSV safety.
- `npm run build`: production Turbopack build passed, with all original routes present.
- `npm run test:e2e`: all 7 browser tests passed in headless Chromium: bulk matching and CSV content, set browsing/grid/table and first-visit detail history/chart, registration/login/owned collection/logout, sports selection persistence/CSV, deck search/add/remove, fuzzy conditions/network recovery and mobile/protected navigation. No hydration or hook errors were observed.
- Live no-key provider check: the catalogue returned 679 sets, including 21 inactive sets. A bounded worker fetched the first set and saved all 31 returned price rows as 31 snapshot documents in a disposable local database. It correctly reported a partial catalogue sweep with 1/679 sets complete and zero failed sets. This was not presented as a completed production sweep.
- `npm audit --omit=dev`: zero reported production dependency vulnerabilities at validation time.

Full dependency auditing currently reports five high entries in the development-only ESLint glob dependency chain, originating from [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) in `braces` 3.0.3. The upstream advisory lists no patched release. The automatic suggested downgrade of the Next ESLint configuration was not applied because it does not provide a valid matching Next.js 16 configuration. Keep checking for an upstream patch; these dependencies are not included in the production dependency audit.

## Boundaries

The supplied MongoDB connection was not reachable from this execution environment. Its records, indexes and credentials were not modified; database tests and the live provider smoke test used isolated local databases. A full production catalogue sweep, production cron deployment and real SportsCardsPro authenticated refresh were not run.

The archive omitted the original public artwork/caches. Included SVG fallbacks keep the app usable, but exact original decorative imagery cannot be reproduced from missing files. Existing provider/browser access still controls sports-data availability. TCGPlayer public guide availability and published variant coverage control the prices available to the new tracker. Daily history grows from actual collection dates; no earlier price history is fabricated.

The supplied five-minute resume schedule needs hosting that supports frequent scheduled invocations. The README includes a full CLI worker and daily cron/Windows Task Scheduler setup for other environments. There is no hidden requirement for a TCGPlayer API key.
