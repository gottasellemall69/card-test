import { useState } from 'react';
import SideNav from '@/components/Navigation/SideNav';
import Link from 'next/link';
import { MenuIcon, X } from 'lucide-react';

export default function Layout( { children } ) {
  const [ isSidebarOpen, setIsSidebarOpen ] = useState( false );

  const toggleSidebar = () => {
    setIsSidebarOpen( !isSidebarOpen );
  };

  return (
    <div className="flex h-full w-full mx-auto bg-gradient-to-br from-white/20 via-purple-900/90 to-black/80">
      {/* Sidebar */ }
      <div
        className={ `fixed inset-y-0 left-0 z-30 max-w-72 glass transform ${ isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0` }
      >
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-900/80 to-slate-900/80 shadow-lg border-b border-purple-900">
          <h2 className="text-xl font-bold text-white text-shadow">
            <Link className="w-fit" href={ `/` } passHref>
              <span className="text-shadow px-2 bg-blur backdrop">CARD PRICE APP</span>
            </Link>
          </h2>
          <button
            className="lg:hidden text-white hover:text-purple-200 transition-colors text-2xl text-shadow bg-blur"
            onClick={ toggleSidebar }
            title={ "Close" }
          >
            <X size={ 25 } color={ "Red" } />
          </button>
        </div>
        <SideNav />
      </div>

      {/* Main Content */ }
      <div className="flex-1 flex flex-col max-w-full mx-auto">
        {/* Mobile Header */ }
        <header className="sticky top-0 z-20 bg-gradient-to-r from-purple-900/80 to-slate-900/80 p-2 shadow-md lg:hidden">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white text-shadow">
              <Link href={ `/` } passHref>
                <span className="text-shadow px-2">CARD PRICE APP</span>
              </Link>
            </h3>
            <button
              className="text-shadow text-white hover:text-purple-200 transition-colors text-3xl -m-1 p-1"
              title={ "Menu" }
              onClick={ toggleSidebar }
            >
              <MenuIcon size={ 40 } />
            </button>
          </div>
        </header>

        <main className="min-h-screen p-2 w-full max-w-[100%] mx-auto">
          <div className="container box-content mx-auto mt-5">{ children }</div>
        </main>
      </div>
    </div>
  );
}
