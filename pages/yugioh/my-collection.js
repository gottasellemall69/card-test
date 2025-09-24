import { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Grid, List, Loader2, TrendingUp, Trash2, Search } from "lucide-react";

import DownloadYugiohCSVButton from "@/components/Yugioh/Buttons/DownloadYugiohCSVButton";
import CardFilter from "@/components/Yugioh/CardFilter";
import YugiohPagination from "@/components/Yugioh/YugiohPagination";

const TableView = dynamic( () => import( "@/components/Yugioh/TableView" ), {
  ssr: false,
  loading: () => (
    <div className="py-12 text-center text-lg font-semibold text-white/80">
      Loading table...
    </div>
  ),
} );

const GridView = dynamic( () => import( "@/components/Yugioh/GridView" ), {
  ssr: false,
  loading: () => (
    <div className="py-12 text-center text-lg font-semibold text-white/80">
      Loading cards...
    </div>
  ),
} );

const ITEMS_PER_PAGE = 20;
const DEFAULT_FILTERS = { rarity: [], condition: [], printing: [] };
const DEFAULT_SORT = { key: "number", direction: "ascending" };

const MyCollection = () => {
  const router = useRouter();

  const [ cards, setCards ] = useState( [] );
  const [ viewMode, setViewMode ] = useState( "grid" );
  const [ isAuthenticated, setIsAuthenticated ] = useState( false );
  const [ isLoading, setIsLoading ] = useState( true );
  const [ isUpdatingPrices, setIsUpdatingPrices ] = useState( false );
  const [ searchValue, setSearchValue ] = useState( "" );
  const [ filters, setFilters ] = useState( () => ( { ...DEFAULT_FILTERS } ) );
  const [ sortConfig, setSortConfig ] = useState( () => ( { ...DEFAULT_SORT } ) );
  const [ isFilterMenuOpen, setIsFilterMenuOpen ] = useState( false );
  const [ currentPage, setCurrentPage ] = useState( 1 );

  const fetchCards = useCallback( async () => {
    const response = await fetch( "/api/Yugioh/my-collection", {
      method: "GET",
      credentials: "include",
    } );

    if ( !response.ok ) {
      const error = new Error( "Failed to fetch collection" );
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    return Array.isArray( data ) ? data : [];
  }, [] );

  useEffect( () => {
    let isActive = true;

    const initialize = async () => {
      setIsLoading( true );
      try {
        const response = await fetch( "/api/auth/validate", {
          method: "GET",
          credentials: "include",
        } );

        if ( !isActive ) {
          return;
        }

        if ( !response.ok ) {
          setIsAuthenticated( false );
          setCards( [] );
          return;
        }

        setIsAuthenticated( true );
        const data = await fetchCards();

        if ( !isActive ) {
          return;
        }

        setCards( data );
      } catch ( error ) {
        if ( isActive ) {
          console.error( "Error loading collection:", error );
          setIsAuthenticated( false );
          setCards( [] );
        }
      } finally {
        if ( isActive ) {
          setIsLoading( false );
        }
      }
    };

    initialize();

    return () => {
      isActive = false;
    };
  }, [ fetchCards ] );

  const refreshCollection = useCallback( async () => {
    try {
      const data = await fetchCards();
      setCards( data );
    } catch ( error ) {
      console.error( "Error refreshing collection:", error );
      if ( error.status === 401 ) {
        setIsAuthenticated( false );
      }
    }
  }, [ fetchCards ] );

  const normalizedSearch = useMemo( () => searchValue.trim().toLowerCase(), [ searchValue ] );

  const filteredCards = useMemo( () => {
    if ( !Array.isArray( cards ) ) {
      return [];
    }

    return cards.filter( ( card ) => {
      if ( filters.rarity.length && !filters.rarity.includes( card?.rarity ) ) {
        return false;
      }

      if ( filters.condition.length && !filters.condition.includes( card?.condition ) ) {
        return false;
      }

      if ( filters.printing.length && !filters.printing.includes( card?.printing ) ) {
        return false;
      }

      if ( !normalizedSearch ) {
        return true;
      }

      return [
        "productName",
        "setName",
        "number",
        "rarity",
        "printing",
        "condition",
      ].some( ( key ) => String( card?.[ key ] ?? "" ).toLowerCase().includes( normalizedSearch ) );
    } );
  }, [ cards, filters.condition, filters.printing, filters.rarity, normalizedSearch ] );

  const sortedCards = useMemo( () => {
    const sortable = [ ...filteredCards ];
    const { key, direction } = sortConfig;

    if ( !key ) {
      return sortable;
    }

    return sortable.sort( ( a, b ) => {
      const aValue = a?.[ key ];
      const bValue = b?.[ key ];

      if ( aValue === bValue ) {
        return 0;
      }

      if ( aValue === null || aValue === undefined ) {
        return direction === "ascending" ? 1 : -1;
      }

      if ( bValue === null || bValue === undefined ) {
        return direction === "ascending" ? -1 : 1;
      }

      if ( typeof aValue === "number" && typeof bValue === "number" ) {
        return direction === "ascending" ? aValue - bValue : bValue - aValue;
      }

      return direction === "ascending"
        ? String( aValue ).localeCompare( String( bValue ) )
        : String( bValue ).localeCompare( String( aValue ) );
    } );
  }, [ filteredCards, sortConfig ] );

  const totalItems = sortedCards.length;

  useEffect( () => {
    const totalPages = Math.max( 1, Math.ceil( totalItems / ITEMS_PER_PAGE ) );
    if ( currentPage > totalPages ) {
      setCurrentPage( totalPages );
    }
  }, [ currentPage, totalItems ] );

  const paginatedCards = useMemo( () => {
    if ( !totalItems ) {
      return [];
    }

    const start = ( currentPage - 1 ) * ITEMS_PER_PAGE;
    return sortedCards.slice( start, start + ITEMS_PER_PAGE );
  }, [ currentPage, sortedCards, totalItems ] );

  const gridCards = useMemo(
    () =>
      paginatedCards.map( ( card ) => ( {
        ...card,
        set_name: card?.setName,
        set_code: card?.number,
        edition: card?.printing || "Unknown Edition",
        source: "collection",
      } ) ),
    [ paginatedCards ],
  );

  const totalOwnedCards = useMemo(
    () =>
      sortedCards.reduce( ( sum, card ) => sum + ( Number( card?.quantity ) || 0 ), 0 ),
    [ sortedCards ],
  );

  const distinctSets = useMemo( () => {
    const sets = new Set();
    sortedCards.forEach( ( card ) => {
      if ( card?.setName ) {
        sets.add( card.setName );
      }
    } );
    return sets.size;
  }, [ sortedCards ] );

  const estimatedValue = useMemo(
    () =>
      sortedCards.reduce( ( sum, card ) => {
        const price = parseFloat( card?.marketPrice ) || 0;
        const quantity = Number( card?.quantity ) || 0;
        return sum + price * quantity;
      }, 0 ),
    [ sortedCards ],
  );

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat( "en-US", { style: "currency", currency: "USD" } ),
    [],
  );

  const formattedEstimatedValue = currencyFormatter.format( estimatedValue || 0 );
  const hasCards = totalItems > 0;

  const activeFilterBadges = useMemo( () => {
    const badges = [];

    filters.rarity.forEach( ( value ) => {
      badges.push( { id: `rarity-${ value }`, label: value } );
    } );

    filters.condition.forEach( ( value ) => {
      badges.push( { id: `condition-${ value }`, label: value } );
    } );

    filters.printing.forEach( ( value ) => {
      badges.push( { id: `printing-${ value }`, label: value } );
    } );

    return badges;
  }, [ filters ] );

  const handleSearchChange = useCallback( ( event ) => {
    setSearchValue( event.target.value );
    setCurrentPage( 1 );
  }, [] );

  const handleFilterChange = useCallback( ( filterName, selectedOptions ) => {
    setFilters( ( prev ) => ( {
      ...prev,
      [ filterName ]: selectedOptions,
    } ) );
    setCurrentPage( 1 );
  }, [] );

  const handleClearFilters = useCallback( () => {
    setFilters( { ...DEFAULT_FILTERS } );
    setCurrentPage( 1 );
  }, [] );

  const handleSortChange = useCallback( ( key, direction ) => {
    setSortConfig( ( prev ) => {
      if ( direction ) {
        return { key, direction };
      }

      const isSameKey = prev.key === key;
      const nextDirection = isSameKey && prev.direction === "ascending" ? "descending" : "ascending";
      return { key, direction: nextDirection };
    } );
  }, [] );

  const handlePageClick = useCallback(
    ( page ) => {
      if ( Number.isNaN( page ) ) {
        return;
      }

      const totalPages = Math.max( 1, Math.ceil( totalItems / ITEMS_PER_PAGE ) );

      if ( page < 1 ) {
        setCurrentPage( 1 );
        return;
      }

      if ( page > totalPages ) {
        setCurrentPage( totalPages );
        return;
      }

      setCurrentPage( page );
    },
    [ totalItems ],
  );

  const handleUpdatePrices = useCallback( async () => {
    if ( isUpdatingPrices ) {
      return;
    }

    setIsUpdatingPrices( true );
    try {
      const response = await fetch( "/api/Yugioh/updateCardPrices", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      } );

      if ( response.status === 401 ) {
        setIsAuthenticated( false );
        return;
      }

      if ( !response.ok ) {
        throw new Error( "Failed to update card prices." );
      }

      await refreshCollection();
      window.alert( "Prices updated successfully." );
    } catch ( error ) {
      console.error( "Error updating card prices:", error );
      window.alert( "An error occurred while updating prices. Please try again later." );
    } finally {
      setIsUpdatingPrices( false );
    }
  }, [ isUpdatingPrices, refreshCollection ] );

  const onUpdateCard = useCallback( async ( cardId, field, value ) => {
    try {
      const response = await fetch( "/api/Yugioh/updateCards", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify( { cardId, field, value } ),
      } );

      if ( response.status === 401 ) {
        setIsAuthenticated( false );
        return;
      }

      if ( !response.ok ) {
        throw new Error( "Failed to update card" );
      }

      const parsedValue = typeof value === "number" ? value : Number( value );

      setCards( ( current ) =>
        current.map( ( card ) => ( card?._id === cardId ? { ...card, [ field ]: parsedValue } : card ) ),
      );
    } catch ( error ) {
      console.error( "Error updating card:", error );
    }
  }, [] );

  const onDeleteCard = useCallback( async ( cardId ) => {
    try {
      const response = await fetch( "/api/Yugioh/deleteCards", {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify( { cardId } ),
      } );

      if ( response.status === 401 ) {
        setIsAuthenticated( false );
        return;
      }

      if ( !response.ok ) {
        throw new Error( "Failed to delete card" );
      }

      setCards( ( current ) => current.filter( ( card ) => card?._id !== cardId ) );
    } catch ( error ) {
      console.error( "Error deleting card:", error );
    }
  }, [] );

  const onDeleteAllCards = useCallback( async () => {
    if ( !hasCards ) {
      return;
    }

    const confirmDelete = window.confirm( "Delete every card in your collection?" );
    if ( !confirmDelete ) {
      return;
    }

    try {
      const response = await fetch( "/api/Yugioh/deleteAllCards", {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      } );

      if ( response.status === 401 ) {
        setIsAuthenticated( false );
        return;
      }

      if ( !response.ok ) {
        throw new Error( "Failed to delete all cards" );
      }

      setCards( [] );
      setCurrentPage( 1 );
    } catch ( error ) {
      console.error( "Error deleting all cards:", error );
    }
  }, [ hasCards ] );

  const renderViewToggle = () => (
    <div className="rounded-xl border border-white/20 bg-white/10 text-sm font-semibold text-white/80">
      <button
        type="button"
        onClick={ () => setViewMode( "grid" ) }
        className={ `flex items-center gap-2 px-4 py-2 transition ${ viewMode === "grid" ? "bg-purple-600 text-white" : "hover:bg-white/10"
          }` }
      >
        <Grid className="h-4 w-4" />
        Grid
      </button>
      <button
        type="button"
        onClick={ () => setViewMode( "table" ) }
        className={ `flex items-center gap-2 px-4 py-2 transition ${ viewMode === "table" ? "bg-purple-600 text-white" : "hover:bg-white/10"
          }` }
      >
        <List className="h-4 w-4" />
        Table
      </button>
    </div>
  );

  let content;

  if ( isLoading ) {
    content = (
      <div className="min-h-[50vh] flex-row items-center justify-center gap-3 text-white/80">
        <Loader2 className="h-12 w-12 animate-spin" />
        <p className="text-lg font-semibold">Loading your collection...</p>
      </div>
    );
  } else if ( !isAuthenticated ) {
    content = (
      <div className="glass mx-auto max-w-xl rounded-3xl p-10 text-center text-white">
        <h2 className="text-3xl font-bold text-shadow">Please log in</h2>
        <p className="mt-3 text-white/70">
          You need to be logged in to view your Yu-Gi-Oh! collection.
        </p>
        <button
          type="button"
          onClick={ () => router.push( "/login" ) }
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 font-semibold transition hover:from-purple-500 hover:to-blue-500"
        >
          Go to login
        </button>
      </div>
    );
  } else {
    content = (
      <div className="space-y-10 mx-auto">
        <header className="space-y-6 rounded-3xl border border-white/10 bg-black/30 p-8 backdrop-blur">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-shadow md:text-4xl">My Yu-Gi-Oh! Collection</h1>
            <p className="text-white/70">
              Track cards, monitor market prices, and manage your collection with powerful tools.
            </p>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid w-full gap-4 sm:grid-cols-3">
              <div className="glass rounded-2xl border border-white/10 p-5">
                <p className="text-xs uppercase tracking-wide text-white/60">Total cards</p>
                <p className="mt-2 text-3xl font-semibold text-white">{ totalOwnedCards }</p>
              </div>
              <div className="glass rounded-2xl border border-white/10 p-5">
                <p className="text-xs uppercase tracking-wide text-white/60">Distinct sets</p>
                <p className="mt-2 text-3xl font-semibold text-white">{ distinctSets }</p>
              </div>
              <div className="glass rounded-2xl border border-white/10 p-5">
                <p className="text-xs uppercase tracking-wide text-white/60">Estimated value</p>
                <p className="mt-2 text-3xl font-semibold text-emerald-400">{ formattedEstimatedValue }</p>
              </div>
            </div>

            <div className="flex justify-start lg:justify-end">{ renderViewToggle() }</div>
          </div>
        </header>

        <section className="space-y-6 rounded-3xl border border-white/10 p-6 backdrop-blur mx-auto">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50" />
              <input
                type="text"
                value={ searchValue }
                onChange={ handleSearchChange }
                placeholder="Search by name, set, rarity, or number..."
                className="w-full rounded-xl border border-white/10 bg-black/40 px-12 py-3 text-base text-white placeholder-white/50 focus:border-purple-500/60 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <CardFilter
                filters={ filters }
                updateFilters={ handleFilterChange }
                isModalOpen={ isFilterMenuOpen }
                setIsModalOpen={ setIsFilterMenuOpen }
              />
              { activeFilterBadges.length > 0 && (
                <button
                  type="button"
                  onClick={ handleClearFilters }
                  className="rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10"
                >
                  Clear filters
                </button>
              ) }
            </div>
          </div>

          { activeFilterBadges.length > 0 && (
            <div className="flex flex-wrap gap-2 text-sm text-white/70">
              { activeFilterBadges.map( ( badge ) => (
                <span key={ badge.id } className="glass rounded-full px-3 py-1">
                  { badge.label }
                </span>
              ) ) }
            </div>
          ) }

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={ handleUpdatePrices }
              disabled={ isUpdatingPrices }
              className={ `inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 font-semibold transition hover:from-blue-500 hover:to-purple-500 ${ isUpdatingPrices ? "opacity-70" : ""
                }` }
            >
              { isUpdatingPrices ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" /> }
              <span>{ isUpdatingPrices ? "Updating..." : "Refresh prices" }</span>
            </button>

            <DownloadYugiohCSVButton aggregatedData={ sortedCards } userCardList={ [] } />

            <button
              type="button"
              onClick={ onDeleteAllCards }
              disabled={ !hasCards }
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 font-semibold transition hover:from-red-500 hover:to-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete all</span>
            </button>
          </div>
        </section>

        <section className=" rounded-3xl  bg-fixed">
          { hasCards ? (
            <>
              { totalItems > ITEMS_PER_PAGE && (
                <YugiohPagination
                  currentPage={ currentPage }
                  itemsPerPage={ ITEMS_PER_PAGE }
                  totalItems={ totalItems }
                  handlePageClick={ handlePageClick }
                />
              ) }
              { viewMode === "grid" ? (
                <GridView aggregatedData={ gridCards } onDeleteCard={ onDeleteCard } onUpdateCard={ onUpdateCard } />
              ) : (
                <TableView
                  aggregatedData={ paginatedCards }
                  onDeleteCard={ onDeleteCard }
                  onUpdateCard={ onUpdateCard }
                  handleSortChange={ handleSortChange }
                />
              ) }


            </>
          ) : (
            <div className="py-16 text-center text-white/70">
              <p className="text-lg font-semibold">Your collection is empty.</p>
              <p className="mt-2">Add cards to start tracking your inventory and market prices.</p>
            </div>
          ) }
        </section>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>My Collection | Yu-Gi-Oh! Tracker</title>
      </Head>
      <SpeedInsights />
      <div className="w-full min-h-screen bg-cover bg-fixed text-white yugioh-bg bg-transprent">
        <div className=" mx-auto py-10 p-5">{ content }</div>
      </div>
    </>
  );
};

export default MyCollection;
