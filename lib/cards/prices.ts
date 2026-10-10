export const normalizeText = (value: unknown) =>
  String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
export const normalizeToken = (value: unknown) => normalizeText(value).replace(/[^a-z0-9]+/g, '');
export const normalizeEditionKey = (value: unknown) => {
  const text = normalizeText(value);
  if (!text || text === 'unknown edition') return '';
  if (/\bunlimited\b/.test(text)) return 'unlimited';
  if (/\b1st\b|\bfirst\b/.test(text)) return '1st';
  if (/\blimited\b/.test(text)) return 'limited';
  return normalizeToken(text.replace(/\bedition\b/g, ''));
};
export const normalizeRarityKey = (value: unknown) => {
  const token = normalizeToken(value);
  return token === 'commonshortprint' ? 'common' : token;
};
export const normalizeConditionKey = (value: unknown) => {
  const text = normalizeText(value)
    .replace(/\bunknown\s+edition\b/g, '')
    .replace(/\b(?:1st|first|limited|unlimited)(?:\s+edition)?\b/g, '');
  const token = normalizeToken(text);
  return (
    (
      {
        nm: 'nearmint',
        lp: 'lightlyplayed',
        mp: 'moderatelyplayed',
        hp: 'heavilyplayed',
        dmg: 'damaged',
      } as Record<string, string>
    )[token] || token
  );
};
export function parsePrice(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  const text = String(value).replace(/[$,\s]/g, '');
  if (!/^\d+(?:\.\d+)?$/.test(text)) return null;
  const price = Number(text);
  return Number.isFinite(price) && price >= 0 ? price : null;
}
export type PriceIdentity = {
  setName?: unknown;
  number?: unknown;
  rarity?: unknown;
  edition?: unknown;
  condition?: unknown;
};
export function historyIdentity(input: PriceIdentity) {
  return {
    setNameKey: normalizeText(input.setName),
    numberKey: normalizeToken(input.number),
    rarityKey: normalizeRarityKey(input.rarity),
    editionKey: normalizeEditionKey(input.edition),
    conditionKey: normalizeConditionKey(input.condition || 'Near Mint'),
  };
}
