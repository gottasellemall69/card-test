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

  const links = [
    { href: "/yugioh", label: "Yu-Gi-Oh! Card Prices", title: "Search for current Yu-Gi-Oh! card prices" },
    { href: "/yugioh/sets/set-index", label: "Browse Yu-Gi-Oh! Sets", title: "Browse Yu-Gi-Oh! sets" },
    { href: "/yugioh/deck-builder", label: "Yu-Gi-Oh! Deck Builder", title: "Build and test decks" },
    { href: "/sports", label: "Sports Card Prices", title: "Get current sports card prices" },
    { href: "/yugioh/my-collection", label: "My Collection", title: "View your saved cards" },
  ];

  return (
    <nav className="flex max-h-fit flex-col justify-between px-4 py-6">
      <ul className="space-y-3">
        { links.map( ( item ) => (
          <li key={ item.href } className="navButton">
            <Link href={ item.href } title={ item.title } passHref>
              <span className="block">
                { item.label }
              </span>
            </Link>
          </li>
        ) ) }
      </ul>

      <div className="mt-6 space-y-3">
        { isAuthenticated ? (
          <button
            onClick={ handleLogout }
            className="w-full rounded-lg border border-white/10 bg-red-500/20 px-4 py-2 text-sm font-semibold tracking-wide text-red-100 transition hover:bg-red-500/30"
            title="Log out"
          >
            Log Out
          </button>
        ) : (
          !isAuthenticated && (
            <Link
              href="/login"
              title="Log in"
              passHref
              className="block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-center text-sm font-semibold tracking-wide text-white/90 transition hover:bg-white/10"
            >
              Log In
            </Link>
          )
        ) }
      </div>
    </nav>
  );
}
