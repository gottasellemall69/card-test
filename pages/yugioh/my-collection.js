import { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { Check, Filter, FolderOpen, FolderPlus, Grid, List, Loader2, Pencil, Plus, Search, Trash2, TrendingUp, X } from "lucide-react";
import Notification from '@/components/Notification';
import { useAppShellSlots } from "@/components/Layout";
import DownloadYugiohCSVButton from "@/components/Yugioh/Buttons/DownloadYugiohCSVButton";
import CardFilter from "@/components/Yugioh/CardFilter";
import FilterPanel from "@/components/Yugioh/FilterPanel";
import YugiohPagination from "@/components/Yugioh/YugiohPagination";
import { dispatchAuthStateChange } from "@/utils/authState";
import jwt from "jsonwebtoken";
import { getTokenFromRequest } from "@/proxy/authenticate";

const TableView = dynamic( () => import( "@/components/Yugioh/TableView" ), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen mx-auto justify-center items-center py-12 text-center text-lg font-semibold text-white/80">
      Loading table...
    </div>
  ),
} );

const GridView = dynamic( () => import( "@/components/Yugioh/GridView" ), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen mx-auto justify-center items-center py-12 text-center text-lg font-semibold text-white/80">
      Loading cards...
    </div>
  ),
} );

const CollectionValueChart = dynamic( () => import( "@/components/Yugioh/CollectionValueChart" ), {
  ssr: false,
  loading: () => (
    <div className="py-10 text-center text-sm font-semibold text-white/70">
      Loading collection value chart...
    </div>
  ),
} );

const ITEMS_PER_PAGE = 16;
const SUMMARY_PANEL_HEIGHT = "min-h-[120px]";
const CHART_PANEL_HEIGHT = "h-fit";
const buildDefaultFilters = () => ( {
  rarity: [],
  condition: [],
  printing: [],
} );
const DEFAULT_FILTERS = buildDefaultFilters();
const DEFAULT_SORT = { key: "number", direction: "ascending" };
const ALL_FOLDERS_ID = "all";
const UNCATEGORIZED_FOLDER_ID = "uncategorized";

const getCardFolderIds = ( card ) => (
  Array.isArray( card?.folderIds )
    ? card.folderIds
      .map( ( folderId ) => String( folderId ?? "" ).trim() )
      .filter( Boolean )
    : []
);

const normalizeFolder = ( folder ) => ( {
  ...folder,
  _id: String( folder?._id ?? "" ),
  name: String( folder?.name ?? "" ).trim(),
} );

const normalizeCollectionCard = ( card ) => ( {
  ...card,
  _id: String( card?._id ?? "" ),
  cardId: card?.cardId === null || card?.cardId === undefined ? null : String( card.cardId ).trim(),
  remoteImageUrl: typeof card?.remoteImageUrl === "string" && card.remoteImageUrl.trim()
    ? card.remoteImageUrl.trim()
    : null,
  folderIds: getCardFolderIds( card ),
} );

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
  const [ hasInitializedFilters, setHasInitializedFilters ] = useState( false );
  const [ sortConfig, setSortConfig ] = useState( () => ( { ...DEFAULT_SORT } ) );
  const [ isFilterMenuOpen, setIsFilterMenuOpen ] = useState( false );
  const [ isDesktopFilterOpen, setIsDesktopFilterOpen ] = useState( false );
  const [ currentPage, setCurrentPage ] = useState( 1 );
  const [ collectionValueHistory, setCollectionValueHistory ] = useState( [] );
  const [ isHistoryLoading, setIsHistoryLoading ] = useState( false );
  const [ historyError, setHistoryError ] = useState( null );
  const [ folders, setFolders ] = useState( [] );
  const [ activeFolderId, setActiveFolderId ] = useState( ALL_FOLDERS_ID );
  const [ targetFolderId, setTargetFolderId ] = useState( "" );
  const [ folderFormName, setFolderFormName ] = useState( "" );
  const [ editingFolderId, setEditingFolderId ] = useState( "" );
  const [ editingFolderName, setEditingFolderName ] = useState( "" );
  const [ selectedCardIds, setSelectedCardIds ] = useState( () => new Set() );
  const [ isFolderSaving, setIsFolderSaving ] = useState( false );
  const [ folderAction, setFolderAction ] = useState( "" );

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
    return Array.isArray( data ) ? data.map( normalizeCollectionCard ).filter( ( card ) => card._id ) : [];
  }, [] );

  const fetchFolders = useCallback( async () => {
    const response = await fetch( "/api/Yugioh/collection/folders", {
      method: "GET",
      credentials: "include",
    } );

    if ( !response.ok ) {
      const error = new Error( "Failed to fetch collection folders" );
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    return Array.isArray( data ) ? data.map( normalizeFolder ).filter( ( folder ) => folder._id && folder.name ) : [];
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

  useEffect( () => {
    if ( !isAuthenticated ) {
      setFolders( [] );
      return undefined;
    }

    let isActive = true;

    const loadFolders = async () => {
      try {
        const data = await fetchFolders();
        if ( isActive ) {
          setFolders( data );
        }
      } catch ( error ) {
        if ( !isActive ) {
          return;
        }
        console.error( "Error loading collection folders:", error );
        if ( error?.status === 401 ) {
          setIsAuthenticated( false );
          dispatchAuthStateChange( false );
        } else {
          setNotification( ( prev ) => ( {
            ...prev,
            show: true,
            message: "Failed to load collection folders.",
          } ) );
        }
      }
    };

    loadFolders();

    return () => {
      isActive = false;
    };
  }, [ fetchFolders, isAuthenticated ] );

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

  const defaultFilters = useMemo( () => buildDefaultFilters(), [] );
  const normalizedSearch = useMemo( () => searchValue.trim().toLowerCase(), [ searchValue ] );

  useEffect( () => {
    if ( hasInitializedFilters ) {
      return;
    }

    if ( !Array.isArray( cards ) || cards.length === 0 ) {
      return;
    }

    setFilters( defaultFilters );
    setHasInitializedFilters( true );
  }, [ cards, defaultFilters, hasInitializedFilters ] );

  const filteredCards = useMemo( () => {
    if ( !Array.isArray( cards ) ) {
      return [];
    }

    return cards.filter( ( card ) => {
      const cardFolderIds = getCardFolderIds( card );

      if ( activeFolderId === UNCATEGORIZED_FOLDER_ID && cardFolderIds.length > 0 ) {
        return false;
      }

      if (
        activeFolderId !== ALL_FOLDERS_ID &&
        activeFolderId !== UNCATEGORIZED_FOLDER_ID &&
        !cardFolderIds.includes( activeFolderId )
      ) {
        return false;
      }

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
  }, [ activeFolderId, cards, filters.condition, filters.printing, filters.rarity, normalizedSearch ] );

  const sortedCards = useMemo( () => {
    const sortable = [ ...filteredCards ];
    const { key, direction } = sortConfig;

    if ( !key ) {
      return sortable;
    }

    const numericKeys = new Set( [ "marketPrice", "lowPrice", "oldPrice", "quantity", "totalPrice" ] );

    return sortable.sort( ( a, b ) => {
      const rawLeft = key === "totalPrice"
        ? ( Number( a?.marketPrice ) || 0 ) * ( Number( a?.quantity ) || 0 )
        : a?.[ key ];
      const rawRight = key === "totalPrice"
        ? ( Number( b?.marketPrice ) || 0 ) * ( Number( b?.quantity ) || 0 )
        : b?.[ key ];

      if ( rawLeft === rawRight ) {
        return 0;
      }

      if ( rawLeft === null || rawLeft === undefined || rawLeft === "" ) {
        return direction === "ascending" ? 1 : -1;
      }

      if ( rawRight === null || rawRight === undefined || rawRight === "" ) {
        return direction === "ascending" ? -1 : 1;
      }

      if ( numericKeys.has( key ) ) {
        const leftNumber = Number( rawLeft );
        const rightNumber = Number( rawRight );
        const leftOk = Number.isFinite( leftNumber );
        const rightOk = Number.isFinite( rightNumber );

        if ( leftOk && rightOk ) {
          return direction === "ascending"
            ? leftNumber - rightNumber
            : rightNumber - leftNumber;
        }
      }

      return direction === "ascending"
        ? String( rawLeft ).localeCompare( String( rawRight ), undefined, { numeric: true, sensitivity: "base" } )
        : String( rawRight ).localeCompare( String( rawLeft ), undefined, { numeric: true, sensitivity: "base" } );
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

  const overallEstimatedValue = useMemo(
    () =>
      cards.reduce( ( sum, card ) => {
        const price = parseFloat( card?.marketPrice ) || 0;
        const quantity = Number( card?.quantity ) || 0;
        return sum + price * quantity;
      }, 0 ),
    [ cards ],
  );

  const formattedEstimatedValue = currencyFormatter.format( estimatedValue || 0 );
  const hasCards = totalItems > 0;

  const folderNameMap = useMemo( () => {
    return folders.reduce( ( map, folder ) => {
      map[ folder._id ] = folder.name;
      return map;
    }, {} );
  }, [ folders ] );

  const folderCounts = useMemo( () => {
    const counts = {
      [ ALL_FOLDERS_ID ]: cards.length,
      [ UNCATEGORIZED_FOLDER_ID ]: 0,
    };

    folders.forEach( ( folder ) => {
      counts[ folder._id ] = 0;
    } );

    cards.forEach( ( card ) => {
      const cardFolderIds = getCardFolderIds( card );
      if ( cardFolderIds.length === 0 ) {
        counts[ UNCATEGORIZED_FOLDER_ID ] += 1;
      }

      cardFolderIds.forEach( ( folderId ) => {
        counts[ folderId ] = ( counts[ folderId ] || 0 ) + 1;
      } );
    } );

    return counts;
  }, [ cards, folders ] );

  const selectedCount = selectedCardIds.size;
  const selectedCardIdList = useMemo( () => Array.from( selectedCardIds ), [ selectedCardIds ] );
  const currentPageCardIds = useMemo(
    () => paginatedCards.map( ( card ) => card?._id ).filter( Boolean ).map( String ),
    [ paginatedCards ],
  );
  const isCurrentPageSelected = currentPageCardIds.length > 0 &&
    currentPageCardIds.every( ( cardId ) => selectedCardIds.has( cardId ) );

  useEffect( () => {
    const validIds = new Set( cards.map( ( card ) => card?._id ).filter( Boolean ).map( String ) );
    setSelectedCardIds( ( current ) => {
      const next = new Set( Array.from( current ).filter( ( cardId ) => validIds.has( cardId ) ) );
      return next.size === current.size ? current : next;
    } );
  }, [ cards ] );

  useEffect( () => {
    if ( targetFolderId && folders.some( ( folder ) => folder._id === targetFolderId ) ) {
      return;
    }

    setTargetFolderId( folders[ 0 ]?._id || "" );
  }, [ folders, targetFolderId ] );

  useEffect( () => {
    if (
      activeFolderId === ALL_FOLDERS_ID ||
      activeFolderId === UNCATEGORIZED_FOLDER_ID ||
      folders.some( ( folder ) => folder._id === activeFolderId )
    ) {
      return;
    }

    setActiveFolderId( ALL_FOLDERS_ID );
  }, [ activeFolderId, folders ] );

  useEffect( () => {
    setCurrentPage( 1 );
  }, [ activeFolderId ] );

  useEffect( () => {
    let isActive = true;

    if ( !isAuthenticated || !hasCards ) {
      setCollectionValueHistory( [] );
      setHistoryError( null );
      return () => {
        isActive = false;
      };
    }

    const loadHistory = async () => {
      setIsHistoryLoading( true );
      setHistoryError( null );
      try {
        const response = await fetch( "/api/Yugioh/collection/value-history", {
          method: "GET",
          credentials: "include",
        } );

        if ( !response.ok ) {
          if ( response.status === 401 ) {
            setIsAuthenticated( false );
            dispatchAuthStateChange( false );
            return;
          }
          throw new Error( "Failed to fetch collection value history." );
        }

        const data = await response.json();

        if ( !isActive ) {
          return;
        }

        setCollectionValueHistory( Array.isArray( data?.history ) ? data.history : [] );
      } catch ( error ) {
        if ( !isActive ) {
          return;
        }
        console.error( "Error loading collection value history:", error );
        setHistoryError( "Unable to load collection value history." );
      } finally {
        if ( isActive ) {
          setIsHistoryLoading( false );
        }
      }
    };

    loadHistory();

    return () => {
      isActive = false;
    };
  }, [ cards, hasCards, isAuthenticated ] );

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

  const showNotification = useCallback( ( message ) => {
    setNotification( ( prev ) => ( { ...prev, show: true, message } ) );
  }, [] );

  const handleSelectedCardIdsChange = useCallback( ( nextSelection ) => {
    setSelectedCardIds( ( current ) => {
      const next = typeof nextSelection === "function" ? nextSelection( current ) : nextSelection;
      return new Set( next );
    } );
  }, [] );

  const handleToggleCurrentPageSelection = useCallback( () => {
    setSelectedCardIds( ( current ) => {
      const next = new Set( current );
      currentPageCardIds.forEach( ( cardId ) => {
        if ( isCurrentPageSelected ) {
          next.delete( cardId );
        } else {
          next.add( cardId );
        }
      } );
      return next;
    } );
  }, [ currentPageCardIds, isCurrentPageSelected ] );

  const handleClearSelection = useCallback( () => {
    setSelectedCardIds( new Set() );
  }, [] );

  const parseApiMessage = useCallback( async ( response, fallback ) => {
    const payload = await response.json().catch( () => null );
    return payload?.message || payload?.error || fallback;
  }, [] );

  const handleSearchChange = useCallback( async ( event ) => {
    setSearchValue( event.target.value );
    setCurrentPage( 1 );
  }, [] );

  const handleFilterChange = useCallback( async ( filterName, selectedOptions ) => {
    setHasInitializedFilters( true );
    setFilters( ( prev ) => ( {
      ...prev,
      [ filterName ]: selectedOptions,
    } ) );
    setCurrentPage( 1 );
  }, [] );

  const handleClearFilters = useCallback( async () => {
    setHasInitializedFilters( true );
    setFilters( { ...defaultFilters } );
    setCurrentPage( 1 );
  }, [ defaultFilters ] );

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
    setCurrentPage( 1 );
  }, [] );

  const handleCreateFolder = useCallback( async ( event ) => {
    event.preventDefault();
    const name = folderFormName.trim();
    if ( !name ) {
      showNotification( "Enter a folder name." );
      return;
    }

    setIsFolderSaving( true );
    try {
      const response = await fetch( "/api/Yugioh/collection/folders", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify( { name } ),
      } );

      if ( response.status === 401 ) {
        setIsAuthenticated( false );
        dispatchAuthStateChange( false );
        return;
      }

      if ( !response.ok ) {
        throw new Error( await parseApiMessage( response, "Failed to create folder." ) );
      }

      const folder = normalizeFolder( await response.json() );
      setFolders( ( current ) => [ ...current, folder ].sort( ( a, b ) => a.name.localeCompare( b.name ) ) );
      setActiveFolderId( folder._id );
      setTargetFolderId( folder._id );
      setFolderFormName( "" );
      showNotification( "Folder created." );
    } catch ( error ) {
      console.error( "Error creating folder:", error );
      showNotification( error.message || "Failed to create folder." );
    } finally {
      setIsFolderSaving( false );
    }
  }, [ folderFormName, parseApiMessage, showNotification ] );

  const handleStartRenameFolder = useCallback( ( folder ) => {
    setEditingFolderId( folder._id );
    setEditingFolderName( folder.name );
  }, [] );

  const handleCancelRenameFolder = useCallback( () => {
    setEditingFolderId( "" );
    setEditingFolderName( "" );
  }, [] );

  const handleSaveFolderName = useCallback( async ( folderId ) => {
    const name = editingFolderName.trim();
    if ( !name ) {
      showNotification( "Enter a folder name." );
      return;
    }

    setFolderAction( `rename-${ folderId }` );
    try {
      const response = await fetch( "/api/Yugioh/collection/folders", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify( { folderId, name } ),
      } );

      if ( response.status === 401 ) {
        setIsAuthenticated( false );
        dispatchAuthStateChange( false );
        return;
      }

      if ( !response.ok ) {
        throw new Error( await parseApiMessage( response, "Failed to rename folder." ) );
      }

      const folder = normalizeFolder( await response.json() );
      setFolders( ( current ) => current.map( ( item ) => ( item._id === folder._id ? folder : item ) ) );
      handleCancelRenameFolder();
      showNotification( "Folder renamed." );
    } catch ( error ) {
      console.error( "Error renaming folder:", error );
      showNotification( error.message || "Failed to rename folder." );
    } finally {
      setFolderAction( "" );
    }
  }, [ editingFolderName, handleCancelRenameFolder, parseApiMessage, showNotification ] );

  const handleDeleteFolder = useCallback( async ( folderId ) => {
    const folder = folders.find( ( item ) => item._id === folderId );
    if ( !folder ) {
      return;
    }

    const confirmed = window.confirm( `Delete folder "${ folder.name }"? Cards will stay in your collection.` );
    if ( !confirmed ) {
      return;
    }

    setFolderAction( `delete-${ folderId }` );
    try {
      const response = await fetch( "/api/Yugioh/collection/folders", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify( { folderId } ),
      } );

      if ( response.status === 401 ) {
        setIsAuthenticated( false );
        dispatchAuthStateChange( false );
        return;
      }

      if ( !response.ok ) {
        throw new Error( await parseApiMessage( response, "Failed to delete folder." ) );
      }

      setFolders( ( current ) => current.filter( ( item ) => item._id !== folderId ) );
      setCards( ( current ) => current.map( ( card ) => ( {
        ...card,
        folderIds: getCardFolderIds( card ).filter( ( value ) => value !== folderId ),
      } ) ) );
      if ( activeFolderId === folderId ) {
        setActiveFolderId( ALL_FOLDERS_ID );
      }
      if ( targetFolderId === folderId ) {
        setTargetFolderId( "" );
      }
      showNotification( "Folder deleted." );
    } catch ( error ) {
      console.error( "Error deleting folder:", error );
      showNotification( error.message || "Failed to delete folder." );
    } finally {
      setFolderAction( "" );
    }
  }, [ activeFolderId, folders, parseApiMessage, showNotification, targetFolderId ] );

  const handleApplyFolderToSelected = useCallback( async ( action ) => {
    if ( selectedCardIdList.length === 0 ) {
      showNotification( "Select at least one card." );
      return;
    }

    if ( !targetFolderId ) {
      showNotification( "Create a folder first." );
      return;
    }

    setFolderAction( action );
    try {
      const response = await fetch( "/api/Yugioh/collection/card-folders", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify( {
          cardIds: selectedCardIdList,
          folderId: targetFolderId,
          action,
        } ),
      } );

      if ( response.status === 401 ) {
        setIsAuthenticated( false );
        dispatchAuthStateChange( false );
        return;
      }

      if ( !response.ok ) {
        throw new Error( await parseApiMessage( response, "Failed to update folder assignments." ) );
      }

      const selectedSet = new Set( selectedCardIdList );
      setCards( ( current ) => current.map( ( card ) => {
        const cardId = String( card?._id ?? "" );
        if ( !selectedSet.has( cardId ) ) {
          return card;
        }

        const cardFolderIds = getCardFolderIds( card );
        const nextFolderIds = action === "add"
          ? [ ...new Set( [ ...cardFolderIds, targetFolderId ] ) ]
          : cardFolderIds.filter( ( folderId ) => folderId !== targetFolderId );

        return { ...card, folderIds: nextFolderIds };
      } ) );

      showNotification( action === "add" ? "Cards added to folder." : "Cards removed from folder." );
    } catch ( error ) {
      console.error( "Error updating folder assignments:", error );
      showNotification( error.message || "Failed to update folder assignments." );
    } finally {
      setFolderAction( "" );
    }
  }, [ parseApiMessage, selectedCardIdList, showNotification, targetFolderId ] );

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

      const payload = await response.json().catch( () => null );
      const result = payload?.result;
      const updatedCount = Number.isFinite( Number( result?.updatedCount ) )
        ? Number( result.updatedCount )
        : Array.isArray( result )
          ? result.length
          : 0;
      const unmatchedCount = Number.isFinite( Number( result?.unmatchedCount ) )
        ? Number( result.unmatchedCount )
        : 0;
      const processedSetCount = Number.isFinite( Number( result?.processedSetCount ) )
        ? Number( result.processedSetCount )
        : 0;
      const completedSetCount = Number.isFinite( Number( result?.completedSetCount ) )
        ? Number( result.completedSetCount )
        : processedSetCount;
      const remainingSetCount = Number.isFinite( Number( result?.remainingSetCount ) )
        ? Number( result.remainingSetCount )
        : 0;
      const totalSetCount = Number.isFinite( Number( result?.totalSetCount ) )
        ? Number( result.totalSetCount )
        : completedSetCount + remainingSetCount;
      const isComplete = result?.complete !== false;
      const rateLimited = Boolean( result?.rateLimited );

      const updateMessage = isComplete
        ? unmatchedCount > 0
          ? `Current price update complete: ${ updatedCount } card${ updatedCount === 1 ? "" : "s" } updated; ${ unmatchedCount } need manual review.`
          : `Current price update complete: ${ updatedCount } card${ updatedCount === 1 ? "" : "s" } updated.`
        : [
          `Current prices updated for ${ updatedCount } card${ updatedCount === 1 ? "" : "s" } across ${ processedSetCount } set${ processedSetCount === 1 ? "" : "s" }.`,
          `${ completedSetCount }/${ totalSetCount } collection set${ totalSetCount === 1 ? "" : "s" } complete; ${ remainingSetCount } remain.`,
          rateLimited
            ? "The price API rate limit was reached. Wait a bit, then click Refresh prices again to resume from the remaining sets."
            : "Click Refresh prices again to resume from the remaining sets.",
          unmatchedCount > 0
            ? `${ unmatchedCount } card${ unmatchedCount === 1 ? "" : "s" } in processed sets need manual review.`
            : "",
        ].filter( Boolean ).join( "\n" );

      await refreshCollection();
      window.alert( updateMessage );
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
      setSelectedCardIds( ( current ) => {
        const next = new Set( current );
        next.delete( cardId );
        return next;
      } );
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
      setSelectedCardIds( new Set() );
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

  const shellRightSidebar = useMemo( () => {
    if ( isLoading || !isAuthenticated || !isDesktopFilterOpen ) {
      return null;
    }

    return (
      <div id="desktop-filter-panel" className="flex h-full w-full flex-col px-2 py-4">
        <FilterPanel
          className="h-full rounded-2xl border-white/10 bg-black/60 text-white shadow-none"
          filters={ filters }
          updateFilters={ handleFilterChange }
          clearFilters={ handleClearFilters }
        />
      </div>
    );
  }, [
    filters,
    handleClearFilters,
    handleFilterChange,
    isAuthenticated,
    isDesktopFilterOpen,
    isLoading,
  ] );

  const shellFooter = useMemo( () => (
    <Notification
      show={ notification.show }
      setShow={ ( show ) => setNotification( ( prev ) => ( { ...prev, show } ) ) }
      message={ notification.message }
    />
  ), [ notification.message, notification.show ] );

  useAppShellSlots( {
    rightSidebar: shellRightSidebar,
    footer: shellFooter,
  } );

  if ( isLoading ) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 yugioh-bg text-white/80">
        <Loader2 className="h-12 w-12 animate-spin" />
        <p className="text-lg font-semibold">Loading your collection...</p>
      </div>
    );
  }

  if ( !isAuthenticated ) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center yugioh-bg px-4 text-center text-white">
        <div className="mx-auto w-full max-w-2xl rounded-3xl border border-white/10 bg-black/55 p-10 shadow-2xl">
          <h2 className="text-3xl font-bold text-shadow">Please log in</h2>
          <p className="mt-3 text-white/70">
            You need to be logged in to view your Yu-Gi-Oh! collection.
          </p>
          <button
            type="button"
            onClick={ () => router.push( "/login" ) }
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 font-semibold transition hover:from-purple-500 hover:to-blue-500"
          >
            Go to login
          </button>
        </div>
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
      <div className="relative z-10 min-h-screen yugioh-bg text-white">
        <main className="relative z-10 min-h-screen mx-auto w-full px-4 pb-20 pt-10 sm:px-2 lg:px-4">

          <header className={ `rounded-3xl border border-white/10 bg-black/50 p-6 shadow-2xl ${ SUMMARY_PANEL_HEIGHT }` }>
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
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-wrap text-xs uppercase tracking-wide text-white/60">Total cards</p>
                    <p className="mt-2 text-3xl font-semibold text-white">{ totalOwnedCards }</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-wrap text-xs uppercase tracking-wide text-white/60">Distinct sets</p>
                    <p className="mt-2 text-3xl font-semibold text-white">{ distinctSets }</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-wrap text-xs uppercase tracking-wide text-white/60">Estimated value</p>
                    <p className="mt-2 text-3xl font-semibold text-emerald-400">{ formattedEstimatedValue }</p>
                  </div>
                </div>
              ) }
            </div>
          </header>

          { hasCards && (
            <div className={ `mt-6 min-h-fit h-auto w-full rounded-3xl border border-white/10 bg-black/50 p-4 shadow-2xl ${ CHART_PANEL_HEIGHT }` }>
              { historyError && (
                <p className="text-sm text-rose-200">{ historyError }</p>
              ) }
              { !historyError && (
                <CollectionValueChart
                  valueHistory={ collectionValueHistory }
                  currentValue={ overallEstimatedValue }
                />
              ) }
              { isHistoryLoading && !historyError && (
                <p className="mt-2 text-xs text-white/60">Refreshing chart...</p>
              ) }
            </div>
          ) }

          <section className="mt-6 rounded-3xl border border-white/10 bg-black/50 p-6 shadow-2xl">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                    <FolderOpen className="h-4 w-4" />
                    Folders
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={ () => setActiveFolderId( ALL_FOLDERS_ID ) }
                      className={ `inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${ activeFolderId === ALL_FOLDERS_ID ? "border-indigo-300 bg-indigo-500/30 text-white" : "border-white/15 bg-white/10 text-white/75 hover:border-white/40 hover:text-white" }` }
                    >
                      All
                      <span className="rounded-full bg-black/35 px-2 py-0.5 text-xs">{ folderCounts[ ALL_FOLDERS_ID ] || 0 }</span>
                    </button>
                    <button
                      type="button"
                      onClick={ () => setActiveFolderId( UNCATEGORIZED_FOLDER_ID ) }
                      className={ `inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${ activeFolderId === UNCATEGORIZED_FOLDER_ID ? "border-indigo-300 bg-indigo-500/30 text-white" : "border-white/15 bg-white/10 text-white/75 hover:border-white/40 hover:text-white" }` }
                    >
                      Uncategorized
                      <span className="rounded-full bg-black/35 px-2 py-0.5 text-xs">{ folderCounts[ UNCATEGORIZED_FOLDER_ID ] || 0 }</span>
                    </button>
                    { folders.map( ( folder ) => {
                      const isActive = activeFolderId === folder._id;
                      const isEditing = editingFolderId === folder._id;
                      return (
                        <div key={ folder._id } className={ `inline-flex items-center rounded-full border transition ${ isActive ? "border-indigo-300 bg-indigo-500/30" : "border-white/15 bg-white/10" }` }>
                          { isEditing ? (
                            <div className="flex items-center gap-1 px-2 py-1">
                              <input
                                type="text"
                                value={ editingFolderName }
                                onChange={ ( event ) => setEditingFolderName( event.target.value ) }
                                onKeyDown={ ( event ) => {
                                  if ( event.key === "Enter" ) {
                                    event.preventDefault();
                                    handleSaveFolderName( folder._id );
                                  }
                                  if ( event.key === "Escape" ) {
                                    handleCancelRenameFolder();
                                  }
                                } }
                                className="h-8 w-36 rounded-full border border-white/15 bg-black/70 px-3 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={ () => handleSaveFolderName( folder._id ) }
                                disabled={ folderAction === `rename-${ folder._id }` }
                                className="inline-flex size-8 items-center justify-center rounded-full text-white/75 transition hover:bg-white/10 hover:text-white disabled:opacity-60"
                                aria-label="Save folder name"
                              >
                                { folderAction === `rename-${ folder._id }` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" /> }
                              </button>
                              <button
                                type="button"
                                onClick={ handleCancelRenameFolder }
                                className="inline-flex size-8 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
                                aria-label="Cancel rename"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={ () => setActiveFolderId( folder._id ) }
                                className="inline-flex items-center gap-2 rounded-l-full px-3 py-1.5 text-sm font-semibold text-white/80 transition hover:text-white"
                              >
                                { folder.name }
                                <span className="rounded-full bg-black/35 px-2 py-0.5 text-xs">{ folderCounts[ folder._id ] || 0 }</span>
                              </button>
                              <button
                                type="button"
                                onClick={ () => handleStartRenameFolder( folder ) }
                                className="inline-flex size-8 items-center justify-center text-white/55 transition hover:bg-white/10 hover:text-white"
                                aria-label="Rename folder"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={ () => handleDeleteFolder( folder._id ) }
                                disabled={ folderAction === `delete-${ folder._id }` }
                                className="inline-flex size-8 items-center justify-center rounded-r-full text-white/55 transition hover:bg-rose-500/20 hover:text-rose-100 disabled:opacity-60"
                                aria-label="Delete folder"
                              >
                                { folderAction === `delete-${ folder._id }` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" /> }
                              </button>
                            </>
                          ) }
                        </div>
                      );
                    } ) }
                  </div>
                </div>

                <form onSubmit={ handleCreateFolder } className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                  <div className="relative min-w-0 sm:w-64">
                    <FolderPlus className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                    <input
                      type="text"
                      value={ folderFormName }
                      onChange={ ( event ) => setFolderFormName( event.target.value ) }
                      placeholder="Folder name"
                      className="w-full rounded-full border border-white/15 bg-black/60 px-10 py-2 text-sm text-white placeholder-white/45 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                      maxLength={ 80 }
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={ isFolderSaving }
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-indigo-300/40 bg-indigo-500/25 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500/35 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    { isFolderSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" /> }
                    Create
                  </button>
                </form>
              </div>

              { folders.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-4 text-sm text-white/80">
                  <span className="font-semibold text-white">{ selectedCount } selected</span>
                  <button
                    type="button"
                    onClick={ handleToggleCurrentPageSelection }
                    disabled={ currentPageCardIds.length === 0 }
                    className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    { isCurrentPageSelected ? "Unselect Page" : "Select Page" }
                  </button>
                  <button
                    type="button"
                    onClick={ handleClearSelection }
                    disabled={ selectedCount === 0 }
                    className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Clear
                  </button>
                  <select
                    value={ targetFolderId }
                    onChange={ ( event ) => setTargetFolderId( event.target.value ) }
                    className="min-h-9 rounded-full border border-white/15 bg-black/60 px-3 py-1.5 text-sm font-semibold text-white/80 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                  >
                    { folders.map( ( folder ) => (
                      <option key={ folder._id } value={ folder._id }>{ folder.name }</option>
                    ) ) }
                  </select>
                  <button
                    type="button"
                    onClick={ () => handleApplyFolderToSelected( "add" ) }
                    disabled={ selectedCount === 0 || !targetFolderId || folderAction === "add" }
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-50 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    { folderAction === "add" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" /> }
                    Add selected
                  </button>
                  <button
                    type="button"
                    onClick={ () => handleApplyFolderToSelected( "remove" ) }
                    disabled={ selectedCount === 0 || !targetFolderId || folderAction === "remove" }
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    { folderAction === "remove" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" /> }
                    Remove selected
                  </button>
                </div>
              ) }
            </div>
          </section>

          <section className="pt-10">
            <div className="space-y-8">
              <div className="space-y-8">
                <div className="rounded-3xl border border-white/10 bg-black/50 p-6 shadow-2xl">
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
                      <div className="xl:hidden">
                        <CardFilter
                          filters={ filters }
                          updateFilters={ handleFilterChange }
                          clearFilters={ handleClearFilters }
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
                    <div className="hidden pb-4 xl:flex xl:justify-end">
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
                  <div id="collection-results-art-band">
                    { totalItems > ITEMS_PER_PAGE && (
                      <YugiohPagination
                        currentPage={ currentPage }
                        itemsPerPage={ ITEMS_PER_PAGE }
                        totalItems={ totalItems }
                        handlePageClick={ handlePageClick }
                      />
                    ) }
                    <div className="rounded-3xl border border-white/10 bg-black/40 p-4 shadow-2xl yugioh-stage">
                      { viewMode === "table" ? (
                        <TableView
                          aggregatedData={ paginatedCards }
                          onDeleteCard={ onDeleteCard }
                          onUpdateCard={ onUpdateCard }
                          handleSortChange={ handleSortChange }
                          sortConfig={ sortConfig }
                          selectedCardIds={ selectedCardIds }
                          onSelectedCardIdsChange={ handleSelectedCardIdsChange }
                          folderNameMap={ folderNameMap }
                        />
                      ) : (
                        <GridView
                          aggregatedData={ gridCards }
                          onDeleteCard={ onDeleteCard }
                          onUpdateCard={ onUpdateCard }
                          handleSortChange={ handleSortChange }
                          sortConfig={ sortConfig }
                          selectedCardIds={ selectedCardIds }
                          onSelectedCardIdsChange={ handleSelectedCardIdsChange }
                          folderNameMap={ folderNameMap }
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
                  </div>
                ) : (
                  <div className="min-h-[28rem] rounded-3xl border border-dashed border-white/20 bg-black/30 p-12 text-center text-white/70">
                    <p className="text-lg font-semibold">Your collection is empty.</p>
                    <p className="mt-2">Add cards to start tracking your inventory and market prices.</p>
                  </div>
                ) }
              </div>
            </div>
          </section>

        </main>
      </div>

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
