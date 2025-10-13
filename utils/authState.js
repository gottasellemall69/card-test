const AUTH_STATE_COOKIE = "auth_state";
const AUTH_STATE_EVENT = "auth:changed";

const parseCookieString = ( cookieString ) => {
  if ( typeof cookieString !== "string" || cookieString.length === 0 ) {
    return [];
  }

  return cookieString
    .split( ";" )
    .map( ( entry ) => entry.trim() )
    .filter( Boolean );
};

export const readAuthStateFromCookie = () => {
  if ( typeof document === "undefined" ) {
    return false;
  }

  return parseCookieString( document.cookie ).some( ( cookie ) => {
    if ( !cookie.startsWith( `${ AUTH_STATE_COOKIE }=` ) ) {
      return false;
    }

    const [ , value = "" ] = cookie.split( "=" );
    return value === "1";
  } );
};

export const subscribeToAuthState = ( callback ) => {
  if ( typeof window === "undefined" ) {
    return () => {};
  }

  const handler = ( event ) => {
    if ( typeof callback === "function" ) {
      callback( Boolean( event?.detail?.state ) );
    }
  };

  window.addEventListener( AUTH_STATE_EVENT, handler );
  return () => window.removeEventListener( AUTH_STATE_EVENT, handler );
};

export const dispatchAuthStateChange = ( state ) => {
  if ( typeof window === "undefined" ) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent( AUTH_STATE_EVENT, {
      detail: { state: Boolean( state ) },
    } ),
  );
};
