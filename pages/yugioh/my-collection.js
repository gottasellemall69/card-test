import { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Filter, Grid, List, Loader2, TrendingUp, Trash2, Search } from "lucide-react";
import Notification from '@/components/Notification';
import DownloadYugiohCSVButton from "@/components/Yugioh/Buttons/DownloadYugiohCSVButton";
import CardFilter from "@/components/Yugioh/CardFilter";
import FilterPanel from "@/components/Yugioh/FilterPanel";
import YugiohPagination from "@/components/Yugioh/YugiohPagination";
import { dispatchAuthStateChange } from "@/utils/authState";
import jwt from "jsonwebtoken";
import { getTokenFromRequest } from "@/middleware/authenticate";

const TableView = dynamic( () => import( "@/components/Yugioh/TableView" ), {
  ssr: false,
  loading: () => (
    <div className="h-screen mx-auto justify-center items-center py-12 text-center text-lg font-semibold text-white/80">
      Loading table...
    </div>
  ),
} );

const GridView = dynamic( () => import( "@/components/Yugioh/GridView" ), {
  ssr: false,
  loading: () => (
    <div className="h-screen mx-auto justify-center items-center py-12 text-center text-lg font-semibold text-white/80">
      Loading cards...
    </div>
  ),
} );

const ITEMS_PER_PAGE = 12;
const DEFAULT_FILTERS = { rarity: [], condition: [], printing: [] };
const DEFAULT_SORT = { key: "number", direction: "ascending" };

const MyCollection = ( { initialAuthState = false } ) => {
  const router = useRouter();
  const [ notification, setNotification ] = useState( { show: false, message: '' } );
  const [ cards, setCards ] = useState( [] );
  const [ viewMode, setViewMode ] = useState( "grid" );
  const [ isAuthenticated, setIsAuthenticated ] = useState( () => Boolean( initialAuthState ) );
  const [ isLoading, setIsLoading ] = useState( true );
  const [ isUpdatingPrices, setIsUpdatingPrices ] = useState( false );
  const [ searchValue, setSearchValue ] = useState( "" );
  const [ filters, setFilters ] = useState( () => ( { ...DEFAULT_FILTERS } ) );
  const [ sortConfig, setSortConfig ] = useState( () => ( { ...DEFAULT_SORT } ) );
  const [ isFilterMenuOpen, setIsFilterMenuOpen ] = useState( false );
  const [ isDesktopFilterOpen, setIsDesktopFilterOpen ] = useState( true );
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
        const data = await fetchCards();

        if ( !isActive ) {
          return;
        }

        setCards( data );
        setIsAuthenticated( true );
        dispatchAuthStateChange( true );
      } catch ( error ) {
        if ( !isActive ) {
          return;
        }

        console.error( "Error loading collection:", error );
        if ( error?.status === 401 ) {
          setIsAuthenticated( false );
          setCards( [] );
          dispatchAuthStateChange( false );
        } else {
          setIsAuthenticated( true );
          setNotification( ( prev ) => ( {
            ...prev,
            show: true,
            message: "Failed to load your collection. Please try again.",
          } ) );
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
        dispatchAuthStateChange( false );
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

  const handleSearchChange = useCallback( async ( event ) => {
    setSearchValue( event.target.value );
    setCurrentPage( 1 );
  }, [] );

  const handleFilterChange = useCallback( async ( filterName, selectedOptions ) => {
    setFilters( ( prev ) => ( {
      ...prev,
      [ filterName ]: selectedOptions,
    } ) );
    setCurrentPage( 1 );
  }, [] );

  const handleClearFilters = useCallback( async () => {
    setFilters( { ...DEFAULT_FILTERS } );
    setCurrentPage( 1 );
  }, [] );

  const toggleDesktopFilters = useCallback( () => {
    setIsDesktopFilterOpen( ( prev ) => !prev );
  }, [] );

  const handleSortChange = useCallback( async ( key, direction ) => {
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
        setNotification( { show: true, message: 'Card deleted successfully!' } );
        throw new Error( "Failed to update card prices." );
      }

      await refreshCollection();
      window.alert( "Prices updated successfully." );
    } catch ( error ) {
      console.error( "Error updating card prices:", error );
      setNotification( { show: true, message: 'Failed to update card prices! Please try again!' } );
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
        setNotification( { show: true, message: 'Failed to delete card!' } );
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
    <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 text-sm shadow-sm">
      <button
        type="button"
        onClick={ () => setViewMode( "grid" ) }
        className={ `inline-flex items-center gap-2 rounded-full px-4 py-2 font-semibold transition ${ viewMode === "grid"
          ? "bg-indigo-500/80 text-white"
          : "text-white/70 hover:text-white"
          }` }
      >
        <Grid className="h-4 w-4" />
        Grid
      </button>
      <button
        type="button"
        onClick={ () => setViewMode( "table" ) }
        className={ `inline-flex items-center gap-2 rounded-full px-4 py-2 font-semibold transition ${ viewMode === "table"
          ? "bg-indigo-500/80 text-white"
          : "text-white/70 hover:text-white"
          }` }
      >
        <List className="h-4 w-4" />
        Table
      </button>
    </div>
  );


  if ( isLoading ) {
    return (
      <div className="flex-col min-h-screen yugioh-bg bg-fixed bg-center bg-no-repeat items-center justify-center gap-3 text-white/80">
        <Loader2 className="h-12 w-12 animate-spin" />
        <p className="text-lg font-semibold">Loading your collection...</p>
      </div>
    );
  }

  if ( !isAuthenticated ) {
    return (
      <div className="flex-col min-h-screen yugioh-bg bg-fixed bg-center bg-no-repeat items-center justify-items-center glass mx-auto w-full rounded-3xl p-10 text-center text-white">
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
  }

  return (
    <>
      <Head>
        <title>My Yu-Gi-Oh! Collection</title>
        <meta name="description" content="Track cards, monitor market prices, and manage your collection with powerful tools." />
        <meta name="keywords" content="javascript,nextjs,price-tracker,trading-card-game,tailwindcss" />
        <meta charSet="UTF-8" />
      </Head>
      <div className="min-h-screen yugioh-bg bg-fixed bg-center bg-no-repeat text-white">
        <main
          className={ `mx-auto w-full px-4 pb-20 pt-10 sm:px-2 lg:px-4 ${ isDesktopFilterOpen ? "lg:pr-80" : "" }` }
        >

          <header className="rounded-xl border border-white/10 bg-black/40 p-4 shadow-2xl">
            <div className="flex flex-wrap flex-col lg:flex-row lg:items-end lg:justify-between">
              <div className="text-center lg:text-left">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/50">Collection</p>
                <h1 className="mt-4 text-3xl font-bold md:text-4xl">My Yu-Gi-Oh! Collection</h1>
                <p className="mt-3 text-white/70">
                  Track cards, monitor market prices, and manage your collection with powerful tools.
                </p>
              </div>
              { hasCards && (
                <div className="grid gap-2 text-left sm:grid-cols-3 mt-3">
                  <div className="bg-white/5">
                    <p className="text-wrap text-xs uppercase tracking-wide text-white/60">Total cards</p>
                    <p className="mt-2 text-3xl font-semibold text-white">{ totalOwnedCards }</p>
                  </div>
                  <div className="bg-white/5">
                    <p className="text-wrap text-xs uppercase tracking-wide text-white/60">Distinct sets</p>
                    <p className="mt-2 text-3xl font-semibold text-white">{ distinctSets }</p>
                  </div>
                  <div className="bg-white/5">
                    <p className="text-wrap text-xs uppercase tracking-wide text-white/60">Estimated value</p>
                    <p className="mt-2 text-3xl font-semibold text-emerald-400">{ formattedEstimatedValue }</p>
                  </div>
                </div>
              ) }
            </div>
          </header>

          <section className="pt-10">
            <div className="space-y-8">
              <div className="space-y-8">
                <div className="rounded-sm border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
                      <span className="font-medium uppercase tracking-wide text-white/50">View</span>
                      { renderViewToggle() }
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <button
                        type="button"
                        onClick={ handleUpdatePrices }
                        disabled={ isUpdatingPrices }
                        className={ `inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 font-semibold transition hover:from-blue-500 hover:to-purple-500 ${ isUpdatingPrices ? "opacity-70" : ""
                          }` }
                      >
                        { isUpdatingPrices ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" /> }
                        <span>{ isUpdatingPrices ? "Updating..." : "Refresh prices" }</span>
                      </button>
                      <DownloadYugiohCSVButton
                        aggregatedData={ sortedCards }
                        className="inline-flex items-center gap-2"
                      />
                      <button
                        type="button"
                        onClick={ onDeleteAllCards }
                        disabled={ !hasCards }
                        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 font-semibold text-white transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete all</span>
                      </button>
                      <div className="lg:hidden">
                        <CardFilter
                          filters={ filters }
                          updateFilters={ handleFilterChange }
                          open={ isFilterMenuOpen }
                          setOpen={ setIsFilterMenuOpen }
                          title="Filter collection"
                          renderTrigger={ ( { openFilters } ) => (
                            <button
                              type="button"
                              onClick={ openFilters }
                              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 font-semibold text-white transition hover:border-white/40"
                            >
                              <Filter size={ 16 } />
                              Filters
                              { activeFilterBadges.length > 0 && (
                                <span className="ml-2 rounded-full bg-indigo-500/40 px-2 py-0.5 text-xs font-semibold text-indigo-50">
                                  { activeFilterBadges.length }
                                </span>
                              ) }
                            </button>
                          ) }
                        />
                      </div>
                    </div>
                    <div className="hidden pb-4 lg:flex lg:justify-end">
                      <button
                        type="button"
                        onClick={ toggleDesktopFilters }
                        aria-expanded={ isDesktopFilterOpen }
                        aria-controls="desktop-filter-panel"
                        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40"
                      >
                        <Filter size={ 16 } />
                        { isDesktopFilterOpen ? "Hide Filters" : "Show Filters" }
                        { activeFilterBadges.length > 0 && (
                          <span className="ml-2 rounded-full bg-indigo-500/40 px-2 py-0.5 text-xs font-semibold text-indigo-50">
                            { activeFilterBadges.length }
                          </span>
                        ) }
                      </button>
                    </div>
                  </div>
                  <div className="mt-6">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-white/50" />
                      <input
                        type="text"
                        value={ searchValue }
                        onChange={ handleSearchChange }
                        placeholder="Search by name, set, rarity, or number..."
                        className="w-full rounded-2xl border border-white/10 bg-black/60 px-12 py-3 text-base text-white placeholder-white/50 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    { activeFilterBadges.length > 0 && (
                      <div className="flex flex-wrap gap-2 text-sm text-white/80">
                        { activeFilterBadges.map( ( badge ) => (
                          <span key={ badge.id } className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1">
                            { badge.label }
                          </span>
                        ) ) }
                      </div>
                    ) }
                    { activeFilterBadges.length > 0 && (
                      <button
                        type="button"
                        onClick={ handleClearFilters }
                        className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
                      >
                        Clear filters
                      </button>
                    ) }
                  </div>
                </div>

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
                    <div className="rounded-3xl border border-white/10 bg-black/40 p-4 shadow-2xl">
                      { viewMode === "table" ? (
                        <TableView
                          aggregatedData={ paginatedCards }
                          onDeleteCard={ onDeleteCard }
                          onUpdateCard={ onUpdateCard }
                          handleSortChange={ handleSortChange }
                        />
                      ) : (
                        <GridView
                          aggregatedData={ gridCards }
                          onDeleteCard={ onDeleteCard }
                          onUpdateCard={ onUpdateCard }
                        />
                      ) }
                    </div>
                    { totalItems > ITEMS_PER_PAGE && (
                      <YugiohPagination
                        currentPage={ currentPage }
                        itemsPerPage={ ITEMS_PER_PAGE }
                        totalItems={ totalItems }
                        handlePageClick={ handlePageClick }
                      />
                    ) }
                  </>
                ) : (
                  <div className="min-h-screen rounded-3xl border border-dashed border-white/20 bg-black/30 p-12 text-center text-white/70">
                    <p className="text-lg font-semibold">Your collection is empty.</p>
                    <p className="mt-2">Add cards to start tracking your inventory and market prices.</p>
                  </div>
                ) }
              </div>
            </div>
          </section>

          <Notification
            show={ notification.show }
            setShow={ ( show ) => setNotification( ( prev ) => ( { ...prev, show } ) ) }
            message={ notification.message }
          />
        </main>
        { isDesktopFilterOpen && (
          <aside
            id="desktop-filter-panel"
            className="hidden lg:fixed lg:inset-y-0 lg:right-0 lg:z-40 lg:flex lg:w-72"
          >
            <div className="flex h-full w-full flex-col border-l border-white/10 bg-black/40 px-2 py-8 backdrop-blur">
              <FilterPanel
                className="h-full overflow-y-auto rounded-2xl border-white/10 bg-black/60 text-white shadow-none"
                filters={ filters }
                updateFilters={ handleFilterChange }
                clearFilters={ handleClearFilters }
              />
            </div>
          </aside>
        ) }
      </div>

      <SpeedInsights />
    </>
  );

};

export async function getServerSideProps( { req } ) {
  const authenticatedHeader = req?.headers?.[ "x-authenticated-user" ];
  const authenticatedHeaderValue = Array.isArray( authenticatedHeader ) ? authenticatedHeader[ 0 ] : authenticatedHeader;
  let decodedUser = null;

  if ( authenticatedHeaderValue ) {
    try {
      const parsed = JSON.parse( authenticatedHeaderValue );
      if ( parsed && typeof parsed === "object" && parsed.username ) {
        decodedUser = parsed;
      }
    } catch ( error ) {
      console.warn( "Failed to parse x-authenticated-user header:", error );
    }
  }

  if ( !decodedUser ) {
    const token = getTokenFromRequest( req );

    if ( !token ) {
      return {
        redirect: {
          destination: "/login",
          permanent: false,
        },
      };
    }

    try {
      decodedUser = jwt.verify( token, process.env.JWT_SECRET );
    } catch ( error ) {
      console.error( "Failed to verify authentication token:", error );
      return {
        redirect: {
          destination: "/login",
          permanent: false,
        },
      };
    }
  }

  return {
    props: {
      initialAuthState: Boolean( decodedUser ),
    },
  };
}

export default MyCollection;
