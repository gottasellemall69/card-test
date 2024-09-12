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
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform ${ isSidebarOpen ? 'translate-x-0' : '-translate-x-full' } transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0`}>
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
              <Link href="/">
                <span className="block p-2 text-gray-700 hover:bg-blue-200 rounded">Yu-Gi-Oh! Card Prices</span>
              </Link>
            </li>
            <li className="mb-2">
              <Link href="/sports/cardSet">
                <span className="block p-2 text-gray-700 hover:bg-blue-200 rounded">Sports Card Prices</span>
              </Link>
            </li>
            <li className="mb-2">
              <Link href="/yugioh/my-collection">
                <span className="block p-2 text-gray-700 hover:bg-blue-200 rounded">My Collection</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-blue-600 p-4 text-white sticky lg:hidden">
          <h3 className="text-xl w-fit float-start font-black">CARD PRICE APP</h3>
          <button className="float-end" onClick={toggleSidebar}>
            ☰
          </button>
        </header>
        <main className="p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
