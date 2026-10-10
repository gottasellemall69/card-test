import {
  normalizeText,
  normalizeToken,
  normalizeEditionKey,
  normalizeRarityKey,
  normalizeConditionKey,
  parsePrice,
} from './prices';
type CardRow = Record<string, unknown>;
const loose = (value: unknown) =>
  normalizeText(value)
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
const textMatches = (a: unknown, b: unknown) => {
  const left = loose(a),
    right = loose(b);
  return !!left && !!right && (left === right || left.includes(right) || right.includes(left));
};
export function findBestPriceRow(rows: CardRow[], card: CardRow) {
  let best: { row: CardRow; price: number; score: number } | null = null;
  for (const row of rows) {
    const price = parsePrice(row.marketPrice);
    if (
      price === null ||
      !normalizeToken(card.number) ||
      normalizeToken(row.number) !== normalizeToken(card.number)
    )
      continue;
    if (!textMatches(row.productName, card.productName)) continue;
    if (row.set && card.setName && !textMatches(row.set, card.setName)) continue;
    const rarity = normalizeRarityKey(card.rarity),
      edition = normalizeEditionKey(card.printing),
      condition = normalizeConditionKey(card.condition || 'Near Mint');
    // An absent provider variant cannot be assumed to match a known collection variant.
    if (rarity && normalizeRarityKey(row.rarity) !== rarity) continue;
    if (edition && normalizeEditionKey(row.printing) !== edition) continue;
    if (condition && normalizeConditionKey(row.condition) !== condition) continue;
    const score =
      (loose(row.productName) === loose(card.productName) ? 40 : 24) +
      30 +
      (loose(row.set) === loose(card.setName) ? 15 : 0) +
      (normalizeRarityKey(row.rarity) === rarity ? 12 : 0) +
      (normalizeEditionKey(row.printing) === edition ? 8 : 0) +
      (normalizeConditionKey(row.condition) === condition ? 18 : 0);
    if (!best || score > best.score) best = { row, price, score };
  }
  return best;
}
