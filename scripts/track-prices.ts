import { loadEnvConfig } from '@next/env';
import { closeDatabase } from '../lib/server/database';
import { runPriceTracking } from '../lib/server/priceTracker';

loadEnvConfig(process.cwd());
async function main() {
  try {
    const result = await runPriceTracking({
      start: true,
      restart: process.argv.includes('--restart'),
      maxDurationMs: 0,
    });
    console.log(JSON.stringify(result, null, 2));
    if (result.status !== 'complete') process.exitCode = 1;
  } catch {
    console.error('Price tracking failed. Check configuration and provider availability.');
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
}
void main();
