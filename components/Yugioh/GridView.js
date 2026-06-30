import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import Notification from "@/components/Notification";
import PriceTrendIndicator from "@/components/Yugioh/PriceTrendIndicator";

const FALLBACK_IMAGE = "/images/yugioh-card.png";

const formatCurrency = ( value ) => {
  const numeric = Number( value );
  if ( !Number.isFinite( numeric ) ) {
    return null;
  }
  return `$${ numeric.toFixed( 2 ) }`;
};

const normalizeOptionalString = ( value ) => {
  if ( value === null || value === undefined ) {
    return null;
  }

  const normalized = String( value ).trim();
  return normalized || null;
};

const getPrimaryCardImage = ( card ) => (
  Array.isArray( card?.card_images )
    ? card.card_images.find( ( image ) => image?.id || image?.image_url || image?.image_url_cropped || image?.image_url_small )
    : null
);

const GridView = ( { aggregatedData, onDeleteCard, onUpdateCard, sortConfig, handleSortChange, selectedCardIds, onSelectedCardIdsChange, folderNameMap = {} } ) => {
  const [ edit, setEdit ] = useState( {} );
  const [ editValues, setEditValues ] = useState( {} );
  const [ notification, setNotification ] = useState( { show: false, message: "" } );
  const [ flippedCards, setFlippedCards ] = useState( {} );
  const isExternallySorted = Boolean( sortConfig && typeof handleSortChange === "function" );
  const [ internalSortField, setInternalSortField ] = useState( "setName" );
  const [ internalSortDirection, setInternalSortDirection ] = useState( "asc" );
  const sortField = isExternallySorted ? sortConfig.key : internalSortField;
  const sortDirection = isExternallySorted
    ? ( sortConfig.direction === "descending" ? "desc" : "asc" )
    : internalSortDirection;
  const isSelectionEnabled = selectedCardIds instanceof Set && typeof onSelectedCardIdsChange === "function";
  const updateSelectedRows = useCallback(
    ( updater ) => {
      if ( isSelectionEnabled ) {
        onSelectedCardIdsChange( updater );
      }
    },
    [ isSelectionEnabled, onSelectedCardIdsChange ],
  );
  const displayInputClasses =
    "min-w-[4rem] rounded border border-white/30 bg-black/50 px-3 py-1 text-center font-semibold text-white transition hover:border-white/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60";
  const displayInputClassesRose =
    "min-w-[4rem] rounded border border-rose-300/60 bg-black/50 px-3 py-1 text-center font-semibold text-rose-200 transition hover:border-rose-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60";

  const handleEdit = useCallback(
    ( cardId, field ) => {
      setEdit( ( prev ) => ( { ...prev, [ cardId ]: field } ) );
      const card = aggregatedData?.find( ( entry ) => entry?._id === cardId );
      if ( card ) {
        setEditValues( ( prev ) => ( { ...prev, [ cardId ]: { ...card } } ) );
      }
    },
    [ aggregatedData ],
  );

  const handleChange = useCallback( ( event, cardId, field ) => {
    const { value } = event.target;
    setEditValues( ( prev ) => ( {
      ...prev,
      [ cardId ]: { ...prev[ cardId ], [ field ]: value },
    } ) );
  }, [] );

  const handleSave = useCallback(
    async ( cardId, field ) => {
      const pendingCard = editValues[ cardId ];
      if ( !pendingCard || pendingCard[ field ] === undefined || pendingCard[ field ] === null ) {
        setEdit( ( prev ) => ( { ...prev, [ cardId ]: null } ) );
        return;
      }

      const value = Number.parseFloat( pendingCard[ field ] );
      if ( !Number.isFinite( value ) ) {
        setEdit( ( prev ) => ( { ...prev, [ cardId ]: null } ) );
        return;
      }

      try {
        await onUpdateCard( cardId, field, value );
        setEdit( ( prev ) => ( { ...prev, [ cardId ]: null } ) );
        setNotification( { show: true, message: "Card quantity updated successfully!" } );
      } catch ( error ) {
        console.error( "Error saving card:", error );
      }
    },
    [ editValues, onUpdateCard ],
  );

  const updateQuantity = useCallback(
    async ( cardId, quantity ) => {
      try {
        if ( !Number.isFinite( quantity ) || quantity < 0 ) {
          return;
        }

        if ( quantity === 0 ) {
          await onDeleteCard( cardId );
          setNotification( { show: true, message: "Card deleted successfully!" } );
        } else {
          await onUpdateCard( cardId, "quantity", quantity );
          setNotification( { show: true, message: "Card quantity updated successfully!" } );
        }
      } catch ( error ) {
        console.error( "Error updating quantity:", error );
      }
    },
    [ onDeleteCard, onUpdateCard ],
  );

  const toggleFlip = useCallback( ( id, forcedState = null ) => {
    setFlippedCards( ( prev ) => {
      const current = Boolean( prev[ id ] );
      const next = forcedState === null ? !current : forcedState;
      return { ...prev, [ id ]: next };
    } );
  }, [] );

  const getFullImagePath = useCallback( ( cardId ) => `/images/yugiohImages/${ String( cardId ) }.jpg`, [] );

  const getCardImageSources = useCallback(
    ( card ) => {
      const primaryCardImage = getPrimaryCardImage( card );
      const imageId =
        normalizeOptionalString( primaryCardImage?.id ) ||
        normalizeOptionalString( card?.cardImageId ) ||
        normalizeOptionalString( card?.cardId ) ||
        normalizeOptionalString( card?.cardDetailId ) ||
        normalizeOptionalString( card?.id );
      const localImageSrc = imageId ? getFullImagePath( imageId ) : null;
      const remoteImageSrc =
        normalizeOptionalString( card?.remoteImageUrl ) ||
        normalizeOptionalString( card?.image_url ) ||
        normalizeOptionalString( primaryCardImage?.image_url ) ||
        normalizeOptionalString( primaryCardImage?.image_url_cropped ) ||
        normalizeOptionalString( primaryCardImage?.image_url_small );
      const primaryImageSrc = remoteImageSrc || localImageSrc || FALLBACK_IMAGE;
      const secondaryImageSrc = primaryImageSrc === remoteImageSrc ? localImageSrc : remoteImageSrc;

      return {
        primaryImageSrc,
        secondaryImageSrc: secondaryImageSrc && secondaryImageSrc !== primaryImageSrc ? secondaryImageSrc : null,
      };
    },
    [ getFullImagePath ],
  );

  const handleCardImageError = useCallback( ( event ) => {
    const image = event.currentTarget;
    const nextSrc = image.dataset.nextSrc;
    const fallbackSrc = image.dataset.fallbackSrc;

    if ( nextSrc ) {
      image.src = nextSrc;
      image.dataset.nextSrc = "";
      return;
    }

    if ( fallbackSrc ) {
      image.src = fallbackSrc;
      image.dataset.fallbackSrc = "";
      image.onerror = null;
    }
  }, [] );

  const getFolderLabels = useCallback(
    ( card ) => ( Array.isArray( card?.folderIds ) ? card.folderIds : [] )
      .map( ( folderId ) => folderNameMap[ String( folderId ) ] )
      .filter( Boolean ),
    [ folderNameMap ],
  );

  const memoizedAggregatedData = useMemo( () => {
    if ( !Array.isArray( aggregatedData ) ) return [];

    if ( isExternallySorted ) {
      return aggregatedData;
    }

    const sortedData = [ ...aggregatedData ];

    if ( !sortField ) {
      return sortedData;
    }

    sortedData.sort( ( a, b ) => {
      const aValue = a?.[ sortField ];
      const bValue = b?.[ sortField ];

      if ( aValue == null && bValue == null ) return 0;
      if ( aValue == null ) return 1;
      if ( bValue == null ) return -1;

      const aNumber = Number( aValue );
      const bNumber = Number( bValue );
      const bothNumeric = Number.isFinite( aNumber ) && Number.isFinite( bNumber );

      if ( bothNumeric ) {
        return sortDirection === "asc" ? aNumber - bNumber : bNumber - aNumber;
      }

      const aStr = String( aValue ).toLowerCase();
      const bStr = String( bValue ).toLowerCase();

      return sortDirection === "asc" ? aStr.localeCompare( bStr ) : bStr.localeCompare( aStr );
    } );

    return sortedData;
  }, [ aggregatedData, isExternallySorted, sortField, sortDirection ] );

  const handleSortFieldChange = useCallback(
    ( nextField ) => {
      if ( isExternallySorted ) {
        handleSortChange( nextField );
        return;
      }

      setInternalSortField( nextField );
    },
    [ handleSortChange, isExternallySorted ],
  );

  const toggleSortDirection = useCallback( () => {
    if ( isExternallySorted ) {
      const nextDirection = sortConfig.direction === "ascending" ? "descending" : "ascending";
      handleSortChange( sortConfig.key, nextDirection );
      return;
    }

    setInternalSortDirection( ( prev ) => ( prev === "asc" ? "desc" : "asc" ) );
  }, [ handleSortChange, isExternallySorted, sortConfig ] );

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-sm text-white/80">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-medium text-white/70">Sort</span>
          <select
            value={ sortField }
            onChange={ ( event ) => handleSortFieldChange( event.target.value ) }
            className="rounded border border-white/15 bg-black/60 px-3 py-2 text-sm font-medium text-white/80 shadow-sm transition hover:border-white/40 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
          >
            <option value="productName">Card Name</option>
            <option value="setName">Set Name</option>
            <option value="number">Card Number</option>
            <option value="printing">Printing</option>
            <option value="rarity">Card Rarity</option>
            <option value="quantity">Quantity</option>
            <option value="marketPrice">Market Price</option>
            <option value="totalPrice">Total Market Price</option>
            <option value="condition">Card Condition</option>
          </select>
        </div>
        <button
          type="button"
          onClick={ toggleSortDirection }
          className="inline-flex items-center rounded border border-white/15 bg-black/60 px-3 py-2 text-sm font-semibold uppercase tracking-wide text-white/80 transition hover:border-white/40 hover:text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
        >
          { sortDirection === "asc" ? "Asc" : "Desc" }
        </button>
      </div>

      <div className="w-full rounded border border-white/10 bg-black/40 p-4 shadow-2xl sm:p-2">
        <div className="grid grid-cols-1 justify-items-center gap-x-8 gap-y-10 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          { memoizedAggregatedData.map( ( card ) => {
            if ( !card ) return null;

            const { primaryImageSrc, secondaryImageSrc } = getCardImageSources( card );
            const primaryCardImage = getPrimaryCardImage( card );
            const detailCardId =
              normalizeOptionalString( primaryCardImage?.id ) ||
              normalizeOptionalString( card?.cardImageId ) ||
              normalizeOptionalString( card?.cardId ) ||
              normalizeOptionalString( card?.cardDetailId ) ||
              normalizeOptionalString( card?.id );
            const cardId = String( card._id ?? "" );
            const isSelected = isSelectionEnabled && selectedCardIds.has( cardId );
            const isFlipped = Boolean( flippedCards[ card._id ] );
            const quantity = Number( card.quantity ) || 0;
            const folderLabels = getFolderLabels( card );
            const totalMarketPrice = ( Number( card.marketPrice ) || 0 ) * quantity;
            const removeAmount = editValues[ card._id ]?.deleteAmount || 1;

            const detailEntries = [
              { label: "Set", value: card.setName },
              { label: "Number", value: card.number },
              { label: "Rarity", value: card.rarity },
              { label: "Printing", value: card.printing },
              { label: "Condition", value: card.condition },
              { label: "Folders", value: folderLabels.join( ", " ) },
              { label: "Old Price", value: formatCurrency( card.oldPrice ) },
              { label: "Market Price", value: formatCurrency( card.marketPrice ) },
              { label: "Total Market Price", value: quantity > 1 ? formatCurrency( totalMarketPrice ) : null },
            ].filter( ( entry ) => entry.value );

            const letterCandidate = ( card.setName || card.productName || "" ).trim();
            const computedLetter = letterCandidate ? letterCandidate.charAt( 0 ).toUpperCase() : undefined;

            const cardDetailsQuery = ( () => {
              const query = { source: "collection" };

              if ( detailCardId ) query.card = detailCardId;
              if ( computedLetter ) query.letter = computedLetter;
              if ( card.setName ) query.set_name = card.setName;
              if ( card.productName ) query.card_name = card.productName;
              if ( card.number ) query.set_code = card.number;
              if ( card.rarity ) {
                query.rarity = card.rarity;
                query.set_rarity = card.rarity;
              }
              if ( card.printing ) query.edition = card.printing;

              return query;
            } )();

            const handleDeleteAmountBlur = () => {
              const deleteQty = editValues[ card._id ]?.deleteAmount || 0;
              const nextQuantity = Math.max( 0, quantity - deleteQty );

              updateQuantity( card._id, nextQuantity );

              if ( nextQuantity > 0 ) {
                setEditValues( ( prev ) => ( {
                  ...prev,
                  [ card._id ]: {
                    ...prev[ card._id ],
                    deleteAmount: 0,
                  },
                } ) );
              }

              setEdit( ( prev ) => ( { ...prev, [ card._id ]: null } ) );
            };

            const handleDeleteAmountKeyDown = ( event ) => {
              if ( event.key === "Enter" ) {
                event.preventDefault();
                handleDeleteAmountBlur();
              }
            };

            const handleQuantityKeyDown = ( event ) => {
              if ( event.key === "Enter" ) {
                event.preventDefault();
                handleSave( card._id, "quantity" );
              }
            };

            return (
              <div
                key={ card._id }
                className={ `group relative mx-auto flex h-full min-h-96 w-full max-w-[16rem] flex-col rounded-[6px] transition ${ isSelected ? "ring-2 ring-indigo-300/70 ring-offset-2 ring-offset-black/60" : "" }` }
              >
                { isSelectionEnabled && (
                  <label
                    className="absolute left-2 top-2 z-20 inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/20 bg-black/75 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow-lg transition hover:border-indigo-300/70"
                    onClick={ ( event ) => event.stopPropagation() }
                    onKeyDown={ ( event ) => event.stopPropagation() }
                  >
                    <input
                      type="checkbox"
                      className="size-4 cursor-pointer accent-indigo-500"
                      checked={ isSelected }
                      disabled={ !cardId }
                      onChange={ ( event ) => {
                        const { checked } = event.target;
                        updateSelectedRows( ( current ) => {
                          const next = new Set( current );
                          if ( checked ) {
                            next.add( cardId );
                          } else {
                            next.delete( cardId );
                          }
                          return next;
                        } );
                      } }
                      aria-label="Select card"
                    />
                    Select
                  </label>
                ) }
                <div className="relative mx-auto w-full max-w-[16rem] [perspective:1500px]">
                  <div
                    className={ `grid w-full transition-transform duration-[800ms] [transform-style:preserve-3d] [transition-timing-function:cubic-bezier(0.75,0,0.85,1)] ${ isFlipped ? "[transform:rotateY(180deg)]" : "" }` }
                  >
                    <div
                      className="col-start-1 row-start-1 flex w-full flex-col overflow-hidden rounded-[6px] shadow-lg [backface-visibility:hidden] [transform-style:preserve-3d]"
                      role="button"
                      tabIndex={ 0 }
                      aria-pressed={ isFlipped }
                      onClick={ () => toggleFlip( card._id ) }
                      onKeyDown={ ( event ) => {
                        if ( event.key === "Enter" || event.key === " " ) {
                          event.preventDefault();
                          toggleFlip( card._id );
                        }
                      } }
                    >
                      <div className="relative flex aspect-[260/360] h-full max-h-[31rem] w-full items-center justify-center overflow-hidden rounded-[6px] border border-white/10 bg-black/40 transition duration-300 group-hover:border-indigo-400/60 dark:border-white/20 dark:bg-gray-900/60">
                        <img
                          className="mx-auto h-full w-full object-top object-cover"
                          src={ primaryImageSrc }
                          alt={ `Card Image - ${ card.productName }` }
                          loading="lazy"
                          data-next-src={ secondaryImageSrc || "" }
                          data-fallback-src={ FALLBACK_IMAGE }
                          onError={ handleCardImageError }
                        />
                        <div
                          aria-hidden="true"
                          className="absolute -inset-px rounded-[6px] bg-gradient-to-t from-black/90 via-black/45 to-black/25 opacity-95 transition-opacity duration-300 group-hover:opacity-100"
                        />
                        { ( formatCurrency( card.marketPrice ) || card.rarity || card.printing ) && (
                          <div className="pointer-events-none absolute inset-0 flex h-full items-end justify-start overflow-hidden rounded-[6px] [transform:translateZ(80px)]">
                            <div
                              aria-hidden="true"
                              className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent opacity-90"
                            />

                            <div className="relative flex w-full flex-col gap-1 p-4 text-left text-white text-shadow">
                              <h3 className="line-clamp-3 text-base font-semibold leading-tight text-pretty break-words">{ card.productName }</h3>
                              { formatCurrency( card.marketPrice ) && (
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="text-lg font-semibold">{ formatCurrency( card.marketPrice ) }</p>
                                  <PriceTrendIndicator
                                    previousPrice={ card.oldPrice }
                                    currentPrice={ card.marketPrice }
                                    compact={ true }
                                  />
                                </div>
                              ) }
                              <p className="text-xs font-medium uppercase tracking-wide">
                                { [ card.rarity, card.printing ].filter( Boolean ).join( " / " ) }
                              </p>
                              { folderLabels.length > 0 && (
                                <p className="line-clamp-1 text-[0.68rem] font-semibold uppercase tracking-wide text-indigo-100">
                                  { folderLabels.slice( 0, 2 ).join( " / " ) }
                                </p>
                              ) }
                              <span className="mt-2 inline-flex min-h-10 w-fit min-w-10 items-center justify-center rounded-[4px] border border-white/35 bg-black/35 px-4 py-2 text-center text-xs font-semibold uppercase leading-tight tracking-[0.08em] text-white shadow-[0_0_6px_rgba(0,0,0,0.3)]">
                                Details
                              </span>
                            </div>
                          </div>
                        ) }
                      </div>
                    </div>
                    <div className="col-start-1 row-start-1 flex aspect-[260/360] min-h-0 w-full flex-col overflow-hidden rounded-[6px] border border-white/10 bg-black p-5 text-white shadow-lg dark:border-white/20 dark:bg-gray-900/80 [backface-visibility:hidden] [transform:rotateY(180deg)] [transform-style:preserve-3d]">
                      <div className="flex h-full min-h-0 flex-col justify-between gap-2 [transform:translateZ(80px)_scale(0.94)]">
                        <div className="text-[0.8rem] font-semibold text-white">
                          <h3 className="line-clamp-3 min-w-0 break-words text-center text-base font-semibold leading-tight text-white">
                            { card.productName }
                          </h3>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto pr-2 text-[0.86rem] font-semibold leading-[1.4] text-white/80 [scrollbar-width:thin]">
                          { detailEntries.map( ( entry ) => (
                            <div key={ entry.label } className="mb-2 rounded-[5px] border-b border-white/5 pb-2 last:border-b-0">
                              <span className="block text-[0.65rem] font-bold uppercase tracking-wide text-white/60 sm:text-xs">
                                { entry.label }
                              </span>
                              <span className="block min-w-0 break-words text-white">{ entry.value }</span>
                            </div>
                          ) ) }
                        </div>
                        <div className="mx-auto flex w-full flex-wrap gap-1.5 text-pretty">
                          <Link
                            className="inline-flex min-h-8 w-full items-center justify-center rounded-[4px] border border-white/20 bg-white/10 px-3 py-1.5 text-center text-xs font-semibold uppercase leading-tight tracking-[0.08em] text-white transition duration-300 hover:border-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-100"
                            href={ {
                              pathname: "/yugioh/sets/[letter]/cards/card-details",
                              query: cardDetailsQuery,
                            } }
                          >
                            View Details
                          </Link>
                          <button
                            type="button"
                            className="inline-flex min-h-8 w-full items-center justify-center rounded-[4px] border border-white/20 bg-transparent px-3 py-1.5 text-center text-xs font-semibold uppercase leading-tight tracking-[0.08em] text-white transition duration-300 hover:border-indigo-400 hover:text-indigo-200"
                            onClick={ () => toggleFlip( card._id, false ) }
                          >
                            Show Card Front
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 space-y-5 rounded-[6px] border border-white/10 bg-black/35 p-4 text-sm text-white/80">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <span className="text-xs font-semibold uppercase tracking-wide text-white/60">Quantity</span>
                    { edit[ card._id ] === "quantity" ? (
                      <input
                        type="number"
                        name="quantity"
                        value={ editValues[ card._id ]?.quantity ?? "" }
                        onChange={ ( event ) => handleChange( event, card._id, "quantity" ) }
                        onBlur={ () => handleSave( card._id, "quantity" ) }
                        onKeyDown={ handleQuantityKeyDown }
                        className="min-w-[4rem] rounded border border-white/30 bg-black/60 px-3 py-1 text-center text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
                        min={ 0 }
                      />
                    ) : (
                      <button
                        type="button"
                        className={ `${ displayInputClasses } cursor-pointer` }
                        onClick={ () => handleEdit( card._id, "quantity" ) }
                      >
                        { quantity }
                      </button>
                    ) }
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-semibold uppercase tracking-wide text-rose-300">Remove Amount</span>
                    { edit[ card._id ] === "deleteAmount" ? (
                      <input
                        className="min-w-[4rem] rounded border border-rose-300/60 bg-black/60 px-3 py-1 text-center text-white focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/60"
                        type="number"
                        min={ 0 }
                        max={ Math.max( quantity, 0 ) }
                        value={ editValues[ card._id ]?.deleteAmount ?? 0 }
                        onChange={ ( event ) =>
                          setEditValues( ( prev ) => ( {
                            ...prev,
                            [ card._id ]: {
                              ...prev[ card._id ],
                              deleteAmount: Number.parseInt( event.target.value, 10 ) || 0,
                            },
                          } ) )
                        }
                        onBlur={ handleDeleteAmountBlur }
                        onKeyDown={ handleDeleteAmountKeyDown }
                      />
                    ) : (
                      <button
                        type="button"
                        className={ `${ displayInputClassesRose } cursor-pointer` }
                        onClick={ () => handleEdit( card._id, "deleteAmount" ) }
                      >
                        { removeAmount }
                      </button>
                    ) }
                  </div>
                </div>
              </div>
            );
          } ) }
        </div>
      </div>

      <Notification
        show={ notification.show }
        setShow={ ( show ) => setNotification( ( prev ) => ( { ...prev, show } ) ) }
        message={ notification.message }
      />
    </>
  );
};

export default GridView;
