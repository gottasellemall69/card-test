import { apiRoute, queryString } from '@/lib/server/http';
import { fetchYgoCards } from '@/lib/server/cardApi';
import { HttpError } from '@/lib/server/errors';

export default apiRoute({ methods: ['GET'] }, async (req, res) => {
  const search = req.query.search;
  const archetype = req.query.archetype;
  if (!search && !archetype) throw new HttpError(400, 'Search query is required');
  const cards = await fetchYgoCards(
    archetype
      ? { archetype: queryString(archetype, 'archetype') }
      : { fname: queryString(search, 'search') },
  );
  if (!cards.length) throw new HttpError(404, 'Card not found');
  if (search)
    return res
      .status(200)
      .json({
        searchedCard: cards[0],
        relatedCards: cards.filter((card) => card.archetype === cards[0].archetype),
      });
  return res.status(200).json({ relatedCards: cards });
});
