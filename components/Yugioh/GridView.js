﻿import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import Notification from "@/components/Notification";
import cardData from "@/public/card-data/Yugioh/card_data.json";

const FALLBACK_IMAGE = "/images/yugioh-card.png";

const formatCurrency = ( value ) => {
  const numeric = Number( value );
  if ( !Number.isFinite( numeric ) ) {
    return null;
  }
  return `$${ numeric.toFixed( 2 ) }`;
};

const GridView = ( { aggregatedData, onDeleteCard, onUpdateCard } ) => {
  const [ edit, setEdit ] = useState( {} );
  const [ editValues, setEditValues ] = useState( {} );
  const [ notification, setNotification ] = useState( { show: false, message: "" } );
  const [ flippedCards, setFlippedCards ] = useState( {} );
  const [ sortField, setSortField ] = useState( "productName" );
  const [ sortDirection, setSortDirection ] = useState( "asc" );

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

  const getCardImage = useCallback(
    ( cardName ) => {
      const cardInfo = cardData.find( ( item ) => item.name === cardName );
      return cardInfo ? getFullImagePath( cardInfo.id ) : null;
    },
    [ getFullImagePath ],
  );

  const memoizedAggregatedData = useMemo( () => {
    if ( !Array.isArray( aggregatedData ) ) return [];

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
  }, [ aggregatedData, sortField, sortDirection ] );

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-sm text-white/80">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-medium text-white/70">Sort</span>
          <select
            value={ sortField }
            onChange={ ( event ) => setSortField( event.target.value ) }
            className="rounded-lg border border-white/15 bg-black/60 px-3 py-2 text-sm font-medium text-white/80 shadow-sm transition hover:border-white/40 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
          >
            <option value="productName">Card Name</option>
            <option value="setName">Set Name</option>
            <option value="number">Card Number</option>
            <option value="rarity">Card Rarity</option>
            <option value="quantity">Quantity</option>
            <option value="marketPrice">Market Price</option>
            <option value="condition">Card Condition</option>
          </select>
        </div>
        <button
          type="button"
          onClick={ () => setSortDirection( ( prev ) => ( prev === "asc" ? "desc" : "asc" ) ) }
          className="inline-flex items-center rounded-lg border border-white/15 bg-black/60 px-3 py-2 text-sm font-semibold uppercase tracking-wide text-white/80 transition hover:border-white/40 hover:text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
        >
          { sortDirection === "asc" ? "Asc" : "Desc" }
        </button>
      </div>

      <div className="w-auto overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-2xl">
        <div className="grid grid-cols-1 border-l border-white/5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          { memoizedAggregatedData.map( ( card ) => {
            if ( !card ) return null;

            const cardImage = getCardImage( card.productName );
            const cardInfo = cardData.find( ( item ) => item.name === card.productName );
            const imageSrc = cardImage || card.remoteImageUrl || FALLBACK_IMAGE;
            const isFlipped = Boolean( flippedCards[ card._id ] );
            const quantity = Number( card.quantity ) || 0;
            const removeAmount = editValues[ card._id ]?.deleteAmount || 1;

            const detailEntries = [
              { label: "Set", value: card.setName },
              { label: "Number", value: card.number },
              { label: "Rarity", value: card.rarity },
              { label: "Printing", value: card.printing },
              { label: "Condition", value: card.condition },
              { label: "Old Price", value: formatCurrency( card.oldPrice ) },
              { label: "Market Price", value: formatCurrency( card.marketPrice ) },
              { label: "Low Price", value: formatCurrency( card.lowPrice ) },
            ].filter( ( entry ) => entry.value );

            const letterCandidate = ( card.setName || card.productName || "" ).trim();
            const computedLetter = letterCandidate ? letterCandidate.charAt( 0 ).toUpperCase() : undefined;

            const cardDetailsQuery = ( () => {
              const query = { source: "collection" };

              if ( cardInfo?.id ) query.card = cardInfo.id;
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
                className="group relative flex flex-col border border-white/10 bg-black/40 p-4 transition hover:border-indigo-400/50 sm:p-6"
              >
                <div className={ `relative w-full flip-card ${ isFlipped ? "flipped" : "" }` }>
                  <div className="flip-card-inner h-full min-h-[24rem]">
                    <div
                      className="flip-card-front flex h-full flex-col gap-4"
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
                      <div className="relative min-h-[24rem] w-full overflow-ellipsis rounded-sm border border-white/10 bg-black/40 shadow-lg transition duration-200 group-hover:border-indigo-400/60 dark:border-white/20 dark:bg-gray-900/60">
                        <img
                          className="mx-auto aspect-1 min-h-[24rem] w-full object-cover object-top sm:object-scale-down"
                          src={ imageSrc }
                          alt={ `Card Image - ${ card.productName }` }
                          loading="lazy"
                        />
                        { ( formatCurrency( card.marketPrice ) || card.rarity || card.printing ) && (
                          <div className="pointer-events-none absolute inset-x-0 top-0 flex h-full items-end justify-start overflow-hidden rounded-lg p-4">
                            <div
                              aria-hidden="true"
                              className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-90"
                            />
                            <div className="relative flex flex-col gap-1 text-white">
                              { formatCurrency( card.marketPrice ) && (
                                <p className="text-lg font-semibold">{ formatCurrency( card.marketPrice ) }</p>
                              ) }
                              <p className="text-xs font-medium uppercase tracking-wide">
                                { [ card.rarity, card.printing ].filter( Boolean ).join( " • " ) }
                              </p>
                            </div>
                          </div>
                        ) }
                      </div>
                    </div>
                    <div className="flip-card-back flex h-full min-h-[24rem] flex-col justify-between gap-4 rounded border border-white/10 bg-black/80 p-4 text-white shadow-lg dark:border-white/20 dark:bg-gray-900/80">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-center">{ card.productName }</h3>
                        <div className="space-y-2 text-sm text-white/80">
                          { detailEntries.map( ( entry ) => (
                            <div key={ entry.label } className="flex items-start justify-between gap-3">
                              <span className="font-semibold uppercase tracking-wide text-white/60">{ entry.label }</span>
                              <span className="text-right text-white">{ entry.value }</span>
                            </div>
                          ) ) }
                        </div>
                      </div>
                      <div className="flex flex-row mx-auto">
                        <Link
                          href={ {
                            pathname: "/yugioh/sets/[letter]/cards/card-details",
                            query: cardDetailsQuery,
                          } }
                          className="inline-flex w-full items-center justify-center rounded-md border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-indigo-400 hover:bg-indigo-500/20"
                        >
                          View Details
                        </Link>
                        <button
                          type="button"
                          className="inline-flex w-full items-center justify-center rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:border-indigo-400 hover:text-indigo-200"
                          onClick={ () => toggleFlip( card._id, false ) }
                        >
                          Show Card Front
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-semibold uppercase tracking-wide text-white/60">Quantity</span>
                    { edit[ card._id ] === "quantity" ? (
                      <input
                        type="number"
                        name="quantity"
                        value={ editValues[ card._id ]?.quantity ?? "" }
                        onChange={ ( event ) => handleChange( event, card._id, "quantity" ) }
                        onBlur={ () => handleSave( card._id, "quantity" ) }
                        onKeyDown={ handleQuantityKeyDown }
                        className="w-20 rounded-lg border border-white/30 bg-black/60 px-2 py-1 text-center text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
                        min={ 0 }
                      />
                    ) : (
                      <button
                        type="button"
                        className="text-sm font-semibold text-white transition hover:text-indigo-200"
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
                        className="w-20 rounded-lg border border-white/30 bg-black/60 px-2 py-1 text-center text-white focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/60"
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
                        className="text-sm font-semibold text-rose-300 transition hover:text-rose-200"
                        onClick={ () => handleEdit( card._id, "deleteAmount" ) }
                      >
                        { removeAmount }
                      </button>
                    ) }
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      className="inline-flex w-full items-center justify-center rounded-md border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-indigo-400 hover:bg-indigo-500/20"
                      onClick={ () => updateQuantity( card._id, Math.max( 0, quantity - 1 ) ) }
                    >
                      Remove 1
                    </button>
                    <button
                      type="button"
                      className="inline-flex w-full items-center justify-center rounded-md border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-emerald-400 hover:bg-emerald-500/20"
                      onClick={ () => updateQuantity( card._id, quantity + 1 ) }
                    >
                      Add 1
                    </button>
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
