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
    <div className="min-h-screen w-full">


      <div className="relative flex flex-wrap min-h-screen w-full text-white">
        {/* Sidebar */ }
        <div
          className={ `fixed inset-y-0 left-0 z-50 w-[280px] max-w-xs transform transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:relative lg:translate-x-0 ${ isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0' }` }
        >
          <div className="glass-strong h-full border-r border-white/10 shadow-xl">
            <div className="flex items-center justify-between gap-4 border-b border-white/5 px-5 py-4 backdrop-blur">
              <Link className="group flex items-center gap-2 text-lg font-semibold tracking-wide" href="/" passHref>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/40 to-indigo-500/30 text-sm font-bold uppercase shadow-ring">
                  CPA
                </span>
                <span className="text-shadow transition-colors group-hover:text-indigo-100">
                  Card Price App
                </span>
              </Link>
              <button
                className="text-white/80 transition hover:text-white lg:hidden"
                onClick={ toggleSidebar }
                title="Close"
              >
                <X size={ 26 } />
              </button>
            </div>
            <SideNav />
          </div>
        </div>

        {/* Main Content */ }
        <div className="flex min-h-screen w-full flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-slate-900/60 px-4 py-3 backdrop-blur lg:hidden">
            <Link href="/" passHref className="text-base font-semibold tracking-wide">
              <span className="text-shadow">Card Price App</span>
            </Link>
            <button
              className="rounded-md border border-white/10 bg-white/5 p-2 text-white/90 transition hover:bg-white/10"
              title="Menu"
              onClick={ toggleSidebar }
            >
              <MenuIcon size={ 24 } />
            </button>
          </header>

          <main className="relative flex-1 px-4 py-6 sm:px-6 lg:px-10">
            <div className="">
              <div className="glass-card animate-floaty absolute inset-x-10 top-10 -z-10 hidden h-32 rounded-full blur-3xl lg:block" />
              <div className="relative z-10">
                { children }
              </div>
            </div>
          </main>
        </div>
      </div>

      { isSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={ toggleSidebar }
          aria-label="Close sidebar overlay"
        />
      ) }
    </div>
  );
}
