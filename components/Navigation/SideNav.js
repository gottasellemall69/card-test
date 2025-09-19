import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/router";

export default function SideNav() {
  const [ isAuthenticated, setIsAuthenticated ] = useState( false );
  const router = useRouter();

  useMemo( () => {
    const checkAuth = async () => {
      try {
        const res = await fetch( "/api/auth/validate", {
          method: "GET",
          credentials: "include",
        } );
        setIsAuthenticated( res.ok );
      } catch {
        setIsAuthenticated( false );
      }
    };

    checkAuth();
  }, [ router ] );

  const handleLogout = async () => {
    try {
      await fetch( "/api/auth/logout", {
        method: "POST",
        credentials: "include",
      } );
      setIsAuthenticated( false );
      router.push( "/logout" );
    } catch {
      console.error( "Logout failed" );
    }
  };

  return (
    <nav className="p-4 min-h-max z-50">
      <ul className="inset-2 rounded-lg bg-opacity-50">
        <li className="navButton mb-2 rounded-lg`">
          <Link href="/yugioh" title={ "Search for current Yu-Gi-Oh! card prices" } passHref>
            <span className="rounded-none block w-full text-left p-2 text-white bg-clip-padding border border-zinc-600 font-semibold backdrop-opacity-90 backdrop-blur-md hover:bg-zinc-400 bg-gradient-to-tr to-neutral-400 from-purple-800 hover:text-white">
              Yu-Gi-Oh! Card Prices
            </span>
          </Link>
        </li>

        <li className="navButton mb-2 rounded-lg`">
          <Link href="/yugioh/sets/set-index" title={ "Browse Yu-Gi-Oh! sets" } passHref>
            <span className="rounded-none block w-full text-left p-2 text-white bg-clip-padding border border-zinc-600 font-semibold backdrop-opacity-90 backdrop-blur-md hover:bg-zinc-400 bg-gradient-to-tr to-neutral-400 from-purple-800 hover:text-white">
              Browse Yu-Gi-Oh! Sets
            </span>
          </Link>
        </li>

        <li className="navButton mb-2 rounded-lg`">
          <Link href="/yugioh/deck-builder" title={ "Build and test decks" } passHref>
            <span className="rounded-none block w-full text-left p-2 text-white bg-clip-padding border border-zinc-600 font-semibold backdrop-opacity-90 backdrop-blur-md hover:bg-zinc-400 bg-gradient-to-tr to-neutral-400 from-purple-800 hover:text-white">
              Yu-Gi-Oh! Deck Builder
            </span>
          </Link>
        </li>

        <li className="navButton mb-2 rounded-lg`">
          <Link href="/sports" title={ "Get current sports card prices" } passHref>
            <span className="rounded-none block w-full text-left p-2 text-white bg-clip-padding border border-zinc-600 font-semibold backdrop-opacity-90 backdrop-blur-md hover:bg-zinc-400 bg-gradient-to-tr to-neutral-400 from-purple-800 hover:text-white">
              Sports Card Prices
            </span>
          </Link>
        </li>

        <li className="navButton mb-2 rounded-lg">
          <Link href="/yugioh/my-collection" title={ "View your saved cards" } passHref>
            <span className="rounded-none block w-full text-left p-2 text-white bg-clip-padding border border-zinc-600 font-semibold backdrop-opacity-90 backdrop-blur-md hover:bg-zinc-400 bg-gradient-to-tr to-neutral-400 from-purple-800 hover:text-white">
              My Collection
            </span>
          </Link>
        </li>

        { isAuthenticated && (
          <li className="navButton mt-4 rounded">
            <button
              onClick={ handleLogout }
              className="navButton rounded block w-full text-left p-2 text-white bg-clip-padding border border-zinc-600 font-semibold backdrop-opacity-90 backdrop-blur-md hover:bg-zinc-400 bg-gradient-to-tr from-red-900 to-purple-600 hover:text-white"
              title={ "Log out" }
            >
              Log Out
            </button>
          </li>
        ) }
        { !isAuthenticated && (
          <div className="w-full">
            <button className="mt-4 rounded block w-full text-left p-2 bg-clip-padding bg-zinc-800 border border-zinc-600 hover:transition-transform hover:ease-in-out hover:duration-700 font-semibold backdrop-opacity-90 backdrop-blur-md hover:bg-gradient-to-tr hover:from-purple-900 hover:to-green-600">
              <Link
                href="/login"
                title={ "Log in" }
                passHref
              >
                Log In
              </Link>
            </button>
          </div> ) }
      </ul>
    </nav>
  );
}
