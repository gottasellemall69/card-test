import { loadEnvConfig } from '@next/env';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fetchCardData, getSetCatalogue } from '../lib/server/cardApi';
loadEnvConfig(process.cwd());
async function main() {
  const folder = path.join(process.cwd(), 'public/card-data/Yugioh');
  const cards = await fetchCardData({ fresh: true });
  const sets = await getSetCatalogue({ includeInactive: true });
  await fs.mkdir(folder, { recursive: true });
  for (const [filename, data] of [
    ['card_data.json', { data: cards }],
    ['card_sets.json', sets],
  ] as const) {
    const target = path.join(folder, filename);
    await fs.writeFile(`${target}.tmp`, JSON.stringify(data));
    await fs.rename(`${target}.tmp`, target);
  }
  console.log(
    `Saved ${cards.length} card metadata records and ${sets.length} sets. Pricing remains sourced from TCGPlayer.`,
  );
}
void main().catch(() => {
  console.error('Card cache refresh failed. Check provider availability.');
  process.exitCode = 1;
});
