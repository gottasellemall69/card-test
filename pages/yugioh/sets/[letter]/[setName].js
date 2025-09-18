"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter } from "next/router";
import { Grid, List } from 'lucide-react';
import Breadcrumb from "@/components/Navigation/Breadcrumb";
import Card from "@/components/Yugioh/Card";
import YugiohSearchBar from "@/components/Yugioh/YugiohSearchBar";
import YugiohCardDataTable from "@/components/Yugioh/YugiohCardDataTable";
import { fetchCardData } from "@/utils/api";
import { SpeedInsights } from "@vercel/speed-insights/next";

const CardsInSetPage = () => {
  const [ cards, setCards ] = useState( [] );
  const [ selectedCard, setSelectedCard ] = useState( [] );
  const [ modalVisible, setModalVisible ] = useState( false );
  const [ bulkModalVisible, setBulkModalVisible ] = useState( false );
  const [ isAuthenticated, setIsAuthenticated ] = useState( false );

  const [ searchTerm, setSearchTerm ] = useState( "" );
  const [ sortBy, setSortBy ] = useState( "asc" );
  const [ viewMode, setViewMode ] = useState( "grid" );

  // ✅ lifted persistent selection
  const [ selectedRowIds, setSelectedRowIds ] = useState( {} );
  const [ bulkSelections, setBulkSelections ] = useState( {} );

  // ✅ filters
  const [ selectedNumbers, setSelectedNumbers ] = useState( [] );
  const [ selectedRarities, setSelectedRarities ] = useState( [] );
  const [ numbersOpen, setNumbersOpen ] = useState( false );
  const [ raritiesOpen, setRaritiesOpen ] = useState( false );

  const router = useRouter();
  const { card, setName } = router.query;

  useEffect( () => {
    const loadData = async () => {
      const allCards = await fetchCardData();
      const cardsInSet = allCards.filter( ( card ) =>
        card.card_sets?.some(
          ( set ) => set.set_name.toLowerCase() === setName?.toLowerCase()
        )
      );
      setCards( cardsInSet );
    };

    if ( setName ) loadData();

    // auth check
    const checkAuth = async () => {
      try {
        const res = await fetch( "/api/auth/validate", {
          method: "GET",
          credentials: "include",
        } );
        setIsAuthenticated( res.ok );
      } catch {
        setIsAuthenticated( false );
      }
    };

    checkAuth();
  }, [ card, setName ] );

  const openModal = ( card ) => {
    setSelectedCard( card );
    setModalVisible( true );
  };

  const closeModal = () => {
    setSelectedCard( null );
    setModalVisible( false );
  };

  const handleAddToCollection = async ( selectedOptions ) => {
    try {
      const { set, condition } = selectedOptions;
      const response = await fetch( `/api/Yugioh/cards`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify( {
          cards: [
            {
              productName: selectedCard.name,
              setName: set.set_name,
              number: set.set_code,
              printing: set.set_edition || "Unknown Edition",
              rarity: set.set_rarity,
              condition:
                condition + " " + ( set.set_edition || "Unknown Edition" ),
              marketPrice: set.set_price || 0,
              quantity: 1,
            },
          ],
        } ),
      } );
      if ( !response.ok ) throw new Error( "Failed to add card" );
      alert( "Card added!" );
      closeModal();
    } catch ( error ) {
      console.error( error );
      alert( "Failed to add card. Try again." );
    }
  };

  // ✅ derive filter options
  const availableNumbers = useMemo( () => {
    return [
      ...new Set(
        cards
          .map( ( c ) =>
            c.card_sets?.find(
              ( s ) => s.set_name?.toLowerCase() === setName?.toLowerCase()
            )?.set_code
          )
          .filter( Boolean )
      ),
    ].sort();
  }, [ cards, setName ] );

  const availableRarities = useMemo( () => {
    return [
      ...new Set(
        cards.flatMap( ( c ) =>
          c.card_sets
            ?.filter( ( s ) => s.set_name?.toLowerCase() === setName?.toLowerCase() )
            .map( ( s ) => s.set_rarity )
        )
      ),
    ]
      .filter( Boolean )
      .sort();
  }, [ cards, setName ] );

  // ✅ search + sort + filters
  const processedCards = useMemo( () => {
    let data = [ ...cards ];
    if ( searchTerm ) {
      const term = searchTerm.toLowerCase();
      data = data.filter(
        ( c ) =>
          c.name?.toLowerCase().includes( term ) ||
          ( c.type && c.type.toLowerCase().includes( term ) ) ||
          ( c.archetype && c.archetype.toLowerCase().includes( term ) )
      );
    }

    if ( selectedNumbers.length > 0 ) {
      data = data.filter( ( c ) =>
        c.card_sets?.some(
          ( s ) =>
            s.set_name.toLowerCase() === setName?.toLowerCase() &&
            selectedNumbers.includes( s.set_code )
        )
      );
    }

    if ( selectedRarities.length > 0 ) {
      data = data.filter( ( c ) =>
        c.card_sets?.some(
          ( s ) =>
            s.set_name.toLowerCase() === setName?.toLowerCase() &&
            selectedRarities.includes( s.set_rarity )
        )
      );
    }

    if ( sortBy === "asc" ) data.sort( ( a, b ) => a.name.localeCompare( b.name ) );
    if ( sortBy === "desc" ) data.sort( ( a, b ) => b.name.localeCompare( a.name ) );
    return data;
  }, [ cards, searchTerm, sortBy, selectedNumbers, selectedRarities, setName ] );

  // ✅ convert to matchedCardData for table
  const matchedCardData = useMemo( () => {
    return processedCards.map( ( c ) => {
      const setForThisPage =
        c.card_sets?.find(
          ( s ) => s.set_name?.toLowerCase() === setName?.toLowerCase()
        ) || c.card_sets?.[ 0 ] || {};
      return {
        card: {
          productName: c.name,
          setName: setForThisPage.set_name || setName || "Unknown Set",
          number: setForThisPage.set_code || "",
          printing: setForThisPage.set_edition || "Unknown Edition",
          rarity: setForThisPage.set_rarity || "",
          condition: "Near Mint",
        },
        data: {
          marketPrice: setForThisPage.set_price || 0,
          lowPrice: 0,
        },
      };
    } );
  }, [ processedCards, setName ] );

  // ✅ get actual selected cards
  const getSelectedCards = () => {
    return matchedCardData.filter( ( row ) => {
      const key = `${ row.card.productName }|${ row.card.setName }|${ row.card.number }|${ row.card.printing }`;
      return selectedRowIds[ key ];
    } );
  };

  const openBulkModal = () => {
    const sel = getSelectedCards();
    if ( sel.length === 0 ) {
      alert( "No cards selected." );
      return;
    }
    const initial = {};
    sel.forEach( ( row ) => {
      initial[ row.card.productName ] = {
        set: {
          set_name: row.card.setName,
          set_code: row.card.number,
          set_edition: row.card.printing,
          set_rarity: row.card.rarity,
          set_price: row.data.marketPrice,
        },
        condition: row.card.condition,
      };
    } );
    setBulkSelections( ( prev ) => ( { ...prev, ...initial } ) );
    setBulkModalVisible( true );
  };

  const closeBulkModal = () => setBulkModalVisible( false );

  const handleBulkSubmit = async ( e ) => {
    e.preventDefault();
    try {
      const payload = getSelectedCards().map( ( row ) => {
        const sel = bulkSelections[ row.card.productName ];
        return {
          productName: row.card.productName,
          setName: sel.set.set_name,
          number: sel.set.set_code,
          printing: sel.set.set_edition || "Unknown Edition",
          rarity: sel.set.set_rarity,
          condition:
            sel.condition + " " + ( sel.set.set_edition || "Unknown Edition" ),
          marketPrice: sel.set.set_price || 0,
          quantity: 1,
        };
      } );

      const response = await fetch( `/api/Yugioh/cards`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify( { cards: payload } ),
      } );
      if ( !response.ok ) throw new Error( "Bulk add failed" );
      alert( `Added ${ payload.length } cards!` );
      setSelectedRowIds( {} );
      setBulkSelections( {} );
      closeBulkModal();
    } catch ( err ) {
      console.error( err );
      alert( "Error adding cards. Try again." );
    }
  };

  return (
    <>
      <Breadcrumb />
      <h1 className="my-10 text-xl font-black">
        Cards in { decodeURIComponent( setName || "" ) }
      </h1>

      {/* Controls styled like yugiohcardprices.io */ }
      <div id="dropdown-filters" className="space-y-3 mb-4">
        <div className="flex w-full flex-wrap items-center gap-4 ">
          {/* Numbers Filter */ }
          <div className="relative">
            <button
              type="button"
              onClick={ () => setNumbersOpen( ( o ) => !o ) }
              className="glass text-shadow inline-flex h-[40px] items-center gap-1.5 rounded-md border !border-dashed bg-transparent px-3 text-sm font-medium shadow-md hover:bg-accent hover:text-accent-foreground"
            >
              Number
            </button>
            { numbersOpen && (
              <div className="absolute mt-2 z-50 bg-white dark:bg-neutral-900 border border-dashed rounded shadow-lg p-3 max-h-64 overflow-y-auto w-56">
                <div className="flex justify-between mb-2">
                  <button
                    type="button"
                    onClick={ () => setSelectedNumbers( [] ) }
                    className="text-xs text-red-500 hover:underline"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={ () => setNumbersOpen( false ) }
                    className="text-xs text-blue-500 hover:underline"
                  >
                    Done
                  </button>
                </div>
                { availableNumbers.map( ( num ) => (
                  <label key={ num } className="flex items-center gap-2 text-sm py-1">
                    <input
                      type="checkbox"
                      checked={ selectedNumbers.includes( num ) }
                      onChange={ ( e ) =>
                        setSelectedNumbers( ( prev ) =>
                          e.target.checked
                            ? [ ...prev, num ]
                            : prev.filter( ( n ) => n !== num )
                        )
                      }
                    />
                    { num }
                  </label>
                ) ) }
              </div>
            ) }
          </div>

          {/* Rarities Filter */ }
          <div className="relative">
            <button
              type="button"
              onClick={ () => setRaritiesOpen( ( o ) => !o ) }
              className="glass text-shadow inline-flex h-[40px] items-center gap-1.5 rounded-md border !border-dashed bg-transparent px-3 text-sm font-medium shadow-md hover:bg-accent hover:text-accent-foreground"
            >
              Rarities
            </button>
            { raritiesOpen && (
              <div className="absolute mt-2 z-50 bg-white dark:bg-neutral-900 border border-dashed rounded shadow-lg p-3 max-h-64 overflow-y-auto w-56">
                <div className="flex justify-between mb-2">
                  <button
                    type="button"
                    onClick={ () => setSelectedRarities( [] ) }
                    className="text-xs text-red-500 hover:underline"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={ () => setRaritiesOpen( false ) }
                    className="text-xs text-blue-500 hover:underline"
                  >
                    Done
                  </button>
                </div>
                { availableRarities.map( ( rar ) => (
                  <label key={ rar } className="flex items-center gap-2 text-sm py-1">
                    <input
                      type="checkbox"
                      checked={ selectedRarities.includes( rar ) }
                      onChange={ ( e ) =>
                        setSelectedRarities( ( prev ) =>
                          e.target.checked
                            ? [ ...prev, rar ]
                            : prev.filter( ( r ) => r !== rar )
                        )
                      }
                    />
                    { rar }
                  </label>
                ) ) }
              </div>
            ) }
          </div>

          {/* Sort Dropdown */ }
          <div className="flex items-center">
            <select
              value={ sortBy }
              onChange={ ( e ) => setSortBy( e.target.value ) }
              className="inline-flex h-[40px] items-center justify-center gap-1.5 rounded-md border !border-dashed bg-transparent px-3 text-sm font-medium shadow-md hover:bg-accent hover:text-accent-foreground"
            >
              <option value="glass text-shadow asc">Name (A-Z)</option>
              <option value="glass text-shadow desc">Name (Z-A)</option>
            </select>
          </div>

          {/* View Toggle */ }
          <div
            role="group"
            className="flex w-fit items-center rounded-md border border-dashed text-shadow"
          >
            <button
              type="button"
              onClick={ () => setViewMode( "grid" ) }
              title={ "Grid view" }
              className={ `inline-flex h-[40px] items-center justify-center px-3 text-sm font-medium ${ viewMode === "grid"
                ? "glass bg-accent text-accent-foreground"
                : "bg-transparent hover:bg-none hover:text-muted-foreground"
                }` }
            >
              <Grid size={ 25 } />
            </button>
            <button
              type="button"
              onClick={ () => setViewMode( "table" ) }
              title={ "Table view" }
              className={ `inline-flex h-[40px] items-center justify-center px-3 text-sm font-medium ${ viewMode === "table"
                ? "glass bg-accent text-accent-foreground"
                : "bg-transparent hover:bg-transparent hover:text-muted-foreground"
                }` }
            >
              <List size={ 25 } />
            </button>
          </div>


        </div>
        {/* Search */ }
        <div className="mx-auto flex-1 w-full">
          <YugiohSearchBar onSearch={ setSearchTerm } />
        </div>
      </div>

      {/* Active filter chips */ }
      { ( selectedNumbers.length > 0 || selectedRarities.length > 0 ) && (
        <div className="flex flex-wrap gap-2 mb-4">
          { selectedNumbers.map( ( num ) => (
            <span
              key={ num }
              className="inline-flex items-center gap-1 bg-accent text-accent-foreground text-sm px-3 py-1 rounded-full border border-dashed shadow-sm"
            >
              { num }
              <button
                type="button"
                onClick={ () =>
                  setSelectedNumbers( ( prev ) => prev.filter( ( n ) => n !== num ) )
                }
                className="ml-1 text-xs hover:text-red-500"
              >
                ✕
              </button>
            </span>
          ) ) }
          { selectedRarities.map( ( rar ) => (
            <span
              key={ rar }
              className="inline-flex items-center gap-1 bg-accent text-accent-foreground text-sm px-3 py-1 rounded-full border border-dashed shadow-sm"
            >
              { rar }
              <button
                type="button"
                onClick={ () =>
                  setSelectedRarities( ( prev ) => prev.filter( ( r ) => r !== rar ) )
                }
                className="ml-1 text-xs hover:text-red-500"
              >
                ✕
              </button>
            </span>
          ) ) }
        </div>
      ) }

      {/* Content */ }
      { viewMode === "grid" ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          { processedCards?.map( ( cardItem ) => (
            <div key={ cardItem.id } className="mx-auto p-4 rounded shadow">
              <Card cardData={ cardItem } as="image" source="set" />
              { isAuthenticated && (
                <button
                  type="button"
                  className="w-full mt-2 px-2 py-2 bg-blue-500 text-white font-semibold text-shadow rounded"
                  onClick={ () => openModal( cardItem ) }
                >
                  Add to Collection
                </button>
              ) }
            </div>
          ) ) }
        </div>
      ) : (
        <Suspense fallback={ <div className="text-center py-8">Loading...</div> }>
          <YugiohCardDataTable
            matchedCardData={ matchedCardData }
            selectedRowIds={ selectedRowIds }
            setSelectedRowIds={ setSelectedRowIds }
          />
        </Suspense>
      ) }

      {/* Bulk Add Button */ }
      { viewMode === "table" && Object.values( selectedRowIds ).some( Boolean ) && (
        <div className="mt-4">
          <button
            onClick={ openBulkModal }
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Add Selected to Collection
          </button>
        </div>
      ) }

      {/* Single card modal */ }
      { modalVisible && selectedCard && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="glass p-6 rounded shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">{ selectedCard.name }</h2>
            <form
              onSubmit={ ( e ) => {
                e.preventDefault();
                const formData = new FormData( e.target );
                const selectedSet = JSON.parse( formData.get( "set" ) );
                const selectedCondition = formData.get( "condition" );
                handleAddToCollection( {
                  set: selectedSet,
                  condition: selectedCondition,
                } );
              } }
            >
              {/* set + condition selectors */ }
              <label className="block mb-2">
                Select Set:
                <select
                  name="set"
                  className="w-full border rounded p-2 text-black"
                  required
                  defaultValue=""
                >
                  <option value="" disabled>
                    Choose a set
                  </option>
                  { selectedCard.card_sets?.map( ( set, i ) => (
                    <option key={ i } value={ JSON.stringify( set ) }>
                      { set.set_name } - { set.set_rarity } -{ " " }
                      { set.set_edition || "Unknown Edition" } - $
                      { set.set_price || "0.00" }
                    </option>
                  ) ) }
                </select>
              </label>
              <label className="block mb-4">
                Select Condition:
                <select
                  name="condition"
                  className="w-full border rounded p-2 text-black"
                  required
                  defaultValue=""
                >
                  <option value="" disabled>
                    Choose a condition
                  </option>
                  <option value="Near Mint">Near Mint</option>
                  <option value="Lightly Played">Lightly Played</option>
                  <option value="Moderately Played">
                    Moderately Played
                  </option>
                  <option value="Heavily Played">Heavily Played</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </label>
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={ closeModal }
                  className="px-4 py-2 bg-red-500 text-white rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      ) }

      {/* Bulk modal */ }
      { bulkModalVisible && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 overflow-y-auto">
          <div className="glass p-6 rounded shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add Selected Cards</h2>
            <form onSubmit={ handleBulkSubmit } className="space-y-6">
              { getSelectedCards().map( ( row ) => (
                <div key={ row.card.productName } className="border-b pb-4">
                  <h3 className="font-semibold mb-2">{ row.card.productName }</h3>
                  <label className="block mb-2">
                    Select Set:
                    <select
                      className="w-full border rounded p-2 text-black"
                      value={ JSON.stringify(
                        bulkSelections[ row.card.productName ]?.set || {}
                      ) }
                      onChange={ ( e ) =>
                        setBulkSelections( ( prev ) => ( {
                          ...prev,
                          [ row.card.productName ]: {
                            ...prev[ row.card.productName ],
                            set: JSON.parse( e.target.value ),
                          },
                        } ) )
                      }
                      required
                    >
                      <option value="" disabled>
                        Choose a set
                      </option>
                      { cards
                        .find( ( c ) => c.name === row.card.productName )
                        ?.card_sets?.map( ( set, i ) => (
                          <option key={ i } value={ JSON.stringify( set ) }>
                            { set.set_name } - { set.set_rarity } -{ " " }
                            { set.set_edition || "Unknown Edition" } - $
                            { set.set_price || "0.00" }
                          </option>
                        ) ) }
                    </select>
                  </label>
                  <label className="block">
                    Select Condition:
                    <select
                      className="w-full border rounded p-2 text-black"
                      value={
                        bulkSelections[ row.card.productName ]?.condition ||
                        "Near Mint"
                      }
                      onChange={ ( e ) =>
                        setBulkSelections( ( prev ) => ( {
                          ...prev,
                          [ row.card.productName ]: {
                            ...prev[ row.card.productName ],
                            condition: e.target.value,
                          },
                        } ) )
                      }
                      required
                    >
                      <option value="Near Mint">Near Mint</option>
                      <option value="Lightly Played">Lightly Played</option>
                      <option value="Moderately Played">
                        Moderately Played
                      </option>
                      <option value="Heavily Played">Heavily Played</option>
                      <option value="Damaged">Damaged</option>
                    </select>
                  </label>
                </div>
              ) ) }
              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={ closeBulkModal }
                  className="px-4 py-2 bg-red-500 text-white rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded"
                >
                  Add All
                </button>
              </div>
            </form>
          </div>
        </div>
      ) }

      <SpeedInsights />
    </>
  );
};

export default CardsInSetPage;
