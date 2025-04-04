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

  const handleEdit = ( cardId, field ) => {
    setEdit( prev => ( { ...prev, [ cardId ]: field } ) );
    const card = aggregatedData.find( ( card ) => card._id === cardId );
    if ( card ) {
      setEditValues( prev => ( { ...prev, [ cardId ]: { ...card } } ) );
    }
  };

  const handleChange = async ( e, cardId, field ) => {
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
        return (
          <div key={ card._id } className="card group mx-auto">
            <div className="wrapper">
              <Link
                href={ {
                  pathname: "/yugioh/sets/[letter]/cards/CardDetails",
                  query: {
                    card: cardInfo?.id,
                    letter: card.setName.charAt( 0 ).toUpperCase(),
                    setName: card.setName
                  }
                } }
                passHref
                as={ `/yugioh/sets/${ card.setName.charAt( 0 ).toUpperCase() }/cards/CardDetails?card=${ encodeURIComponent( String( card.productName ) ) }` }
              >

                <Image
                  className="cover-image"
                  priority={ true }
                  unoptimized={ true }
                  src={ cardImages ? cardImages.full : '/images/yugioh-card.png' }
                  alt={ `${ card.productName }` }
                  quality={ 75 }
                  width={ 210 }
                  height={ 320 }
                />
                <div className="black-overlay">
                  <div className="details p-2 text-center mx-auto">
                    <h3 className="text-xl font-bold text-white text-shadow text-wrap my-5">{ card.productName }</h3>
                    <div className="space-y-1 text-sm mx-auto">
                      <div className="flex justify-evenly gap-2"><span>Set:</span> <span>{ card.setName }</span></div>
                      <div className="flex justify-evenly gap-2"><span>Number:</span> <span>{ card.number }</span></div>
                      <div className="flex justify-evenly gap-2"><span>Rarity:</span> <span>{ card.rarity }</span></div>
                      <div className="flex justify-evenly gap-2"><span>Printing:</span> <span>{ card.printing }</span></div>
                      <div className="flex justify-evenly gap-2"><span>Condition:</span> <span>{ card.condition }</span></div>
                      <div className="flex justify-between font-bold"><span>Old Price:</span> <span>${ card.oldPrice }</span></div>
                      <div className="flex justify-between font-bold"><span>Price:</span> <span>${ card.marketPrice }</span></div>
                    </div>

                  </div>
                </div>
              </Link>
            </div>
            <div className="flex justify-between items-center mb-16 mt-4">
              <div className="text-sm">
                <span className="text-white/60">Quantity: </span>
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
              <button
                onClick={ () => handleDelete( card._id ) }
                className="text-red-400 hover:text-red-300 transition-colors text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        );
      } ) }
    </div>
  );
};

export default GridView;