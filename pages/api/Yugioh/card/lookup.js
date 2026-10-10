import { apiRoute } from '@/lib/server/http';
import { fetchYgoCards } from '@/lib/server/cardApi';
import { buildCardNameCandidates, buildCardNameKeys } from '@/utils/yugiohCardNameVariants';
import { formatYugiohCardData } from '@/utils/formatYugiohCardData';

const fetchExactName = async (name) => (await fetchYgoCards({ name }))[0] || null;
const fetchFuzzyName = (name) => fetchYgoCards({ fname: name });

const pickBestMatch = (matches, requestedName) => {
  if (!Array.isArray(matches) || matches.length === 0) {
    return null;
  }

  const candidateKeys = new Set(buildCardNameKeys(requestedName));
  if (candidateKeys.size === 0) {
    return matches[0];
  }

  const exact = matches.find((card) =>
    buildCardNameKeys(card?.name).some((key) => candidateKeys.has(key)),
  );
  return exact || matches[0];
};

async function handler(req, res) {
  const { name } = req.query;
  const normalizedName = Array.isArray(name) ? name[0] : name;

  if (!normalizedName) {
    return res.status(400).json({ error: 'Missing card name' });
  }

  const candidates = buildCardNameCandidates(normalizedName);
  if (candidates.length === 0) {
    return res.status(400).json({ error: 'Missing card name' });
  }

  try {
    let card = null;

    for (const candidate of candidates) {
      card = await fetchExactName(candidate);
      if (card) {
        break;
      }
    }

    if (!card) {
      const fallbackName = candidates[candidates.length - 1] || normalizedName;
      const fuzzyMatches = await fetchFuzzyName(fallbackName);
      card = pickBestMatch(fuzzyMatches, normalizedName);
    }

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    res.status(200).json(formatYugiohCardData(card));
  } catch (error) {
    if (error?.statusCode) throw error;
    console.error('Card API request failed');
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export default apiRoute({ methods: ['GET'], auth: false }, handler);
