const fs = require('fs');
const path = require('path');

const DEFAULT_BASE_URL = 'http://localhost:3000';
const BASE_URL = (process.env.SPORTS_REFRESH_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
const SETS_PATH = path.join(__dirname, '..', 'constants', 'cardSets.ts');

const readCardSets = () => {
  const source = fs.readFileSync(SETS_PATH, 'utf8');
  const matches = source.match(/['"]([^'"]+)['"]/g) || [];
  return matches
    .map((match) => match.replace(/^['"]|['"]$/g, '').trim())
    .filter(Boolean);
};

const refreshCardSet = async (cardSet) => {
  const response = await fetch(`${BASE_URL}/api/Sports/sportsData`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cardSet }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed (${response.status}) ${text}`);
  }

  return response.json();
};

const run = async () => {
  if (!fs.existsSync(SETS_PATH)) {
    console.error(`Card set list not found at ${SETS_PATH}`);
    process.exit(1);
  }

  const sets = readCardSets();
  if (!sets.length) {
    console.error('No card sets found to refresh.');
    process.exit(1);
  }

  console.log(`Refreshing ${sets.length} sets using ${BASE_URL}...`);

  let successCount = 0;
  for (const cardSet of sets) {
    try {
      await refreshCardSet(cardSet);
      successCount += 1;
      console.log(`? ${cardSet}`);
    } catch (error) {
      console.error(`? ${cardSet}: ${error.message || error}`);
    }
  }

  console.log(`Done. ${successCount}/${sets.length} sets refreshed.`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
