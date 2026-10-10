import fs from 'node:fs/promises';
import path from 'node:path';
import { HttpError } from './errors';

type CardSet = { name: string; setNameId: number; [key: string]: unknown };
type CacheEntry = { expires: number; promise: Promise<unknown> };
const cache = new Map<string, CacheEntry>();

function cached<T>(key: string, ttl: number, load: () => Promise<T>): Promise<T> {
  const existing = cache.get(key);
  if (existing && existing.expires > Date.now()) return existing.promise as Promise<T>;
  const promise = load().catch((error: unknown) => {
    if (cache.get(key)?.promise === promise) cache.delete(key);
    throw error;
  });
  cache.set(key, { expires: Date.now() + ttl, promise });
  if (cache.size > 200) cache.delete(cache.keys().next().value!);
  return promise;
}

export function tcgHost(key: 'GET_CARD_SETS_API' | 'GET_CARD_DATA_API') {
  const fallback =
    key === 'GET_CARD_SETS_API' ? 'mpapi.tcgplayer.com' : 'infinite-api.tcgplayer.com';
  const host = process.env[key] || fallback;
  if (!/^[a-z\d.-]+$/i.test(host)) throw new HttpError(503, 'Invalid TCGPlayer host configuration');
  return `https://${host}`;
}

export async function fetchJson(url: string, options: RequestInit = {}) {
  let response: Response;
  try {
    response = await fetch(url, {
      redirect: 'error',
      ...options,
      signal: options.signal || AbortSignal.timeout(15000),
    });
  } catch {
    throw new HttpError(502, 'Card data provider is temporarily unavailable');
  }
  if (!response.ok) {
    if (response.status === 404 || response.status === 400) return null;
    throw new HttpError(
      response.status === 429 ? 429 : 502,
      'Card data provider is temporarily unavailable',
    );
  }
  try {
    return await response.json();
  } catch {
    throw new HttpError(502, 'Invalid card data response');
  }
}

export async function getSetCatalogue({ includeInactive = false, fresh = false } = {}): Promise<
  CardSet[]
> {
  if (fresh) cache.delete(`tcg:sets:${includeInactive}`);
  return cached(`tcg:sets:${includeInactive}`, 3600000, async () => {
    const payload = await fetchJson(
      `${tcgHost('GET_CARD_SETS_API')}/v2/Catalog/SetNames?categoryId=2${includeInactive ? '' : '&active=true'}`,
    );
    if (!Array.isArray(payload?.results) || payload.errors?.length) {
      throw new HttpError(502, 'TCGPlayer set catalogue is unavailable');
    }
    return payload.results.filter(
      (set: CardSet) => typeof set.name === 'string' && Number.isSafeInteger(set.setNameId),
    );
  });
}

export async function getSetNameIdMap(): Promise<Record<string, number>> {
  return Object.fromEntries(
    (await getSetCatalogue({ includeInactive: true })).map((set) => [set.name, set.setNameId]),
  );
}

export function extractPriceRows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  for (const key of ['result', 'results', 'data']) {
    const rows = (payload as Record<string, unknown>)[key];
    if (Array.isArray(rows)) return rows;
  }
  return [];
}

export async function getCardData(setName: string, { fresh = false } = {}) {
  const sets = await getSetNameIdMap();
  const id = Object.entries(sets).find(
    ([name]) => name.toLowerCase() === setName.toLowerCase(),
  )?.[1];
  if (!id) throw new HttpError(404, 'Set name not found in mapping');
  return getPricesBySetId(id, { fresh });
}

export async function getPricesBySetId(id: number, { fresh = false } = {}) {
  if (!Number.isSafeInteger(id) || id <= 0) throw new HttpError(400, 'Invalid set identifier');
  const load = async () => {
    const signal = AbortSignal.timeout(18000);
    const allRows: Record<string, unknown>[] = [];
    let offset = 0;
    let total = Number.POSITIVE_INFINITY;
    let pages = 0;
    const seenPages = new Set<string>();
    while (offset < total) {
      const data = await fetchJson(
        `${tcgHost('GET_CARD_DATA_API')}/priceguide/set/${id}/cards/?rows=5000&offset=${offset}`,
        { signal },
      );
      if (
        !data ||
        data.errors?.length ||
        (!Array.isArray(data) &&
          !['result', 'results', 'data'].some((key) => Array.isArray(data[key])))
      ) {
        throw new HttpError(502, 'TCGPlayer prices are unavailable for this set');
      }
      const rows = extractPriceRows(data);
      const pageKey = JSON.stringify(rows);
      if (rows.length && seenPages.has(pageKey))
        throw new HttpError(502, 'TCGPlayer returned a repeated price-guide page');
      seenPages.add(pageKey);
      const reportedTotal = Number(data.total);
      total =
        Number.isSafeInteger(reportedTotal) && reportedTotal >= 0
          ? reportedTotal
          : offset + rows.length;
      if (!rows.length && offset < total)
        throw new HttpError(502, 'TCGPlayer returned an incomplete price guide');
      allRows.push(...rows);
      offset += rows.length;
      pages += 1;
      if (pages > 100 || allRows.length > 200000)
        throw new HttpError(502, 'TCGPlayer price guide exceeds the supported size');
      if (!rows.length) break;
    }
    return { result: allRows, count: allRows.length, total };
  };
  return fresh ? load() : cached(`tcg:prices:${id}`, 300000, load);
}

export async function fetchYgoCards(params: Record<string, string> = {}) {
  const search = new URLSearchParams(params);
  const data = await fetchJson(`https://db.ygoprodeck.com/api/v7/cardinfo.php?${search}`);
  return Array.isArray(data?.data) ? data.data : [];
}

export async function fetchCardData({ fresh = false } = {}) {
  const load = async () => {
    const filename = path.join(process.cwd(), 'public/card-data/Yugioh/card_data.json');
    try {
      const data = JSON.parse(await fs.readFile(filename, 'utf8'));
      const cards = Array.isArray(data) ? data : data?.data;
      if (!fresh && Array.isArray(cards) && cards.length) return cards;
    } catch {
      /* Code-only packages can fetch metadata without the optional local cache. */
    }
    const cards = await fetchYgoCards();
    if (!cards.length) throw new HttpError(502, 'Yu-Gi-Oh card catalogue is unavailable');
    return cards;
  };
  return fresh ? load() : cached('ygo:catalogue', 3600000, load);
}

export async function getCardSetsData() {
  const map = await getSetNameIdMap();
  return Object.fromEntries(Object.entries(map).map(([name, id]) => [id, name]));
}
