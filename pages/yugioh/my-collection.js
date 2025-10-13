import { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Grid, List, Loader2, TrendingUp, Trash2, Search } from "lucide-react";
import Notification from '@/components/Notification';
import DownloadYugiohCSVButton from "@/components/Yugioh/Buttons/DownloadYugiohCSVButton";
import CardFilter from "@/components/Yugioh/CardFilter";
import YugiohPagination from "@/components/Yugioh/YugiohPagination";
import { dispatchAuthStateChange } from "@/utils/authState";

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

const MyCollection = ( { initialCards = [], initialAuthState = false } ) => {
  const router = useRouter();
  const [ notification, setNotification ] = useState( { show: false, message: '' } );
  const [ cards, setCards ] = useState( () => ( Array.isArray( initialCards ) ? initialCards : [] ) );
  const [ viewMode, setViewMode ] = useState( "grid" );
  const [ isAuthenticated, setIsAuthenticated ] = useState( () => Boolean( initialAuthState ) );
  const [ isLoading, setIsLoading ] = useState( () => !initialAuthState );
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
    if ( initialAuthState ) {
      setIsAuthenticated( true );
      setCards( Array.isArray( initialCards ) ? initialCards : [] );
      setIsLoading( false );
      dispatchAuthStateChange( true );
      return;
    }

    let isActive = true;

    const initialize = async () => {
      setIsLoading( true );
      try {
        const data = await fetchCards();

        if ( !isActive ) {
          return;
        }

        setIsAuthenticated( true );
        setCards( data );
        dispatchAuthStateChange( true );
      } catch ( error ) {
        if ( isActive ) {
          console.error( "Error loading collection:", error );
          if ( error?.status === 401 ) {
            setIsAuthenticated( false );
            setCards( [] );
            dispatchAuthStateChange( false );
          } else {
            setIsAuthenticated( true );
            dispatchAuthStateChange( true );
          }
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
  }, [ fetchCards, initialAuthState, initialCards ] );

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
    <div className="flex-grow ml-5 w-full flex items-center justify-around md:justify-between space-x-4">
      <span className="inline-flex">
        <button
          type="button"
          onClick={ () => setViewMode( "grid" ) }
          className={ `p-2 inline-flex justify-center items-center transition ${ viewMode === "grid" ? "bg-purple-600 text-white" : "hover:bg-white/10"
            }` }
        >
          <Grid className="h-4 w-4" />
          Grid
        </button>
        <button
          type="button"
          onClick={ () => setViewMode( "table" ) }
          className={ `p-2 ml-2 inline-flex justify-center items-center transition ${ viewMode === "table" ? "bg-purple-600 text-white rounded-lg" : "hover:bg-white/10"
            }` }
        >
          <List className="h-4 w-4" />
          Table
        </button>
      </span>
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
      <div className="min-h-screen yugioh-bg bg-fixed bg-center bg-no-repeat items-center justify-items-center glass mx-auto w-full rounded-3xl p-10 text-center text-white">
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
      <div className="space-y-10 mx-auto min-h-screen yugioh-bg bg-fixed bg-center bg-no-repeat">
        <header className="space-y-6 rounded-3xl border border-white/10 bg-black/30 backdrop p-2">
          <div className="space-y-2 text-center sm:text-left text-pretty">
            <h1 className="text-3xl font-bold text-shadow md:text-4xl">My Yu-Gi-Oh! Collection</h1>
            <p className="text-white/70">
              Track cards, monitor market prices, and manage your collection with powerful tools.
            </p>
          </div>

          { hasCards && (
            <div className="max-w-full sm:w-fit mx-auto inline-flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-items-stretch">
              <div className="grid gap-4 sm:grid-cols-3">
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
            </div>
          ) }
        </header>

        { hasCards ? (
          <>
            <section className="space-y-6 border border-white/10 p-6 backdrop mx-auto">
              <div className="py-5 flex flex-col-reverse md:flex-row items-center justify-between">
                <div className="flex-shrink-0 mt-5 md:mt-0 max-w-7xl w-full md:w-auto grid sm:grid-flow-col grid-cols-1 sm:auto-cols-fr gap-4">
                  <Search className="pointer-events-none absolute mt-4 ml-5 h-5 w-5 text-white/50" />
                  <input
                    type="text"
                    value={ searchValue }
                    onChange={ handleSearchChange }
                    placeholder="Search by name, set, rarity, or number..."
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-12 py-3 text-base text-white placeholder-white/50 focus:border-purple-500/60 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  />
                </div>
              </div>

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

            <div className="w-full mx-auto">
              <div className="flex max-h-24 items-center gap-3">
                <div className="flex justify-start lg:justify-end">{ renderViewToggle() }</div>
                <CardFilter
                  filters={ filters }
                  updateFilters={ handleFilterChange }
                  isModalOpen={ isFilterMenuOpen }
                  setIsModalOpen={ setIsFilterMenuOpen }
                />
                { activeFilterBadges.length > 0 && (
                  <div className="flex flex-wrap gap-2 text-sm text-white/70">
                    { activeFilterBadges.map( ( badge ) => (
                      <span key={ badge.id } className="glass px-1 rounded-xl py-2">
                        { badge.label }
                      </span>
                    ) ) }
                  </div>
                ) }
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

              { totalItems > ITEMS_PER_PAGE && (
                <YugiohPagination
                  currentPage={ currentPage }
                  itemsPerPage={ ITEMS_PER_PAGE }
                  totalItems={ totalItems }
                  handlePageClick={ handlePageClick }
                />
              ) }

              { viewMode === "table" ? (
                <TableView
                  aggregatedData={ paginatedCards }
                  onDeleteCard={ onDeleteCard }
                  onUpdateCard={ onUpdateCard }
                  handleSortChange={ handleSortChange }
                />
              ) : (
                <GridView aggregatedData={ gridCards } onDeleteCard={ onDeleteCard } onUpdateCard={ onUpdateCard } />
              ) }
            </div>
          </>
        ) : (
          <>
            <div className="min-h-screen py-16 text-center text-white/70">


              <div className="mb-10 flex max-h-24 h-fit items-center gap-3">
                <div className="flex justify-start lg:justify-end">{ renderViewToggle() }</div>
                <CardFilter
                  filters={ filters }
                  updateFilters={ handleFilterChange }
                  isModalOpen={ isFilterMenuOpen }
                  setIsModalOpen={ setIsFilterMenuOpen }
                />
                { activeFilterBadges.length > 0 && (
                  <div className="flex flex-wrap gap-2 text-sm text-white/70">
                    { activeFilterBadges.map( ( badge ) => (
                      <span key={ badge.id } className="glass rounded-full px-3 py-1">
                        { badge.label }
                      </span>
                    ) ) }
                  </div>
                ) }
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
              <p className="text-lg font-semibold">Your collection is empty.</p>
              <p className="mt-2">Add cards to start tracking your inventory and market prices.</p>
            </div>
          </>
        ) }

        <Notification
          show={ notification.show }
          setShow={ ( show ) => setNotification( ( prev ) => ( { ...prev, show } ) ) }
          message={ notification.message }
        />
      </div>

      <SpeedInsights />
    </>
  );

};

export async function getServerSideProps( { req } ) {
  const hasAuthCookie = Boolean( req?.cookies?.token );
  const hasAuthHeader = Boolean( req?.headers?.authorization );
  const authenticatedHeader = req?.headers?.[ "x-authenticated-user" ];
  const authenticatedHeaderValue = Array.isArray( authenticatedHeader ) ? authenticatedHeader[ 0 ] : authenticatedHeader;
  const hasAuthenticatedHeader = Boolean( authenticatedHeaderValue );

  if ( !hasAuthCookie && !hasAuthHeader && !hasAuthenticatedHeader ) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  const forwardedProto = req?.headers?.[ "x-forwarded-proto" ];
  const forwardedHost = req?.headers?.[ "x-forwarded-host" ];
  const host = forwardedHost || req?.headers?.host;

  if ( !host ) {
    return {
      props: {
        initialCards: [],
        initialAuthState: false,
      },
    };
  }

  const protocol = Array.isArray( forwardedProto ) ? forwardedProto[ 0 ] : forwardedProto;
  const baseUrl = `${ protocol || "http" }://${ host }`;

  try {
    const response = await fetch( `${ baseUrl }/api/Yugioh/my-collection`, {
      method: "GET",
      headers: {
        cookie: req?.headers?.cookie ?? "",
        ...( hasAuthHeader ? { authorization: req.headers.authorization } : {} ),
        ...( hasAuthenticatedHeader ? { "x-authenticated-user": authenticatedHeaderValue } : {} ),
      },
      cache: "no-store",
    } );

    if ( response.status === 401 ) {
      return {
        redirect: {
          destination: "/login",
          permanent: false,
        },
      };
    }

    if ( !response.ok ) {
      throw new Error( `Failed to load collection: ${ response.status }` );
    }

    const data = await response.json();

    return {
      props: {
        initialCards: Array.isArray( data ) ? data : [],
        initialAuthState: true,
      },
    };
  } catch ( error ) {
    console.error( "getServerSideProps my-collection error:", error );
    return {
      props: {
        initialCards: [],
        initialAuthState: false,
      },
    };
  }
}

export default MyCollection;
