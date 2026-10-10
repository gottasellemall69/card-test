import Image from 'next/image';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import Head from 'next/head';

import {
  MAIN_DECK_MAX,
  EXTRA_DECK_MAX,
  initialDeck,
  deckReducer,
  buildDeckWarnings,
} from '@/lib/cards/deck';

const getCardImageSrc = (card) => {
  const primaryImage = card?.card_images?.[0] || null;
  return (
    primaryImage?.image_url ||
    primaryImage?.image_url_cropped ||
    primaryImage?.image_url_small ||
    '/images/backgrounds/yugioh/background.svg'
  );
};

export default function DeckBuilder() {
  const [search, setSearch] = useState('');
  const [cards, setCards] = useState(null);
  const [{ deck, extraDeck, statusMessage }, dispatch] = useReducer(deckReducer, initialDeck);
  const [error, setError] = useState(null);
  const [archetypeSuggestions, setArchetypeSuggestions] = useState(null);
  const deckWarnings = useMemo(() => buildDeckWarnings(deck, extraDeck), [deck, extraDeck]);
  const [searchTerm, setSearchTerm] = useState('');
  const searchController = useRef(null);
  const [isSearching, setIsSearching] = useState(false);
  useEffect(() => () => searchController.current?.abort(), []);

  const searchCards = useCallback(async () => {
    searchController.current?.abort();
    const controller = new AbortController();
    searchController.current = controller;
    const { signal } = controller;
    setError(null);
    setIsSearching(true);
    setArchetypeSuggestions(null);
    dispatch({ type: 'clear-message' });
    try {
      const response = await fetch(
        `/api/Yugioh/cards/recommendations?search=${encodeURIComponent(search.trim())}`,
        { signal },
      );
      const data = await response.json();
      if (signal.aborted) return;
      if (!response.ok) {
        setError(data.message || 'Card search failed');
        setCards(null);
        return;
      }
      setCards(data);
      if (data.searchedCard?.archetype) {
        const related = await fetch(
          `/api/Yugioh/cards/recommendations?archetype=${encodeURIComponent(data.searchedCard.archetype)}`,
          { signal },
        );
        const suggestions = await related.json();
        if (!signal.aborted && related.ok)
          setArchetypeSuggestions(suggestions.relatedCards || null);
      }
    } catch {
      if (!signal.aborted) setError('Failed to fetch cards');
    } finally {
      if (!signal.aborted) setIsSearching(false);
    }
  }, [search]);

  const addToDeck = useCallback((card) => {
    if (card) dispatch({ type: 'add', card });
  }, []);
  const removeFromDeck = useCallback(
    (index, extra = false) => dispatch({ type: 'remove', index, extra }),
    [],
  );

  const filteredArchetypeSuggestions = useMemo(() => {
    if (!archetypeSuggestions) return null;
    return archetypeSuggestions.filter((card) =>
      card.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [archetypeSuggestions, searchTerm]);

  return (
    <>
      <Head>
        <title>Yu-Gi-Oh! Deck Builder</title>
        <meta name="description" content="Build decks and stuff, I don't know..." />
        <meta
          name="keywords"
          content="javascript,nextjs,price-tracker,trading-card-game,tailwindcss"
        />
        <meta charSet="UTF-8" />
      </Head>
      <div className="p-6 glass min-h-screen yugioh-bg text-black">
        <h1 className="text-3xl font-bold mb-4 text-white">Yu-Gi-Oh! Deck Builder</h1>

        <div className="flex flex-col gap-2 xl:flex-row">
          {/* Deck Panel */}
          <div className="flex-1 glass p-4 shadow overflow-auto">
            <h2 className="text-2xl font-bold text-white">Deck</h2>
            <p className="text-sm text-white">
              Main Deck: {deck.filter(Boolean).length}/{MAIN_DECK_MAX} | Extra Deck:{' '}
              {extraDeck.length}/{EXTRA_DECK_MAX}
            </p>
            {deckWarnings.length > 0 && (
              <div className="mt-2 text-red-700 font-semibold">
                {deckWarnings.map((warning, idx) => (
                  <p key={idx}>{warning}</p>
                ))}
              </div>
            )}
            {statusMessage && <p className="mt-2 text-amber-300 font-semibold">{statusMessage}</p>}
            {/* Main Deck */}
            <div className="mt-4">
              <h3 className="text-xl font-bold">Main Deck</h3>
              <div className="grid grid-cols-4 sm:grid-cols-5 xl:grid-cols-8 gap-2 mt-4">
                {deck.map((slot, index) => (
                  <div
                    key={index}
                    className="relative w-full min-w-0 aspect-[5/7] bg-white flex items-center justify-center border border-gray-400 rounded"
                  >
                    {slot ? (
                      <>
                        <Image
                          src={getCardImageSrc(slot)}
                          alt={slot.name}
                          width={80}
                          height={112}
                          className="rounded w-full h-fit object-scale-down"
                          unoptimized
                        />
                        <button
                          type="button"
                          onClick={() => removeFromDeck(index)}
                          className="text-red-700 z-10 absolute -top-1 -right-1 text-xl font-black bg-white/80 rounded-full px-1"
                          aria-label={`Remove ${slot.name} from deck`}
                        >
                          ×
                        </button>
                      </>
                    ) : (
                      <span className="text-gray-500">Empty</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Extra Deck */}
            <div className="mt-8">
              <h3 className="text-xl font-bold">Extra Deck</h3>
              <div className="grid grid-cols-4 sm:grid-cols-5 xl:grid-cols-8 gap-2 mt-2">
                {extraDeck.map((card, index) => (
                  <div
                    key={`${card.id ?? card.name}-${index}`}
                    className="relative w-full min-w-0 aspect-[5/7] bg-gray-200 flex flex-col items-center justify-center border border-gray-400 rounded"
                  >
                    <Image
                      src={getCardImageSrc(card)}
                      alt={card.name}
                      width={80}
                      height={112}
                      className="rounded w-full h-fit object-scale-down"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => removeFromDeck(index, true)}
                      className="text-red-700 z-10 absolute -top-1 -right-1 text-xl font-black bg-white/80 rounded-full px-1"
                      aria-label={`Remove ${card.name} from extra deck`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Split Pane: Search and Archetype Suggestions */}
          <div className="flex flex-col flex-1 gap-2">
            {/* Search Panel */}
            <div className="flex-1 glass p-4 border-b border-gray-300">
              <h2 className="text-2xl font-bold text-white">Search</h2>
              <div className="mt-4">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search for a card..."
                  className="p-2 border border-gray-300 rounded w-full mb-4"
                />
                <button
                  onClick={searchCards}
                  disabled={isSearching || !search.trim()}
                  className="px-4 py-2 bg-blue-800 text-white rounded hover:bg-blue-600 w-fit"
                >
                  Search
                </button>
              </div>

              {error && <p className="text-red-500 mt-4">{error}</p>}

              {cards && cards.searchedCard && (
                <div className="mt-4">
                  <h3 className="text-xl font-semibold text-white">Searched Card</h3>
                  <div className="p-4 bg-transparent text-white rounded shadow mb-4">
                    <Image
                      src={getCardImageSrc(cards.searchedCard)}
                      alt={cards.searchedCard.name}
                      width={240}
                      height={320}
                      className="rounded w-fit h-48 content-around"
                      unoptimized
                    />
                    <p>
                      <strong>Name:</strong> {cards.searchedCard.name}
                    </p>
                    <p>
                      <strong>Archetype:</strong> {cards.searchedCard.archetype}
                    </p>
                    <p>
                      <strong>Text:</strong> {cards.searchedCard.desc}
                    </p>
                    <button
                      onClick={() => addToDeck(cards.searchedCard)}
                      className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Add to Deck
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Archetype Suggestions Panel */}
            <div className="flex-1 glass p-4 ">
              <h2 className="text-2xl font-bold text-white">Archetype Suggestions</h2>
              {archetypeSuggestions && archetypeSuggestions.length > 0 && (
                <div className="mt-4">
                  <input
                    type="text"
                    placeholder="Search within archetype..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 text-black rounded-lg border border-gray-300"
                  />
                </div>
              )}
              {filteredArchetypeSuggestions && filteredArchetypeSuggestions.length > 0 ? (
                <div className="inline-grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 overflow-y-auto max-h-[400px]">
                  {filteredArchetypeSuggestions.map((card, index) => (
                    <div
                      key={`${card.id ?? card.name}-${index}`}
                      className="w-full rounded bg-white p-3 shadow"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <Image
                          src={getCardImageSrc(card)}
                          alt={card.name}
                          width={120}
                          height={160}
                          className="rounded object-contain"
                          unoptimized
                        />
                        <div className="flex-1 text-gray-800">
                          <p>
                            <strong>Name:</strong> {card.name}
                          </p>
                          <p className="text-sm mt-1">
                            <strong className="text-base">Archetype:</strong> {card.archetype}
                          </p>
                          <p className="text-sm mt-1">
                            <strong className="text-base">Text:</strong> {card.desc}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => addToDeck(card)}
                        className="mt-3 inline-flex px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Add to Deck
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 mt-4">No archetype suggestions available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
