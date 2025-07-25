import { useState } from 'react';
import SideNav from '@/components/Navigation/SideNav';
import Link from 'next/link';

export default function Layout( { children } ) {
  const [ isSidebarOpen, setIsSidebarOpen ] = useState( false );

  const toggleSidebar = () => {
    setIsSidebarOpen( !isSidebarOpen );
  };

  return (
    <div className="flex h-full w-full mx-auto bg-gradient-to-br from-purple-900/80 via-white/20 to-transparent/80">
      {/* Sidebar */ }
      <div
        className={ `fixed inset-y-0 left-0 z-30 max-w-72 glass transform ${ isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0` }
      >
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-900/80 to-slate-900/80 shadow-lg border-b border-purple-900">
          <h2 className="text-xl font-bold text-white text-shadow">
            <Link className="w-fit" href={ `/` } passHref>
              <span className="px-2">CARD PRICE APP</span>
            </Link>
          </h2>
          <button
            className="lg:hidden text-white hover:text-purple-200 transition-colors text-2xl"
            onClick={ toggleSidebar }
          >
            ✖
          </button>
        </div>
        <SideNav />
      </div>

      {/* Main Content */ }
      <div className="flex-1 flex flex-col max-w-full mx-auto">
        {/* Mobile Header */ }
        <header className="sticky top-0 z-20 bg-gradient-to-r from-purple-900/80 to-slate-900/80 p-4 shadow-md lg:hidden">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white text-shadow">
              <Link className="w-fit" href={ `/` } passHref>
                <span className="px-2">CARD PRICE APP</span>
              </Link>
            </h3>
            <button
              className="text-white hover:text-purple-200 transition-colors text-2xl"
              onClick={ toggleSidebar }
            >
              ☰
            </button>
          </div>
        </header>

        <main className="min-h-screen p-5 w-full max-w-[100%] mx-auto">
          <div className="container box-content mx-auto">{ children }</div>
        </main>
      </div>
    </div>
  );
}
