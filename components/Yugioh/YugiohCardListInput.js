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
      <div className='z-50 mx-auto object-center self-center place-content-center'>
        <Notification show={ notification.show } setShow={ ( show ) => setNotification( { ...notification, show } ) } message={ notification.message } />
      </div>
      <form
        name="YugiohCardListInput"
        onSubmit={ handleSubmit }
      >
        <div className="mx-auto w-full text-white">
          <label htmlFor="cardListInput" className="mb-3 block text-sm font-semibold uppercase tracking-wide text-white/70">
            Paste a list of cards
          </label>
          <textarea
            id="cardListInput"
            name="cardListInput"
            className="min-h-[16rem] text-nowrap w-full max-w-[95%] mx-auto resize-none overflow-y-auto rounded-2xl border border-white/10 bg-black/55 px-4 py-4 text-sm text-white shadow-inner placeholder:text-white/45 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
            value={ cardList }
            onChange={ ( e ) => setCardList( e.target.value ) }
            placeholder="Enter cards in order: Name, Set, Number, Edition, Rarity, Condition"
          />
          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm text-white/60">
              One card per line. Commas are optional if the values are in the expected order.
            </p>
            <button
              className="text-nowrap inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/15"
              type="submit"
            >
              Match Cards
            </button>
          </div>
        </div>
      </form>
      { error && <p className="mt-3 rounded-2xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-100">{ error }</p> }

    </>
  );
};

export default YugiohCardListInput;
