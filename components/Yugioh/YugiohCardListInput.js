'use client';
import Notification from '@/components/Notification.js';
import dynamic from 'next/dynamic';

import { useCallback, useState } from 'react';

const LoadingSpinner = dynamic( () => import( '@/components/LoadingSpinner.js' ), { ssr: false } );

const YugiohCardListInput = ( { cardList, setCardList, handleSubmit, isLoading, error } ) => {
  const [ notification, setNotification ] = useState( {
    show: false,
    message: ''
  } );

  return (
    <div>
      <div className='mx-auto object-center self-center place-content-center z-10 text-shadow font-black'>
        { isLoading && <LoadingSpinner /> }
      </div>
      <div className='mx-auto object-center self-center place-content-center text-shadow glass'>
        <Notification show={ notification.show } setShow={ ( show ) => setNotification( { ...notification, show } ) } message={ notification.message } />
      </div>
      <form
        name="YugiohCardListInput"
        onSubmit={ handleSubmit }
      >
        <div className="text-black">
          <textarea
            name="cardListInput"
            className="w-full max-w-7xl rounded-lg flex flex-wrap text-nowrap resize-none h-48"
            value={ cardList }
            onChange={ ( e ) => setCardList( e.target.value ) }
            placeholder="Enter your list of cards..." />
          <button className="border border-white rounded-lg px-2 py-2 mx-auto m-2 text-white font-bold hover:text-black hover:bg-white" type="submit">
            Submit
          </button>
        </div>
      </form>
      { error && <p>{ error }</p> }
    </div>
  );
};

export default YugiohCardListInput;
