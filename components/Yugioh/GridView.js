import { useCallback, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Notification from '@/components/Notification';
import cardData from '@/public/card-data/Yugioh/card_data.json';

const GridView = ( { aggregatedData, onDeleteCard, onUpdateCard } ) => {
  const router = useRouter();
  const { cardId, card, setName, letter } = router.query;
  const [ edit, setEdit ] = useState( {} );
  const [ editValues, setEditValues ] = useState( {} );
  const [ notification, setNotification ] = useState( { show: false, message: '' } );
  const [ flippedCards, setFlippedCards ] = useState( {} ); // 🆕

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

  const memoizedAggregatedData = useMemo( () => aggregatedData, [ aggregatedData ] );

  return (
    <div className="w-full mx-auto flex flex-wrap flex-col gap-5 sm:grid sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
          <>
            <div
              key={ card._id }
              className={ `flip-card card group mx-auto ${ flippedCards[ card._id ] ? 'flipped' : '' }` }
              onClick={ () => toggleFlip( card._id ) }
            >
              <div className="flip-card-inner">
                {/* FRONT */ }
                <div className="flip-card-front">
                  <Image
                    className="w-full h-96 aspect-square object-scale-down object-center"
                    as={ "image" }
                    priority={ true }
                    unoptimized={ true }
                    src={ cardImages ? cardImages.full : '/images/yugioh-card.png' }
                    alt={ `${ card.productName }` }
                    width={ 1600 }
                    height={ 1600 } />
                </div>

                {/* BACK */ }
                <div className="flip-card-back glass text-white text-shadow p-3 overflow-auto">

                  <div>
                    <h3 className="text-xl font-bold">{ card.productName }</h3>
                    <div className="text-sm space-y-1 mt-2 text-shadow">
                      <div className="flex justify-between"><span>Set:</span> <span>{ card.setName }</span></div>
                      <div className="flex justify-between"><span>Number:</span> <span>{ card.number }</span></div>
                      <div className="flex justify-between"><span>Rarity:</span> <span>{ card.rarity }</span></div>
                      <div className="flex justify-between"><span>Printing:</span> <span>{ card.printing }</span></div>
                      <div className="flex justify-between"><span>Condition:</span> <span>{ card.condition }</span></div>
                      <div className="flex justify-between font-bold"><span>Old Price:</span> <span>${ card.oldPrice }</span></div>
                      <div className="flex justify-between font-bold"><span>Price:</span> <span>${ card.marketPrice }</span></div>
                    </div>
                  </div>
                  <Link
                    href={ {
                      pathname: "/yugioh/sets/[letter]/cards/card-details",
                      query: {
                        card: cardInfo?.id,
                        letter: card.setName.charAt( 0 ).toUpperCase(),
                        setName: card.setName,
                      },
                    } }
                    as={ `/yugioh/sets/${ card.setName.charAt( 0 ).toUpperCase() }/cards/card-details?card=${ encodeURIComponent(
                      String( card.productName )
                    ) }` }
                    passHref
                  >
                    <span>
                      <p className='p-2 mx-auto text-shadow text-2xl mt-5 max-w-prose text-center hover:underline'>More Details </p></span>
                  </Link>
                </div>

              </div>
              <div className="mx-auto flex justify-between items-center mt-4 mb-5 glass p-2 rounded-sm">
                <div className="text-sm">
                  <span className="text-white/60">Quantity: </span>
                  { edit[ card._id ] === 'quantity' ? (
                    <input
                      type="number"
                      name="quantity"
                      value={ editValues[ card._id ]?.quantity || '' }
                      onChange={ ( e ) => handleChange( e, card._id, 'quantity' ) }
                      onBlur={ () => handleSave( card._id, 'quantity' ) }
                      className="w-16 text-center px-2 py-1 glass mx-auto" />
                  ) : (
                    <span
                      className="cursor-pointer hover:text-purple-300 transition-colors"
                      onClick={ () => handleEdit( card._id, 'quantity' ) }
                    >
                      { card.quantity }
                    </span>
                  ) }
                </div>
                <button
                  onClick={ () => handleDelete( card._id ) }
                  className="text-red-400 hover:text-red-300 transition-colors text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </>
        );
      } ) }
    </div>
  );
};

export default GridView;
