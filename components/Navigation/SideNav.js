import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function SideNav() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication state on component mount
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);

    // Poll for token changes as a fallback for storage updates in the same tab
    const tokenPollInterval = setInterval(() => {
      const updatedToken = localStorage.getItem("token");
      setIsAuthenticated(!!updatedToken);
    }, 500); // Check every 500ms

    // Cleanup interval on component unmount
    return () => {
      clearInterval(tokenPollInterval);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token"); // Clear the token from local storage
    setIsAuthenticated(false); // Update authentication state
    window.location.href = "/login"; // Redirect to the login page
  };

  return (
    <>
      <nav className="p-4">
        <ul className="inset-2">
          <li className="mb-2">
            <Link href="/" rel="noopener noreferrer">
              <span className="block p-2 text-white bg-clip-border font-semibold backdrop-opacity-70 hover:bg-none bg-gradient-radial to-zinc-700 from-purple-800 hover:text-white rounded">
                Yu-Gi-Oh! Card Prices
              </span>
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/yugioh/deck-builder" rel="noopener noreferrer">
              <span className="block p-2 text-white bg-clip-border font-semibold backdrop-opacity-70 hover:bg-none bg-gradient-radial to-zinc-700 from-purple-800 hover:text-white rounded">
                Yu-Gi-Oh! Deck Builder
              </span>
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/sports" rel="noopener noreferrer">
              <span className="block p-2 text-white bg-clip-border font-semibold backdrop-opacity-70 hover:bg-none bg-gradient-radial to-zinc-700 from-purple-800 hover:text-white rounded">
                Sports Card Prices
              </span>
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/yugioh/my-collection" rel="noopener noreferrer">
              <span className="block p-2 text-white bg-clip-border font-semibold backdrop-opacity-70 hover:bg-none bg-gradient-radial to-zinc-700 from-purple-800 hover:text-white rounded">
                My Collection
              </span>
            </Link>
          </li>

          {/* Logout Button: Render only if authenticated */}
          {isAuthenticated && (
            <li className="mt-4">
              <button
                onClick={handleLogout}
                className="block w-full text-left p-2 text-white bg-clip-padding font-semibold backdrop-opacity-70 hover:bg-none bg-gradient-radial to-red-700 from-zinc-800 hover:text-white rounded"
              >
                Logout
              </button>
            </li>
          )}
        </ul>
      </nav>
    </>
  );
}
