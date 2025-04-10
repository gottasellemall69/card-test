import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function SideNav() {
  const [ isAuthenticated, setIsAuthenticated ] = useState( false );

  useEffect( () => {
    // Check authentication state on component mount
    const token = localStorage.getItem( "token" );
    setIsAuthenticated( !!token );

    // Poll for token changes as a fallback for storage updates in the same tab
    const tokenPollInterval = setInterval( () => {
      const updatedToken = localStorage.getItem( "token" );
      setIsAuthenticated( !!updatedToken );
    }, 500 ); // Check every 500ms

    // Cleanup interval on component unmount
    return () => {
      clearInterval( tokenPollInterval );
    };
  }, [] );

  const handleLogout = () => {
    localStorage.removeItem( "token" ); // Clear the token from local storage
    setIsAuthenticated( false ); // Update authentication state
    window.location.href = "/login"; // Redirect to the login page
  };

  return (
    <>
      <nav className="p-4 mix-blend-overlay backdrop-opacity-0 z-50">
        <ul className="inset-2">
          <li className="navButton mb-2 rounded">
            <Link href="/" rel="noopener noreferrer">
              <span className=" block w-full text-left p-2 text-white bg-clip-padding border border-gray-700 font-semibold backdrop-opacity-90 backdrop-blur-md hover:bg-zinc-400 bg-gradient-to-tr to-transparent from-purple-800 hover:text-white">
                Yu-Gi-Oh! Card Prices
              </span>
            </Link>
          </li>
          <li className="navButton mb-2 rounded">
            <Link href="/yugioh/sets/set-index" rel="noopener noreferrer">
              <span className="block w-full text-left p-2 text-white bg-clip-padding border border-gray-700 font-semibold backdrop-opacity-90 backdrop-blur-md hover:bg-zinc-400 bg-gradient-to-tr to-transparent from-purple-800 hover:text-white">
                Browse Yu-Gi-Oh! Sets
              </span>
            </Link>
          </li>
          <li className="navButton mb-2 rounded">
            <Link href="/yugioh/deck-builder" rel="noopener noreferrer">
              <span className="block w-full text-left p-2 text-white bg-clip-padding border border-gray-700 font-semibold backdrop-opacity-90 backdrop-blur-md hover:bg-zinc-400 bg-gradient-to-tr to-transparent from-purple-800 hover:text-white">
                Yu-Gi-Oh! Deck Builder
              </span>
            </Link>
          </li>
          <li className="navButton mb-2 rounded">
            <Link href="/sports" rel="noopener noreferrer">
              <span className="block w-full text-left p-2 text-white bg-clip-padding border border-gray-700 font-semibold backdrop-opacity-90 backdrop-blur-md hover:bg-zinc-400 bg-gradient-to-tr to-transparent from-purple-800 hover:text-white">
                Sports Card Prices
              </span>
            </Link>
          </li>
          <li className="navButton mb-2 rounded">
            <Link href="/yugioh/my-collection" rel="noopener noreferrer">
              <span className="block w-full text-left p-2 text-white bg-clip-padding border border-gray-700 font-semibold backdrop-opacity-90 backdrop-blur-md hover:bg-zinc-400 bg-gradient-to-tr to-transparent from-purple-800 hover:text-white">
                My Collection
              </span>
            </Link>
          </li>

          {/* Logout Button: Render only if authenticated */ }
          { isAuthenticated && (
            <li className="navButton mt-4">
              <button
                onClick={ handleLogout }
                className="border border-zinc-700 block w-full text-left text-white p-2 font-semibold backdrop-opacity-70 hover:bg-none bg-gradient-radial to-red-700 from-zinc-800 hover:text-white"
              >
                Logout
              </button>
            </li>
          ) }
        </ul>
      </nav>
    </>
  );
}
