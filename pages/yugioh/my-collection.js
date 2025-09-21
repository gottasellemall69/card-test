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
import { Menu, X, Search, Grid, List, Filter, Download, Plus, TrendingUp, Star, ChevronDown } from 'lucide-react';

const TableView = dynamic( () => import( "@/components/Yugioh/TableView" ), { ssr: false } );
const GridView = dynamic(
  () => import( "@/components/Yugioh/GridView" ),
  {
    ssr: false,
    loading: () => <div className="w-full max-w-max mx-auto text-3xl font-black">Loading...</div>,
  }
);

const MyCollection = () => {
  const router = useRouter();
  const [ isSidebarOpen, setIsSidebarOpen ] = useState( false );
  const [ viewMode, setViewMode ] = useState( 'grid' );
  const [ isAuthenticated, setIsAuthenticated ] = useState( false );
  const [ isUpdatingPrices, setIsUpdatingPrices ] = useState( false );
  const [ searchTerm, setSearchTerm ] = useState( "" );
  const [ isLoading, setIsLoading ] = useState( false );
  const [ initialData, setInitialData ] = useState( [] );
  const [ aggregatedData, setAggregatedData ] = useState( [] );
  const [ filters, setFilters ] = useState( { rarity: [], condition: [], printing: [] } );
  const [ sortConfig, setSortConfig ] = useState( { key: 'number', direction: "ascending" } );
  const [ isFilterMenuOpen, setIsFilterMenuOpen ] = useState( false );
  const [ currentPage, setCurrentPage ] = useState( 1 );
  const [ itemsPerPage ] = useState( 20 );
  const [ subtotalMarketPrice, setSubtotalMarketPrice ] = useState( 0 );

  const toggleSidebar = () => setIsSidebarOpen( !isSidebarOpen );

  // Effect to check authentication
  // Effect to check authentication
  useMemo( () => {
    const validateAuth = async () => {
      try {
        const response = await fetch( "/api/auth/validate", {
          method: "GET",
          credentials: "include", // send cookies
        } );

        if ( response.ok ) {
          setIsAuthenticated( true );
        } else {
          setIsAuthenticated( false );
        }
      } catch ( err ) {
        setIsAuthenticated( false );
      }
    };

    validateAuth();
  }, [ router ] );


  const applyFilters = useCallback(
    data => {
      if ( !filters.rarity.length && !filters.condition.length && !filters.printing.length ) return data;
      return data.filter( card => {
        return (
          ( !filters.rarity.length || filters.rarity.includes( card.rarity ) ) &&
          ( !filters.condition.length || filters.condition.includes( card.condition ) ) &&
          ( !filters.printing.length || filters.printing.includes( card.printing ) )
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
    setIsLoading( true );
    try {
      const response = await fetch( `/api/Yugioh/my-collection`, {
        method: "GET",
        credentials: "include", // send cookies
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
  }, [ applyFilters, applySorting ] );


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
    setIsUpdatingPrices( true );
    try {
      const response = await fetch( `/api/Yugioh/updateCardPrices`, {
        method: "POST",
        credentials: "include",
        headers: {
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
  }, [ fetchData ] );


  const onUpdateCard = useCallback( async ( cardId, field, value ) => {
    try {
      const response = await fetch( `/api/Yugioh/updateCards`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify( { cardId, field, value } ),
      } );

      if ( !response.ok ) throw new Error( "Failed to update card" );

      setAggregatedData( ( current ) =>
        current.map( ( card ) =>
          card._id === cardId ? { ...card, [ field ]: value } : card
        )
      );
      setInitialData( ( current ) =>
        current.map( ( card ) =>
          card._id === cardId ? { ...card, [ field ]: value } : card
        )
      );
    } catch ( error ) {
      console.error( "Error updating card:", error );
    }
  }, [] );


  const onDeleteCard = useCallback( async ( cardId ) => {
    try {
      const response = await fetch( `/api/Yugioh/deleteCards`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify( { cardId } ),
      } );

      if ( !response.ok ) throw new Error( "Failed to delete card" );

      setAggregatedData( ( current ) => current.filter( ( card ) => card._id !== cardId ) );
      setInitialData( ( current ) => current.filter( ( card ) => card._id !== cardId ) );
    } catch ( error ) {
      console.error( "Error deleting card:", error );
    }
  }, [] );


  const onDeleteAllCards = useCallback( async () => {
    try {
      const response = await fetch( `/api/Yugioh/deleteAllCards`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      } );

      if ( !response.ok ) throw new Error( "Failed to delete all cards" );
      await fetchData();
    } catch ( error ) {
      console.error( "Error deleting all cards:", error );
    }
  }, [ fetchData ] );


  const paginatedData = useMemo( () => {
    const start = ( currentPage - 1 ) * itemsPerPage;
    return aggregatedData.slice( start, start + itemsPerPage );
  }, [ aggregatedData, currentPage, itemsPerPage ] );

  if ( !isAuthenticated && isLoading ) {
    return (
      <div className="w-full text-center mt-10 text-xl text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen yugioh-bg text-white">
      <Head>
        <title>Card Price App - My Collection</title>
        <meta name="description" content="Manage your Yu-Gi-Oh card collection with real-time pricing" />
        <meta name="keywords" content="yugioh,cards,collection,prices,trading-cards" />
      </Head>





      {/* Main Content */ }
      <div className="mx-auto w-full">

        {/* Page Header */ }
        <div className="px-6 py-8">
          <div className="glass p-6 rounded-xl border border-white/20">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-shadow mb-2">My Yu-Gi-Oh! Collection</h1>
                <p className="text-white/80">Manage and track your card collection</p>

                {/* Controls */ }
                { isAuthenticated && (
                  <div className="mx-auto mt-6">
                    <div className="p-4 rounded-lg border border-white/20">
                      <div className=" inline-flex flex-wrap flex-col lg:flex-row gap-4">


                        {/* Action Buttons */ }
                        <div className="mx-auto flex flex-wrap gap-2">
                          <button
                            onClick={ handleUpdatePrices }
                            disabled={ isUpdatingPrices }
                            className={ `flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-colors ${ isUpdatingPrices
                              ? 'bg-gray-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                              }` }
                          >
                            <TrendingUp size={ 16 } />
                            <span>{ isUpdatingPrices ? 'Updating...' : 'Update Prices' }</span>
                          </button>

                          <DownloadYugiohCSVButton
                            aggregatedData={ aggregatedData }
                            userCardList={ [] }
                          />

                          <button
                            onClick={ onDeleteAllCards }
                            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 rounded-lg hover:from-red-700 hover:to-red-800 transition-colors font-semibold float-right"
                          >
                            <span>Delete All</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) }
              </div>
              {/* Collection Stats */ }
              <div className="w-full lg:w-1/3 p-4 mt-8">
                <div className="text-shadow font-semibold glass p-4 rounded-lg">
                  <h3 className="text-lg text-white/80 mb-3">Collection Value</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Cards:</span>
                      <span className="font-bold text-emerald-400">{ aggregatedData.length }</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Est. Value:</span>
                      <span className="font-bold text-emerald-400">${ subtotalMarketPrice }</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>





        {/* Content Area */ }
        <main className="mx-auto w-full min-h-screen px-6 pb-8">
          { isAuthenticated ? (
            <>

              {/* Search */ }
              <div className="px-6 mb-6">
                <YugiohSearchBar
                  searchTerm={ searchTerm }
                  onSearch={ handleSearch }
                />
              </div>
              {/* Filter */ }
              <div className="max-h-screen px-3 py-3 mb-6">
                <CardFilter
                  updateFilters={ handleFilterChange }
                  filters={ filters }
                  isModalOpen={ isFilterMenuOpen }
                  setIsModalOpen={ setIsFilterMenuOpen }
                />
                {/* View Toggle */ }
                <div className="glass font-semibold text-shadow flex border border-white/20 rounded-lg overflow-ellipsis w-fit">
                  <div className='float-left w-1/2'>
                    <button
                      onClick={ () => setViewMode( 'grid' ) }
                      title={ "Grid view" }
                      className={ `px-3 py-3 transition-colors ${ viewMode === 'grid'
                        ? 'bg-purple-600 text-white'
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                        }` }
                    >
                      <Grid size={ 24 } />
                    </button>
                  </div>
                  <div className='float-right w-1/2'>
                    <button
                      onClick={ () => setViewMode( 'table' ) }
                      title={ "Table view" }
                      className={ `px-3 py-3 transition-colors ${ viewMode === 'table'
                        ? 'bg-purple-600 text-white'
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                        }` }
                    >
                      <List size={ 24 } />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */ }
              { isAuthenticated && viewMode === 'grid' ? (
                <>
                  <div className="mx-auto max-w-7xl mt-8">
                    <YugiohPagination
                      currentPage={ currentPage }
                      itemsPerPage={ itemsPerPage }
                      totalItems={ aggregatedData.length }
                      handlePageClick={ handlePageClick }
                    />
                  </div>
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


                </>
              ) : (
                <Suspense fallback={ <div className="text-center py-8">Loading...</div> }>
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
              ) }

              {/* Bottom Pagination */ }

            </>
          ) : (
            !isAuthenticated &&
            <div className="text-center py-16">
              <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
              <p className="text-white/80 mb-8">You need to be logged in to view your collection.</p>
              <button
                onClick={ () => router.push( '/login' ) }
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-colors"
              >
                Go to Login
              </button>
            </div>
          ) }
        </main>
      </div>

      {/* Overlay for mobile sidebar */ }
      { isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={ toggleSidebar }
        />
      ) }

      <SpeedInsights />
    </div>
  );
};

export default MyCollection;