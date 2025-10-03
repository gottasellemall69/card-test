"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { XMarkIcon } from "@heroicons/react/20/solid";

const HIDE_DELAY_MS = 2500;
const HIDE_TRANSITION_MS = 200;

const Notification = ( { show = false, setShow = () => { }, message = "" } ) => {
  const [ isMounted, setIsMounted ] = useState( false );
  const [ isVisible, setIsVisible ] = useState( false );

  useEffect( () => {
    setIsMounted( true );
    return () => setIsMounted( false );
  }, [] );

  useEffect( () => {
    if ( show ) {
      setIsVisible( true );
      const timer = setTimeout( () => {
        setIsVisible( false );
        setShow( false );
      }, HIDE_DELAY_MS );
      return () => clearTimeout( timer );
    }

    if ( isVisible ) {
      const hideTimer = setTimeout( () => setIsVisible( false ), HIDE_TRANSITION_MS );
      return () => clearTimeout( hideTimer );
    }
    return undefined;
  }, [ show, setShow, isVisible ] );

  if ( !isMounted || ( !isVisible && !show ) ) {
    return null;
  }

  const toast = (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed inset-0 z-[2000] flex items-start justify-end px-4 pt-6 pb-4 sm:items-start sm:px-6"
    >
      <div
        className={ `pointer-events-auto w-full max-w-sm transform rounded-2xl glass bg-white backdrop px-6 py-4 text-slate-900 shadow-2xl ring-1 ring-black/20 transition-all duration-200 ${ show ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0" }` }
        role="status"
      >
        <div className="flex items-start gap-4">
          <p className="flex-1 text-lg font-medium leading-6">{ message }</p>
          <button
            type="button"
            className="rounded-md p-1 text-slate-600 transition hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-200 focus-visible:ring-offset-slate-900"
            onClick={ () => {
              setIsVisible( false );
              setShow( false );
            } }
          >
            <span className="sr-only">Dismiss notification</span>
            <XMarkIcon className="h-5 w-5 text-red-700/80" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal( toast, document.body );
};

export default Notification;
