import { apiRoute } from '@/lib/server/http';
import { buildCardNameCandidates, buildCardNameKeys } from '@/utils/yugiohCardNameVariants';
import { formatYugiohCardData } from '@/utils/formatYugiohCardData';
import { getCardData, fetchJson } from '@/lib/server/cardApi';

import { findBestPriceRow } from '@/lib/cards/match';

const UNKNOWN_EDITION = 'Unknown Edition';

const normalizeText = (value) => (value ?? '').toString().replace(/\s+/g, ' ').trim().toLowerCase();

const normalizeLooseText = (value) =>
  normalizeText(value)
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const normalizeToken = (value) => normalizeText(value).replace(/[^a-z0-9]+/g, '');

const normalizeEditionKey = (value) => {
  const normalized = normalizeLooseText(value);

  if (!normalized || normalized === 'unknown edition') {
    return '';
  }

  if (/\bunlimited\b/.test(normalized)) return 'unlimited';
  if (/\b1st\b|\bfirst\b/.test(normalized)) return '1st';
  if (/\blimited\b/.test(normalized)) return 'limited';

  return normalized
    .replace(/\bedition\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const normalizeRarityKey = (value) => normalizeToken(value);

const isUnknownEdition = (value) => !normalizeEditionKey(value);

const matchesSetCode = (setCode, targetCode) => {
  if (!setCode || !targetCode) return false;
  return normalizeToken(setCode) === normalizeToken(targetCode);
};

const raritiesMatch = (left, right) => {
  const leftKey = normalizeRarityKey(left);
  const rightKey = normalizeRarityKey(right);
  return !leftKey || !rightKey || leftKey === rightKey;
};

const editionsMatch = (left, right) => {
  const leftKey = normalizeEditionKey(left);
  const rightKey = normalizeEditionKey(right);
  return !leftKey || !rightKey || leftKey === rightKey;
};

const parsePrice = (value) => {
  const numeric = Number.parseFloat((value ?? '').toString().replace(/[^0-9.-]+/g, ''));
  return Number.isFinite(numeric) ? numeric : null;
};

const extractTcgRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const fetchTcgRows = async (setNames) => {
  const uniqueSetNames = Array.from(
    new Set(
      setNames
        .filter((value) => typeof value === 'string' && value.trim())
        .map((value) => value.trim()),
    ),
  );

  for (const candidateSetName of uniqueSetNames) {
    let payload;
    try {
      payload = await getCardData(candidateSetName);
    } catch (error) {
      if (error?.statusCode === 404) continue;
      throw error;
    }
    const rows = extractTcgRows(payload);
    if (rows.length > 0) {
      return { setName: candidateSetName, rows };
    }
  }

  return { setName: uniqueSetNames[0] || '', rows: [] };
};

const findTcgPriceRow = (rows, { setCode, cardName, rarity, edition, condition }) =>
  findBestPriceRow(rows, {
    number: setCode,
    productName: cardName,
    rarity,
    printing: edition,
    condition: condition || 'Near Mint',
  })?.row || null;

const findMatchedSetEntry = (match, { setCode, rarity, edition }) => {
  const candidates = Array.isArray(match?.card_sets)
    ? match.card_sets.filter((set) => matchesSetCode(set?.set_code, setCode))
    : [];

  if (candidates.length === 0) {
    return null;
  }

  return (
    candidates
      .map((set) => {
        let score = 10;
        if (
          normalizeRarityKey(set?.set_rarity) &&
          normalizeRarityKey(set?.set_rarity) === normalizeRarityKey(rarity)
        )
          score += 10;
        if (
          normalizeEditionKey(set?.set_edition) &&
          normalizeEditionKey(set?.set_edition) === normalizeEditionKey(edition)
        )
          score += 5;
        return { set, score };
      })
      .sort((left, right) => right.score - left.score)[0]?.set || candidates[0]
  );
};

const enrichMatchWithTcg = (
  match,
  { setName, tcgSetName, setCode, cardName, rarity, edition, tcgRow },
) => {
  const matchedSet = findMatchedSetEntry(match, { setCode, rarity, edition });
  const selectedSetName = tcgSetName || setName || matchedSet?.set_name || '';
  const selectedPrice =
    parsePrice(tcgRow?.marketPrice) ??
    parsePrice(tcgRow?.lowPrice) ??
    parsePrice(matchedSet?.set_price);

  const selectedEdition =
    tcgRow?.printing ||
    edition ||
    (matchedSet && !isUnknownEdition(matchedSet.set_edition) ? matchedSet.set_edition : '') ||
    matchedSet?.set_edition ||
    UNKNOWN_EDITION;

  const enrichedSet = {
    ...(matchedSet || {}),
    set_name: selectedSetName,
    tcg_set_name: selectedSetName,
    set_code: tcgRow?.number || matchedSet?.set_code || setCode,
    set_rarity: tcgRow?.rarity || rarity || matchedSet?.set_rarity || 'Unknown Rarity',
    set_rarity_code: matchedSet?.set_rarity_code,
    set_edition: selectedEdition,
    set_price: selectedPrice !== null ? selectedPrice.toFixed(2) : matchedSet?.set_price || '0.00',
  };

  const remainingSets = Array.isArray(match?.card_sets)
    ? match.card_sets.filter(
        (set) =>
          !(
            matchesSetCode(set?.set_code, enrichedSet.set_code) &&
            raritiesMatch(set?.set_rarity, enrichedSet.set_rarity) &&
            editionsMatch(set?.set_edition, enrichedSet.set_edition)
          ),
      )
    : [];

  return {
    ...match,
    name: match?.name || cardName,
    card_sets: [enrichedSet, ...remainingSets],
  };
};

const pickBestMatch = (cards, setCode, cardName) => {
  if (!Array.isArray(cards) || cards.length === 0) {
    return null;
  }

  const requestedKeys = new Set(buildCardNameKeys(cardName));

  const codeMatches = cards.filter(
    (card) =>
      Array.isArray(card?.card_sets) &&
      card.card_sets.some((set) => matchesSetCode(set?.set_code, setCode)),
  );

  if (codeMatches.length === 0) {
    return null;
  }

  if (requestedKeys.size > 0) {
    const exactName = codeMatches.find((card) =>
      buildCardNameKeys(card?.name).some((key) => requestedKeys.has(key)),
    );
    if (exactName) {
      return exactName;
    }
  }

  return codeMatches[0];
};

const fetchCards = async (url) => {
  const data = await fetchJson(url);
  return Array.isArray(data?.data) ? data.data : [];
};

const fetchCardsBySetName = (setName) =>
  fetchCards('https://db.ygoprodeck.com/api/v7/cardinfo.php?set=' + encodeURIComponent(setName));

const fetchCardsByName = async (cardName) => {
  const candidates = buildCardNameCandidates(cardName);
  const matchesById = new Map();

  for (const candidate of candidates) {
    const exactMatches = await fetchCards(
      'https://db.ygoprodeck.com/api/v7/cardinfo.php?name=' + encodeURIComponent(candidate),
    );
    exactMatches.forEach((card) => {
      if (card?.id && !matchesById.has(card.id)) {
        matchesById.set(card.id, card);
      }
    });
  }

  if (matchesById.size === 0) {
    const fallbackName = candidates[candidates.length - 1] || cardName;
    const fuzzyMatches = await fetchCards(
      'https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=' + encodeURIComponent(fallbackName),
    );
    fuzzyMatches.forEach((card) => {
      if (card?.id && !matchesById.has(card.id)) {
        matchesById.set(card.id, card);
      }
    });
  }

  return Array.from(matchesById.values());
};

const firstQueryValue = (value) => (Array.isArray(value) ? value[0] : value);

async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const setName = firstQueryValue(req.query.set_name)?.toString().trim() || '';
  const tcgSetName = firstQueryValue(req.query.tcg_set_name)?.toString().trim() || setName;
  const setCode = firstQueryValue(req.query.set_code)?.toString().trim() || '';
  const cardName = firstQueryValue(req.query.card_name)?.toString().trim() || '';
  const rarity =
    (firstQueryValue(req.query.set_rarity) || firstQueryValue(req.query.rarity))
      ?.toString()
      .trim() || '';
  const edition = firstQueryValue(req.query.edition)?.toString().trim() || '';
  const condition = req.query.condition || 'Near Mint';

  if (!setName || !setCode) {
    return res.status(400).json({ error: 'Missing set name or set code' });
  }

  try {
    const setCards = await fetchCardsBySetName(setName);
    let match = pickBestMatch(setCards, setCode, cardName);

    if (!match && cardName) {
      const nameCards = await fetchCardsByName(cardName);
      match = pickBestMatch(nameCards, setCode, cardName);
    }

    if (!match) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const tcgData = await fetchTcgRows([tcgSetName, setName]);
    const tcgRow = findTcgPriceRow(tcgData.rows, { setCode, cardName, rarity, edition, condition });
    const enrichedMatch = enrichMatchWithTcg(match, {
      setName,
      tcgSetName: tcgData.setName || tcgSetName,
      setCode,
      cardName,
      rarity,
      edition,
      tcgRow,
    });

    return res.status(200).json(formatYugiohCardData(enrichedMatch));
  } catch (error) {
    if (error?.statusCode) throw error;
    console.error('Card API request failed');
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export default apiRoute({ methods: ['GET'], auth: false }, handler);
