import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { readAuthStateFromCookie, subscribeToAuthState, dispatchAuthStateChange } from "@/utils/authState";

const normalizePath = ( path ) => {
  if ( !path ) {
    return "/";
  }

  const [ base ] = path.split( "?" );
  const cleanBase = base.split( "#" )[ 0 ];
  if ( !cleanBase || cleanBase === "/" ) {
    return cleanBase || "/";
  }

  return cleanBase.replace( /\/+$/, "" );
};

const NAV_LINKS = [
  {
    href: "/yugioh",
    label: "Yu-Gi-Oh! Card Prices",
    title: "Search for current Yu-Gi-Oh! card prices",
    icon: "/images/icons/yugioh/yugiohPrices.svg",
    matcher: ( path ) => path === "/yugioh",
  },
  {
    href: "/yugioh/sets/set-index",
    label: "Browse Yu-Gi-Oh! Sets",
    title: "Browse Yu-Gi-Oh! sets",
    icon: "/images/icons/yugioh/browseSets.svg",
    matcher: ( path ) => path === "/yugioh/sets/set-index" || path.startsWith( "/yugioh/sets/" ),
  },
  {
    href: "/yugioh/deck-builder",
    label: "Yu-Gi-Oh! Deck Builder",
    title: "Build and test decks",
    icon: "/images/icons/yugioh/deckBuilder.svg",
    matcher: ( path ) => path.startsWith( "/yugioh/deck-builder" ),
  },
  {
    href: "/sports",
    label: "Sports Card Prices",
    title: "Get current sports card prices",
    icon: "/images/icons/sports/sportsPrices.svg",
    matcher: ( path ) => path === "/sports" || path.startsWith( "/sports/" ),
  },
  {
    href: "/yugioh/my-collection",
    label: "My Collection",
    title: "View your saved cards",
    icon: "/images/icons/yugioh/collection.svg",
    matcher: ( path ) => path.startsWith( "/yugioh/my-collection" ),
  },
];

export default function SideNav() {
  const router = useRouter();
  const [ isAuthenticated, setIsAuthenticated ] = useState( false );
  const [ activeHref, setActiveHref ] = useState( () => {
    const currentPath = normalizePath( router.asPath ?? router.pathname ?? "" );
    const match = NAV_LINKS.find( ( link ) => link.matcher( currentPath ) );
    return match?.href ?? NAV_LINKS[ 0 ].href;
  } );


  useEffect( () => {
    const currentPath = normalizePath( router.asPath ?? router.pathname ?? "" );
    const match = NAV_LINKS.find( ( link ) => link.matcher( currentPath ) );
    if ( match ) {
      setActiveHref( match.href );
    }
  }, [ router.asPath, router.pathname ] );



  const refreshAuthState = useCallback( () => {
    setIsAuthenticated( readAuthStateFromCookie() );
  }, [] );

  useEffect( () => {
    refreshAuthState();

    const unsubscribe = subscribeToAuthState( ( state ) => {
      setIsAuthenticated( state );
    } );

    const handleFocus = () => refreshAuthState();
    window.addEventListener( "focus", handleFocus );

    return () => {
      unsubscribe();
      window.removeEventListener( "focus", handleFocus );
    };
  }, [ refreshAuthState ] );

  useEffect( () => {
    refreshAuthState();
  }, [ router.asPath, refreshAuthState ] );

  const handleLogout = async () => {
    try {
      await fetch( "/api/auth/logout", {
        method: "POST",
        credentials: "include",
      } );
      setIsAuthenticated( false );
      dispatchAuthStateChange( false );
      router.push( "/logout" );
    } catch {
      console.error( "Logout failed" );
    }
  };

  return (
    <nav className="mx-auto w-full">
      <ul className="block flex-1 px-2 py-2 gap-3">
        { NAV_LINKS.map( ( item ) => {
          const isActive = activeHref === item.href;

          return (
            <li key={ item.href } className="navButton max-w-prose text-nowrap">
              <Link
                href={ item.href }
                title={ item.title }
                className={ `navLink${ isActive ? " navLink-active" : "" }` }
                onClick={ () => setActiveHref( item.href ) }
                aria-current={ isActive ? "page" : undefined }
              >
                <span className="navLink-circle">
                  <Image
                    src={ item.icon }
                    alt={ `${ item.label } icon` }
                    width={ 24 }
                    height={ 24 }
                    className="navLink-iconImage object-center object-cover"
                  />
                </span>
                <span className="navLink-label">
                  { item.label }
                </span>
              </Link>
            </li>
          );
        } ) }
        <div className="block mt-5 py-1 text-sm/6 text-gray-900 focus:bg-gray-50 focus:outline-hidden">
          { isAuthenticated ? (
            <button
              onClick={ handleLogout }
              className="mx-auto w-3/4 block text-nowrap px-16 py-3 rounded-lg border border-white bg-red-500/20 text-center text-sm font-semibold tracking-wide text-red-100 transition hover:bg-red-500/30"
              title="Log out"
            >
              Log Out
            </button>
          ) : (
            !isAuthenticated && (
              <Link
                href="/login"
                title="Log in"
                className="mx-auto w-3/4 text-nowrap block px-16 py-3 rounded-lg border border-white bg-white/5 text-center text-sm font-semibold tracking-wide text-white/90 transition hover:bg-white/10"
              >
                Log In
              </Link>
            )
          ) }
        </div>
      </ul>
    </nav>
  );
}

