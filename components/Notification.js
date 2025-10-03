"use client";
import { useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/20/solid";

const HIDE_DELAY_MS = 2500;

const Notification = ( { show = false, setShow = () => { }, message = "" } ) => {
  const [ isVisible, setIsVisible ] = useState( show );

  useEffect( () => {
    if ( show ) {
      setIsVisible( true );
      const timer = setTimeout( () => {
        setIsVisible( false );
        setShow( false );
      }, HIDE_DELAY_MS );
      return () => clearTimeout( timer );
    }

    const hideTimer = setTimeout( () => setIsVisible( false ), 200 );
    return () => clearTimeout( hideTimer );
  }, [ show, setShow ] );

  if ( !isVisible && !show ) {
    return null;
  }

  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed inset-0 z-[2000] flex items-center justify-center p-4"
    >
      <div
        className={ `pointer-events-auto w-full max-w-md transform rounded-lg bg-white/10 glass backdrop px-6 py-8 text-white shadow-2xl ring-1 ring-black/20 transition-all duration-200 ${ show ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3" }` }
        role="status"
      >
        <div className="flex items-start gap-4">
          <p className="flex-1 text-base font-semibold leading-6">{ message }</p>
          <button
            type="button"
            className="rounded-md p-1 text-slate-300 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-200 focus-visible:ring-offset-slate-900"
            onClick={ () => {
              setIsVisible( false );
              setShow( false );
            } }
          >
            <span className="sr-only">Dismiss notification</span>
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notification;
