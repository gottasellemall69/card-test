"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Suspense } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import dynamic from "next/dynamic";

import DownloadYugiohCSVButton from "@/components/Yugioh/Buttons/DownloadYugiohCSVButton";
import CardFilter from "@/components/Yugioh/CardFilter";
import YugiohPagination from "@/components/Yugioh/YugiohPagination";
import YugiohSearchBar from "@/components/Yugioh/YugiohSearchBar";
import { SpeedInsights } from "@vercel/speed-insights/next";

const TableView = dynamic( () => import( "@/components/Yugioh/TableView" ), { ssr: false } );
const GridView = dynamic(
  () => import( "@/components/Yugioh/GridView" ),
  {
    ssr: false,
    loading: () => <div className="w-full max-w-7xl mx-auto text-3xl font-black">Loading...</div>,
  }
);

const MyCollection = ( { error } ) => {
  const router = useRouter();
  const [ isAuthenticated, setIsAuthenticated ] = useState( false );
  const [ token, setToken ] = useState( null );
  const [ isUpdatingPrices, setIsUpdatingPrices ] = useState( false );
  const [ searchTerm, setSearchTerm ] = useState( "" );
  const [ isLoading, setIsLoading ] = useState( false );
  const [ initialData, setInitialData ] = useState( [] );
  const [ aggregatedData, setAggregatedData ] = useState( initialData || [] );

  const [ filters, setFilters ] = useState( { rarity: [], condition: [] } );
  const [ sortConfig, setSortConfig ] = useState( { key: "number", direction: "ascending" } );
  const [ view, setView ] = useState( "grid" );
  const [ isFilterMenuOpen, setIsFilterMenuOpen ] = useState( false );
  const [ currentPage, setCurrentPage ] = useState( 1 );
  const [ itemsPerPage ] = useState( 20 );
  const [ subtotalMarketPrice, setSubtotalMarketPrice ] = useState( 0 );

  // Effect to check authentication
  useEffect( () => {
    const validateAuth = async () => {
      const storedToken = localStorage.getItem( "token" );
      if ( !storedToken ) {
        router.push( "/login" );
        return;
      }
      setToken( storedToken );
      setIsAuthenticated( true );
    };
    validateAuth();
  }, [ router ] );

  const applyFilters = useCallback(
    data => {
      if ( !filters.rarity.length && !filters.condition.length ) return data;
      return data.filter( card => {
        return (
          ( !filters.rarity.length || filters.rarity.includes( card.rarity ) ) &&
          ( !filters.condition.length || filters.condition.includes( card.condition ) )
        );
      } );
    },
    [ filters ]
  );

  const applySorting = useCallback(
    data => {
      if ( !sortConfig.key ) return data;
      return [ ...data ].sort( ( a, b ) => {
        if ( a[ sortConfig.key ] < b[ sortConfig.key ] ) {
          return sortConfig.direction === "descending" ? -1 : 1;
        }
        if ( a[ sortConfig.key ] > b[ sortConfig.key ] ) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      } );
    },
    [ sortConfig ]
  );

  const fetchData = useCallback( async () => {
    if ( !token ) return;
    setIsLoading( true );
    try {
      const response = await fetch( `/api/Yugioh/my-collection`, {
        method: "GET",

        headers: {
          Authorization: `Bearer ${ token }`,
        },
      } );
      if ( !response.ok ) {
        throw new Error( "Failed to fetch aggregated data" );
      }
      const data = await response.json();
      setInitialData( data );
      const filteredData = applyFilters( data );
      const sortedData = applySorting( filteredData );
      setAggregatedData( sortedData );
    } catch ( error ) {
      console.error( "Error fetching aggregated data:", error );
    } finally {
      setIsLoading( false );
    }
  }, [ applyFilters, applySorting, token ] );

  useEffect( () => {
    if ( isAuthenticated ) {
      fetchData();
    }
  }, [ isAuthenticated, fetchData ] );

  const handleSearch = useCallback(
    async searchTerm => {
      setSearchTerm( searchTerm );
      setCurrentPage( 1 );
      if ( searchTerm === "" ) {
        setAggregatedData( initialData );
      } else {
        const filteredData = initialData.filter( card =>
          [ "productName", "setName", "number", "rarity", "printing", "condition" ].some( key =>
            card[ key ]?.toLowerCase().includes( searchTerm.toLowerCase() )
          )
        );
        setAggregatedData( filteredData );
      }
    },
    [ initialData ]
  );

  const handleFilterChange = useCallback( ( filterName, selectedOptions ) => {
    setFilters( prev => ( { ...prev, [ filterName ]: selectedOptions } ) );
    setCurrentPage( 1 );

    // apply filters to the existing initialData
    setAggregatedData(
      applySorting(
        applyFilters( initialData )
      )
    );
  }, [ initialData, applyFilters, applySorting ] );

  const handleSortChange = useCallback( sortKey => {
    setSortConfig( prev => ( {
      key: sortKey,
      direction: prev.key === sortKey && prev.direction === "ascending" ? "descending" : "ascending",
    } ) );
  }, [] );

  const handlePageClick = useCallback(
    page => {
      const totalPages = Math.ceil( aggregatedData.length / itemsPerPage );
      if ( page < 1 || page > totalPages ) return;
      setCurrentPage( page );
    },
    [ aggregatedData, itemsPerPage ]
  );

  const toggleFilterMenu = useCallback( () => setIsFilterMenuOpen( prev => !prev ), [] );

  useEffect( () => {
    if ( Array.isArray( aggregatedData ) && aggregatedData.length ) {
      const subtotal = aggregatedData.reduce(
        ( sum, card ) => sum + ( card.marketPrice || 0 ) * ( card.quantity || 0 ),
        0
      );
      setSubtotalMarketPrice( subtotal.toFixed( 2 ) );
    }
  }, [ aggregatedData ] );

  const handleUpdatePrices = useCallback( async () => {
    if ( !token ) {
      alert( "You must be logged in to update prices." );
      return;
    }
    setIsUpdatingPrices( true );
    try {
      const response = await fetch( `/api/Yugioh/updateCardPrices`, {
        method: "POST",

        headers: {
          Authorization: `Bearer ${ token }`,
          "Content-Type": "application/json",
        },
      } );
      if ( !response.ok ) throw new Error( "Failed to update card prices." );
      await response.json();
      alert( "Prices updated successfully." );
      await fetchData();
    } catch ( error ) {
      console.error( "Error updating card prices:", error );
      alert( "An error occurred while updating prices. Please try again later." );
    } finally {
      setIsUpdatingPrices( false );
    }
  }, [ token, fetchData ] );

  const onUpdateCard = useCallback( async ( cardId, field, value ) => {
    try {
      if ( !token ) {
        alert( "You must be logged in to update cards." );
        return;
      }
      // send update
      const response = await fetch( `/api/Yugioh/updateCards`, {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ token }`,
        },
        body: JSON.stringify( { cardId, field, value } ),
      } );
      if ( !response.ok ) throw new Error( "Failed to update card" );

      // OPTIMISTICALLY update local state without re-fetch
      setAggregatedData( current =>
        current.map( card =>
          card._id === cardId ? { ...card, [ field ]: value } : card
        )
      );
      // also update initialData so filters/search remain in sync
      setInitialData( current =>
        current.map( card =>
          card._id === cardId ? { ...card, [ field ]: value } : card
        )
      );
    } catch ( error ) {
      console.error( "Error updating card:", error );
    }
  }, [ token ] );

  const onDeleteCard = useCallback( async ( cardId ) => {
    try {
      if ( !token ) {
        alert( "You must be logged in to delete cards." );
        return;
      }
      const response = await fetch( `/api/Yugioh/deleteCards`, {
        method: "DELETE",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ token }`,
        },
        body: JSON.stringify( { cardId } ),
      } );
      if ( !response.ok ) throw new Error( "Failed to delete card" );

      // remove from local state
      setAggregatedData( current => current.filter( card => card._id !== cardId ) );
      setInitialData( current => current.filter( card => card._id !== cardId ) );
    } catch ( error ) {
      console.error( "Error deleting card:", error );
    }
  }, [ token ] );

  const onDeleteAllCards = useCallback( async () => {
    if ( !token ) {
      alert( "You must be logged in to delete all cards." );
      return;
    }
    try {
      const response = await fetch( `/api/Yugioh/deleteAllCards`, {
        method: "DELETE",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ token }`,
        },
      } );
      if ( !response.ok ) throw new Error( "Failed to delete all cards" );
      await fetchData();
    } catch ( error ) {
      console.error( "Error deleting all cards:", error );
    }
  }, [ token, fetchData ] );

  const paginatedData = useMemo( () => {
    const start = ( currentPage - 1 ) * itemsPerPage;
    return aggregatedData.slice( start, start + itemsPerPage );
  }, [ aggregatedData, currentPage, itemsPerPage ] );

  if ( !isAuthenticated || isLoading ) {
    return (
      <div className="w-full text-center mt-10 text-xl text-white">
        Loading...
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>My Collection</title>
        <meta name="description" content="Enter list of TCG cards, get data back" />
        <meta name="keywords" content="javascript,nextjs,price-tracker,trading-card-game,tailwindcss" />
        <meta charSet="UTF-8" />
      </Head>

      <header className="bg-gradient-to-r from-purple-900/80 to-slate-900/80 rounded-lg shadow-xl p-6 mb-8 glass">
        <h1 className="text-4xl font-bold text-white mb-4">My Collection</h1>
        <div className="flex items-center">
          <span className="text-xl font-semibold text-white">Total Collection Value:</span>
          <span className="text-2xl font-bold text-emerald-400">${ subtotalMarketPrice }</span>
        </div>
      </header>
      <div className="mx-auto flex flex-wrap gap-4 mb-6 px-2 py-2 glass max-w-7xl z-0">

        <button
          type='button'
          onClick={ () => setView( 'grid' ) }
          className={ `float-start inline-flex items-center px-2 py-2 rounded-lg transition-colors ${ view === 'grid' ? 'bg-black text-white' : 'bg-white text-black hover:bg-black/80 hover:text-white/80' }` }
          id="grid">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="fill-current w-4 h-4 mr-2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          <span>Grid View</span>
        </button>
        <button
          type='button'
          onClick={ () => setView( 'table' ) }
          className={ `float-start inline-flex items-center px-2 py-2 rounded-lg transition-colors ${ view === 'table' ? 'bg-black text-white' : 'bg-white text-black hover:bg-black/80 hover:text-white/80' }` }
          id="table">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="fill-current w-4 h-4 mr-2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
          <span>Table View</span>
        </button>

        <button
          type='button'
          onClick={ handleUpdatePrices }
          disabled={ isUpdatingPrices }
          className={ `float-start bg-white text-black font-bold m-1 px-2 py-2 text-nowrap rounded-lg border border-zinc-400 hover:bg-black hover:text-white ${ isUpdatingPrices ? 'bg-gray-500 cursor-not-allowed' : 'bg-primary hover:bg-primary/80'
            }` }
        >
          { isUpdatingPrices ? 'Updating Prices...' : 'Update Prices' }
        </button>
        { isUpdatingPrices && (
          <p className="text-sm text-white-600 mt-2">
            Prices are being updated. This may take a few minutes...
          </p>
        ) }
        <DownloadYugiohCSVButton
          type="button"
          aggregatedData={ aggregatedData }
          userCardList={ [] }
        />

        <button
          type="button"
          disabled={ false }
          onClick={ onDeleteAllCards }
          className="float-start inline-flex flex-wrap items-center px-2 py-2 m-1 rounded-lg bg-red-800 text-white hover:text-black hover:bg-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          Delete All Cards
        </button>

      </div>

      <div className="mx-auto text-black w-full max-w-7xl z-0">
        <YugiohSearchBar
          searchTerm={ searchTerm }
          onSearch={ handleSearch } />
      </div>
      { !isLoading && isAuthenticated && view === "grid" ? (
        <main>
          <div className="w-fit mx-auto mt-12">
            <YugiohPagination
              currentPage={ currentPage }
              itemsPerPage={ itemsPerPage }
              totalItems={ aggregatedData.length }
              handlePageClick={ handlePageClick }
            />
          </div>
          <div className="w-full mx-auto mb-24 min-h-screen z-0">
            <CardFilter
              type='button'
              className="z-90 relative min-h-svh"
              updateFilters={ handleFilterChange }
              filters={ filters }
              isModalOpen={ isFilterMenuOpen }
              setIsModalOpen={ setIsFilterMenuOpen }
            />
            <GridView
              aggregatedData={ paginatedData.map( card => ( {
                ...card,
                set_name: card.setName,
                set_code: card.number,
                rarity: card.rarity,
                edition: card.printing || "Unknown Edition",
                source: "collection"
              } ) ) }
              onDeleteCard={ onDeleteCard }
              onUpdateCard={ onUpdateCard }
              setAggregatedData={ setAggregatedData }
            />

          </div>
          <div className="w-fit mx-auto mb-12 z-0">
            <YugiohPagination
              currentPage={ currentPage }
              itemsPerPage={ itemsPerPage }
              totalItems={ aggregatedData.length }
              handlePageClick={ handlePageClick }
            />
          </div>
        </main>
      ) : (
        <div className="w-full max-w-7xl mx-auto">
          <Suspense fallback={ <p>Loading...</p> }>
            <TableView
              handleSortChange={ handleSortChange }
              onUpdateCard={ onUpdateCard }
              aggregatedData={ aggregatedData.map( card => ( {
                ...card,
                setName: card.setName,
                rarity: card.rarity,
                edition: card.printing,
              } ) ) }
              onDeleteCard={ onDeleteCard }
            />
          </Suspense>
        </div>
      ) }

      <SpeedInsights />
    </>
  );
};

export default MyCollection;