// components/Layout.js

import Link from 'next/link';
import { useState } from 'react';

export default function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-black">
      {/* Sidebar */}
      <div className={`fixed border-2 border-zinc-700 inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform ${ isSidebarOpen ? 'translate-x-0' : '-translate-x-full' } transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0`}>
        <div className="flex items-center justify-between p-4 bg-blue-600">
          <h2 className="text-lg font-semibold text-white">WELCOME</h2>
          <button
            className="lg:hidden text-white"
            onClick={toggleSidebar}
          >
            ✖
          </button>
        </div>
        <nav className="p-4">
          <ul>
            <li className="mb-2">
              <Link
                href="/"
                rel="noopener noreferrer"
              >
                <span className="block p-2 text-gray-700 hover:bg-blue-200 rounded">Yu-Gi-Oh! Card Prices</span>
              </Link>
            </li>
            <li className="mb-2">
              <Link
                href="/sports/cardSet"
                rel="noopener noreferrer"
              >
                <span className="block p-2 text-gray-700 hover:bg-blue-200 rounded">Sports Card Prices</span>
              </Link>
            </li>
            <li className="mb-2">
              <Link
                href="/yugioh/my-collection"
                rel="noopener noreferrer"
              >
                <span className="block p-2 text-gray-700 hover:bg-blue-200 rounded">My Collection</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-blue-600 p-1 text-white sticky lg:hidden">
          <h3 className="p-2 m-2 text-xl w-fit float-start font-black">CARD PRICE APP</h3>
          <button className="align-text-top float-end m-2 p-2" onClick={toggleSidebar}>
            ☰
          </button>
        </header>
        <main className="pb-10 bg-black min-h-screen">
          <div className="px-3 mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
