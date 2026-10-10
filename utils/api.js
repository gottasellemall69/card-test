import { requestJson } from '@/lib/client/request';

// Browser-safe functions. Provider hosts and credentials remain on the server.
export const getSetNameIdMap = () => requestJson('/api/Yugioh/setNameIdMap');
export const getSetCatalogue = () => requestJson('/api/Yugioh/set-catalogue');
export async function getCardData(setName) {
  const map = await getSetNameIdMap();
  const id = map[setName];
  if (!id) throw new Error('Set name not found in mapping');
  return requestJson(`/api/Yugioh/cards/${encodeURIComponent(id)}`);
}
export async function getCardSetsData() {
  return Object.fromEntries(
    Object.entries(await getSetNameIdMap()).map(([name, id]) => [id, name]),
  );
}
export const updateCardPrices = () =>
  requestJson('/api/Yugioh/updateCardPrices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
export const fetchCardData = () => requestJson('/api/Yugioh/catalogue');
