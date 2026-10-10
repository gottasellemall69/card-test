import { parsePrice } from './prices';

type Point = { date: unknown; price: unknown };
export function mergeDailyPrices(points: Point[]) {
  const days = new Map<string, { date: string; price: number }>();
  for (const point of points) {
    const price = parsePrice(point.price);
    if (price === null || !point.date) continue;
    const date = new Date(point.date as string | Date);
    if (Number.isNaN(date.getTime())) continue;
    const timestamp = date.toISOString();
    const day = timestamp.slice(0, 10);
    if (!days.has(day) || days.get(day)!.date <= timestamp)
      days.set(day, { date: timestamp, price });
  }
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
}

// Values apply today's holdings to observed prices. Never fill dates before a card's first observation.
export function collectionValues(
  cards: { quantity: number; history: ReturnType<typeof mergeDailyPrices> }[],
) {
  const dates = [
    ...new Set(cards.flatMap((card) => card.history.map((point) => point.date.slice(0, 10)))),
  ].sort();
  const totals = new Map(dates.map((date) => [date, 0]));
  for (const card of cards) {
    if (!Number.isFinite(card.quantity) || card.quantity <= 0) continue;
    const prices = new Map(card.history.map((point) => [point.date.slice(0, 10), point.price]));
    let lastPrice: number | null = null;
    for (const date of dates) {
      if (prices.has(date)) lastPrice = prices.get(date)!;
      if (lastPrice !== null) totals.set(date, totals.get(date)! + lastPrice * card.quantity);
    }
  }
  return dates.map((date) => ({ date, value: totals.get(date)! }));
}
