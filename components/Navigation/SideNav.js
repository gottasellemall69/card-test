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
      router.push( "/login" );
    } catch {
      console.error( "Logout failed" );
    }
  };

  return (
    <nav className="p-4 min-h-max z-50">
      <ul className="inset-2 rounded-lg bg-opacity-10">
        <li className="navButton mb-2 rounded-lg`">
          <Link href="/">
            <span className="rounded-xs block w-full text-left p-2 text-white bg-clip-padding border border-zinc-600 font-semibold backdrop-opacity-90 backdrop-blur-md hover:bg-zinc-400 bg-gradient-to-tr to-neutral-400 from-purple-800 hover:text-white">
              Yu-Gi-Oh! Card Prices
            </span>
          </Link>
        </li>

        <li className="navButton mb-2 rounded-lg`">
          <Link href="/yugioh/sets/set-index">
            <span className="rounded-xs block w-full text-left p-2 text-white bg-clip-padding border border-zinc-600 font-semibold backdrop-opacity-90 backdrop-blur-md hover:bg-zinc-400 bg-gradient-to-tr to-neutral-400 from-purple-800 hover:text-white">
              Browse Yu-Gi-Oh! Sets
            </span>
          </Link>
        </li>

        <li className="navButton mb-2 rounded-lg`">
          <Link href="/yugioh/deck-builder">
            <span className="rounded-xs block w-full text-left p-2 text-white bg-clip-padding border border-zinc-600 font-semibold backdrop-opacity-90 backdrop-blur-md hover:bg-zinc-400 bg-gradient-to-tr to-neutral-400 from-purple-800 hover:text-white">
              Yu-Gi-Oh! Deck Builder
            </span>
          </Link>
        </li>

        <li className="navButton mb-2 rounded-lg`">
          <Link href="/sports">
            <span className="rounded-xs block w-full text-left p-2 text-white bg-clip-padding border border-zinc-600 font-semibold backdrop-opacity-90 backdrop-blur-md hover:bg-zinc-400 bg-gradient-to-tr to-neutral-400 from-purple-800 hover:text-white">
              Sports Card Prices
            </span>
          </Link>
        </li>

        <li className="navButton mb-2 rounded">
          <Link href="/yugioh/">
            <span className="rounded block w-full text-left p-2 text-white bg-clip-padding border border-zinc-600 font-semibold backdrop-opacity-90 backdrop-blur-md hover:bg-zinc-400 bg-gradient-to-tr to-neutral-400 from-purple-800 hover:text-white">
              My Collection
            </span>
          </Link>
        </li>

        { isAuthenticated && (
          <li className="navButton mt-4 rounded">
            <button
              onClick={ handleLogout }
              className="navButton rounded block w-full text-left p-2 text-white bg-clip-padding border border-zinc-600 font-semibold backdrop-opacity-90 backdrop-blur-md hover:bg-zinc-400 bg-gradient-to-tr from-red-900 to-purple-600 hover:text-white"
            >
              Logout
            </button>
          </li>
        ) }
      </ul>
    </nav>
  );
}
