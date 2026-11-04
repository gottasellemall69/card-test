import { getDatabase } from './database';
import {
  PRICE_SERIES_COLLECTION,
  type PriceHistoryPoint,
  type PriceSeriesDocument,
} from './snapshots';
import {
  normalizeEditionKey,
  normalizeRarityKey,
  normalizeToken,
  parsePrice,
} from '@/lib/cards/prices';

type CardSetEntry = Record<string, unknown>;
type CardWithSets = Record<string, unknown> & { card_sets?: CardSetEntry[] };

const baseKey = (set: CardSetEntry) =>
  `${normalizeToken(set.set_code)}|${normalizeRarityKey(set.set_rarity)}`;

const editionLabel = (key: string) =>
  (
    {
      '1st': '1st Edition',
      limited: 'Limited Edition',
      unlimited: 'Unlimited',
    } as Record<string, string>
  )[key] || key;

const latestPoint = (points: PriceHistoryPoint[]) =>
  points.reduce<PriceHistoryPoint | null>((latest, point) => {
    const date = new Date(point?.d);
    const price = Number(point?.p);
    if (Number.isNaN(date.getTime()) || !Number.isFinite(price)) return latest;
    return !latest || new Date(latest.d) < date ? { d: date, p: price } : latest;
  }, null);

const editionOrder = (key: string) =>
  ({ '1st': 0, limited: 1, unlimited: 2 } as Record<string, number>)[key] ?? 3;

export async function enrichCardSetsWithTrackedVariants<T extends CardWithSets>(
  card: T,
): Promise<T> {
  if (!Array.isArray(card.card_sets) || card.card_sets.length === 0) return card;

  const groups = new Map<
    string,
    {
      template: CardSetEntry;
      originals: CardSetEntry[];
      variants: Map<string, { set: CardSetEntry; priority: number }>;
      numberKey: string;
      rarityKey: string;
    }
  >();

  for (const set of card.card_sets) {
    const numberKey = normalizeToken(set.set_code);
    const rarityKey = normalizeRarityKey(set.set_rarity);
    const key = baseKey(set);
    const group = groups.get(key) || {
      template: set,
      originals: [] as CardSetEntry[],
      variants: new Map<string, { set: CardSetEntry; priority: number }>(),
      numberKey,
      rarityKey,
    };
    group.originals.push(set);
    const existingEdition = normalizeEditionKey(set.set_edition);
    if (existingEdition) {
      // Explicit variants supplied by the live pricing endpoint must win over
      // retained history, which is only used to discover missing printings.
      group.variants.set(existingEdition, { set, priority: 4 });
    }
    groups.set(key, group);
  }

  const filters = Array.from(groups.values())
    .filter((group) => group.numberKey)
    .map((group) => ({
      numberKey: group.numberKey,
      ...(group.rarityKey ? { rarityKey: group.rarityKey } : {}),
    }));
  if (filters.length === 0) return card;

  let tracked: Pick<
    PriceSeriesDocument,
    'numberKey' | 'rarityKey' | 'editionKey' | 'conditionKey' | 'points'
  >[];
  try {
    const db = await getDatabase();
    tracked = await db
      .collection<PriceSeriesDocument>(PRICE_SERIES_COLLECTION)
      .find(
        { $or: filters },
        {
          projection: {
            numberKey: 1,
            rarityKey: 1,
            editionKey: 1,
            conditionKey: 1,
            points: 1,
            _id: 0,
          },
        },
      )
      .toArray();
  } catch {
    return card;
  }

  for (const series of tracked) {
    const group = groups.get(`${series.numberKey}|${series.rarityKey}`);
    if (!group || !series.editionKey) continue;
    const point = latestPoint(series.points || []);
    if (!point) continue;
    const priority = series.conditionKey === 'nearmint' ? 3 : 2;
    const current = group.variants.get(series.editionKey);
    if (current && current.priority > priority) continue;
    group.variants.set(series.editionKey, {
      priority,
      set: {
        ...group.template,
        set_edition: editionLabel(series.editionKey),
        set_price: point.p.toFixed(2),
      },
    });
  }

  const expanded = Array.from(groups.values()).flatMap((group) => {
    if (group.variants.size === 0) return group.originals;
    return Array.from(group.variants.entries())
      .sort(([left], [right]) => editionOrder(left) - editionOrder(right))
      .map(([, variant]) => {
        const price = parsePrice(variant.set.set_price);
        return {
          ...variant.set,
          set_price: price === null ? variant.set.set_price : price.toFixed(2),
        };
      });
  });

  return { ...card, card_sets: expanded };
}
