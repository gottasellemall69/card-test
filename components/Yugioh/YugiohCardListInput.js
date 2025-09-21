'use client';

import Notification from '@/components/Notification.js';
import { useState } from 'react';

const YugiohCardListInput = ( { cardList, setCardList, handleSubmit, error } ) => {
  const [ notification, setNotification ] = useState( {
    show: false,
    message: ''
  } );

  return (
    <>
      <form
        name="YugiohCardListInput"
        onSubmit={ handleSubmit }
      >
        <div className="text-white">
          <div className='mx-auto object-center self-center place-content-center text-shadow glass'>
            <Notification show={ notification.show } setShow={ ( show ) => setNotification( { ...notification, show } ) } message={ notification.message } />
          </div>
          <textarea
            name="cardListInput"
            className="w-full max-w-7xl rounded-xs flex flex-wrap text-nowrap resize-none h-48 glass bg-transparent"
            value={ cardList }
            onChange={ ( e ) => setCardList( e.target.value ) }
            placeholder="Enter your list of cards..." />
          <button className="border border-white rounded-lg px-2 py-2 mx-auto m-2 text-white font-bold hover:text-black hover:bg-white" type="submit">
            Submit
          </button>
        </div>
      </form>
      { error && <p>{ error }</p> }

    </>
  );
};

export default YugiohCardListInput;
