import { useCallback, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Notification from '@/components/Notification';
import cardData from '@/public/card-data/Yugioh/card_data.json';

const GridView = ( { aggregatedData, onDeleteCard, onUpdateCard } ) => {
  const router = useRouter();
  const { productName, cardId, card, setName, letter, lowPrice, ebay_price } = router.query;
  const [ edit, setEdit ] = useState( {} );
  const [ editValues, setEditValues ] = useState( {} );
  const [ notification, setNotification ] = useState( { show: false, message: '' } );
  const [ flippedCards, setFlippedCards ] = useState( {} );
  const [ sortField, setSortField ] = useState( 'setName' );
  const [ sortDirection, setSortDirection ] = useState( 'asc' );


  const handleEdit = ( cardId, field ) => {
    setEdit( prev => ( { ...prev, [ cardId ]: field } ) );
    const card = aggregatedData.find( ( card ) => card._id === cardId );
    if ( card ) {
      setEditValues( prev => ( { ...prev, [ cardId ]: { ...card } } ) );
    }
  };

  const handleChange = ( e, cardId, field ) => {
    const { value } = e.target;
    setEditValues( ( prev ) => ( {
      ...prev,
      [ cardId ]: { ...prev[ cardId ], [ field ]: value },
    } ) );
  };

  const handleSave = useCallback( async ( cardId, field ) => {
    try {
      const value = parseFloat( editValues[ cardId ][ field ] );
      await onUpdateCard( cardId, field, value );
      setEdit( ( prev ) => ( { ...prev, [ cardId ]: null } ) );
      setNotification( { show: true, message: 'Card quantity updated successfully!' } );
    } catch ( error ) {
      console.error( 'Error saving card:', error );
    }
  }, [ editValues, onUpdateCard ] );

  const updateQuantity = useCallback( async ( cardId, quantity ) => {
    try {
      if ( quantity <= 0 ) {
        await onDeleteCard( cardId );
        setNotification( { show: true, message: 'Card deleted successfully!' } );
      } else {
        await onUpdateCard( cardId, 'quantity', quantity );
        setNotification( { show: true, message: 'Card quantity updated successfully!' } );
      }
    } catch ( error ) {
      console.error( 'Error updating quantity:', error );
    }
  }, [ onDeleteCard, onUpdateCard ] );

  const handleDelete = useCallback( async ( cardId ) => {
    const card = aggregatedData.find( ( card ) => card?._id === cardId );
    if ( card ) {
      const newQuantity = parseFloat( card.quantity ) - 1;
      await updateQuantity( cardId, newQuantity );
    }
  }, [ aggregatedData, updateQuantity ] );

  const getFullImagePath = useCallback( ( cardId ) => `/images/yugiohImages/${ String( cardId ) }.jpg`, [] );

  const getCardImage = useCallback( ( cardName ) => {
    const cardInfo = cardData.find( item => item.name === cardName );
    return cardInfo ? { full: getFullImagePath( cardInfo.id ) } : null;
  }, [ getFullImagePath ] );

  const toggleFlip = ( id ) => {
    setFlippedCards( prev => ( { ...prev, [ id ]: !prev[ id ] } ) );
  };

  const memoizedAggregatedData = useMemo( () => {
    if ( !Array.isArray( aggregatedData ) ) return [];

    const sortedData = [ ...aggregatedData ];

    sortedData.sort( ( a, b ) => {
      const aValue = a?.[ sortField ];
      const bValue = b?.[ sortField ];

      if ( aValue === null || bValue === null ) return 0;
      if ( aValue === null ) return 1;
      if ( bValue === null ) return -1;

      if ( typeof aValue === 'number' && typeof bValue === 'number' ) {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const aStr = String( aValue ).toLowerCase();
      const bStr = String( bValue ).toLowerCase();

      return sortDirection === 'asc' ? aStr.localeCompare( bStr ) : bStr.localeCompare( aStr );
    } );

    return sortedData;
  }, [ aggregatedData, sortField, sortDirection ] );


  return (
    <>

      <div className="flex gap-4 items-start mb-4 mx-auto sm:mx-0 w-fit">
        <label className="text-shadow">Sort by:</label>
        <select
          value={ sortField }
          onChange={ ( e ) => setSortField( e.target.value ) }
          className="px-2 py-1 rounded bg-white text-black font-semibold text-start"
        >
          <option value="productName">Card Name</option>
          <option value="setName">Set Name</option>
          <option value="number">Card Number</option>
          <option value="rarity">Card Rarity</option>
          <option value="quantity">Quantity</option>
          <option value="marketPrice">Market Price</option>
          <option value="condition">Card Condition</option>
        </select>

        <button
          onClick={ () => setSortDirection( prev => prev === 'asc' ? 'desc' : 'asc' ) }
          className="px-2 py-1 rounded bg-white text-black font-semibold text-center"
        >
          { sortDirection === 'asc' ? '▲ Ascending' : '▼ Descending' }
        </button>
      </div>

      <div className="container box-content w-full mx-auto flex flex-wrap flex-col gap-5 sm:grid sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">

        <Notification
          show={ notification.show }
          setShow={ ( show ) => setNotification( ( prev ) => ( { ...prev, show } ) ) }
          message={ notification.message }
        />


        { memoizedAggregatedData?.map( ( card ) => {
          if ( !card || !card.setName ) return null;
          const cardImages = getCardImage( card.productName );
          const cardInfo = cardData.find( item => item.name === card.productName );
          const isFlipped = flippedCards[ card._id ];

          return (
            <div
              key={ card._id }
              className={ `glass rounded-md flip-card card group mx-auto ${ flippedCards[ card._id ] ? 'flipped' : '' }` }
            >
              <div
                className="flip-card-inner hover:cursor-pointer "
                onClick={ () => toggleFlip( card._id ) }
              >
                {/* FRONT */ }
                <div className="flip-card-front">
                  <img
                    className="w-full h-96 aspect-auto object-scale-down object-center"
                    as="image"
                    priority="true"
                    unoptimized="true"
                    src={ cardImages ? cardImages.full : '/images/yugioh-card.png' }
                    alt={ `${ card.productName }` }
                    width={ 1600 }
                    height={ 1600 }
                  />
                </div>

                {/* BACK */ }
                <div className="flip-card-back p-5 mx-auto cursor-default glass backdrop-opacity-15 text-white text-shadow overflow-hidden">

                  <div>
                    <h3 className="text-xl font-bold text-center">{ card.productName }</h3>
                    <div className="text-sm space-y-1 mt-2 text-shadow">
                      <div className="flex justify-between"><span className="font-bold">Set:</span> <span className='text-pretty text-end'>{ card.setName }</span></div>
                      <div className="flex justify-between"><span className="font-bold">Number:</span> <span>{ card.number }</span></div>
                      <div className="flex justify-between"><span className="font-bold">Rarity:</span> <span>{ card.rarity }</span></div>
                      <div className="flex justify-between"><span className="font-bold">Printing:</span> <span>{ card.printing }</span></div>
                      <div className="flex justify-between"><span className="font-bold">Condition:</span> <span>{ card.condition }</span></div>
                      <div className="flex justify-between"><span className="font-bold">Old Price:</span> <span>${ card.oldPrice }</span></div>
                      <div className="flex justify-between"><span className="font-bold">Market Price:</span> <span>${ card.marketPrice }</span></div>
                    </div>
                  </div>
                  <Link
                    href={ {
                      pathname: "/yugioh/sets/[letter]/cards/card-details",
                      query: {
                        card: cardInfo?.id,
                        letter: card.setName.charAt( 0 ).toUpperCase(),
                        set_name: card.setName,
                        set_code: card.number,
                        rarity: card.rarity,
                        edition: card.printing || "Unknown Edition",
                        source: 'collection'
                      }
                    } }
                  >

                    <p className='hover:cursor-pointer p-2 mx-auto text-shadow text-2xl mt-5 max-w-prose text-center underline hover:no-underline underline-offset-2'>
                      More Details
                    </p>
                  </Link>
                </div>
              </div>
              <div className="mx-auto flex justify-between items-center mt-4 mb-5 glass p-2 rounded-sm gap-4 flex-wrap">
                {/* Quantity Editing */ }
                <div className="text-sm text-white text-shadow">
                  <span>Quantity: </span>
                  { edit[ card._id ] === 'quantity' ? (
                    <input
                      type="number"
                      name="quantity"
                      value={ editValues[ card._id ]?.quantity || '' }
                      onChange={ ( e ) => handleChange( e, card._id, 'quantity' ) }
                      onBlur={ () => handleSave( card._id, 'quantity' ) }
                      className="w-16 text-center px-2 py-1 glass mx-auto"
                    />
                  ) : (
                    <span
                      className="cursor-pointer hover:text-purple-300 transition-colors"
                      onClick={ () => handleEdit( card._id, 'quantity' ) }
                    >
                      { card.quantity }
                    </span>
                  ) }
                </div>

                {/* Custom Delete Amount Input + Button */ }
                <div className="text-sm text-white text-shadow flex gap-2 items-center">
                  <span className='text-shadow text-rose-400'>Delete: </span>
                  { edit[ card._id ] === 'deleteAmount' ? (
                    <input
                      type="number"
                      min={ 0 }
                      max={ card.quantity }
                      value={ editValues[ card._id ]?.deleteAmount || 0 }
                      onChange={ ( e ) =>
                        setEditValues( ( prev ) => ( {
                          ...prev,
                          [ card._id ]: {
                            ...prev[ card._id ],
                            deleteAmount: parseInt( e.target.value ) || 0,
                          },
                        } ) )
                      }
                      onBlur={ () => {
                        const deleteQty = editValues[ card._id ]?.deleteAmount || 0;
                        const currentQty = card.quantity || 1;
                        const newQty = Math.max( 0, currentQty - deleteQty );

                        updateQuantity( card._id, newQty );

                        // Reset input only if card remains
                        if ( newQty > 0 ) {
                          setEditValues( ( prev ) => ( {
                            ...prev,
                            [ card._id ]: {
                              ...prev[ card._id ],
                              deleteAmount: 0,
                            },
                          } ) );
                        }

                        setEdit( ( prev ) => ( { ...prev, [ card._id ]: null } ) );
                      } }

                      className="w-16 text-center px-2 py-1 glass mx-auto"
                    />
                  ) : (
                    <span
                      className="cursor-pointer hover:text-red-300 transition-colors"
                      onClick={ () => handleEdit( card._id, 'deleteAmount' ) }
                      onBlur={ () => handleDelete( card._id, 'deleteAmount' ) }
                    >
                      { editValues[ card._id ]?.deleteAmount || 0 }
                    </span>
                  ) }
                </div>

              </div>
            </div>
          );
        } ) }
      </div>
    </>
  );
};

export default GridView;
