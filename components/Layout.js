import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Dialog, DialogBackdrop, DialogPanel, TransitionChild } from '@headlessui/react';
import { Bars3Icon as MenuIcon, XMarkIcon as X } from '@heroicons/react/24/outline';
import SideNav from '@/components/Navigation/SideNav';
import YugiohSiteBackground from '@/components/Yugioh/YugiohSiteBackground';

const ShellSlotsContext = createContext( null );

const EMPTY_SLOTS = {
  header: null,
  rightSidebar: null,
  footer: null,
};

export function useAppShellSlots( slots ) {
  const context = useContext( ShellSlotsContext );

  useEffect( () => {
    if ( !context ) {
      return undefined;
    }

    context.setSlots( {
      ...EMPTY_SLOTS,
      ...slots,
    } );

    return () => {
      context.clearSlots();
    };
  }, [
    context,
    slots?.header,
    slots?.rightSidebar,
    slots?.footer,
  ] );
}

export default function Layout( { children } ) {
  const [ isSidebarOpen, setIsSidebarOpen ] = useState( false );
  const [ slots, setSlots ] = useState( EMPTY_SLOTS );
  const router = useRouter();
  const showYugiohBackground = router.pathname.startsWith( '/yugioh' );
  const hasHeaderSlot = Boolean( slots.header );
  const hasRightSidebar = Boolean( slots.rightSidebar );
  const hasFooterSlot = Boolean( slots.footer );

  const clearSlots = useCallback( () => {
    setSlots( EMPTY_SLOTS );
  }, [] );

  const contextValue = useMemo(
    () => ( {
      setSlots,
      clearSlots,
    } ),
    [ clearSlots ]
  );

  const toggleSidebar = () => {
    setIsSidebarOpen( ( open ) => !open );
  };

  useEffect( () => {
    clearSlots();
    setIsSidebarOpen( false );
  }, [ clearSlots, router.asPath ] );

  return (
    <ShellSlotsContext.Provider value={ contextValue }>
      <div
        className={ `app-shell parent relative mx-auto min-h-screen w-full glass backdrop ${ showYugiohBackground ? "overflow-x-hidden" : "" } ${ hasHeaderSlot ? "app-shell--has-header" : "" } ${ hasRightSidebar ? "app-shell--has-right" : "" } ${ hasFooterSlot ? "app-shell--has-footer" : "" }` }
      >
        { showYugiohBackground ? <YugiohSiteBackground /> : null }

        <Dialog open={ isSidebarOpen } onClose={ setIsSidebarOpen } className="relative z-50 lg:hidden">
          <DialogBackdrop
            transition
            className="fixed inset-0 backdrop bg-black/20 transition-opacity duration-300 ease-linear data-closed:opacity-0"
          />
          <div className="fixed inset-0 flex">
            <DialogPanel
              transition
              className="relative flex w-auto max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full"
            >
              <TransitionChild>
                <div className="absolute top-0 left-full flex w-auto justify-center pt-5 duration-300 ease-in-out data-closed:opacity-0">
                  <button type="button" onClick={ toggleSidebar } className="-m-2.5 p-2.5">
                    <span className="sr-only">Close sidebar</span>
                    <X title="Close" aria-hidden="true" className="size-7 text-red-600" />
                  </button>
                </div>
              </TransitionChild>
              <div className="glass backdrop flex grow flex-col gap-y-5 overflow-y-auto pb-2 dark:bg-gray-900 dark:ring dark:ring-white/10 dark:before:pointer-events-none dark:before:absolute dark:before:inset-0 dark:before:bg-black/10">
                <nav className="relative flex flex-1 flex-col mt-10">
                  <SideNav />
                </nav>
              </div>
            </DialogPanel>
          </div>
        </Dialog>

        <header className="app-shell-header section">
          <div className="app-shell-mobile-header">
            <button
              type="button"
              onClick={ toggleSidebar }
              className="text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              title="Open sidebar"
            >
              <span className="sr-only">Open sidebar</span>
              <MenuIcon color="white" aria-hidden="true" className="size-6" />
            </button>
            <Link href="/" className="flex-1 text-sm font-semibold leading-6 text-shadow text-white">
              CARD PRICE APP
            </Link>
            <div className="flex items-center">
              <span className="rounded-full border border-dashed border-white py-1 px-1 font-black text-shadow text-sm">PIC</span>
            </div>
          </div>

          <div className="app-shell-desktop-header">
            <Link href="/" className="text-sm font-semibold leading-6 text-shadow text-white">
              CARD PRICE APP
            </Link>
            <div className="flex items-center">
              <span className="rounded-full border border-dashed border-white py-1 px-1 font-black text-shadow text-sm">PIC</span>
            </div>
          </div>

          { hasHeaderSlot && (
            <div className="app-shell-header-slot">
              { slots.header }
            </div>
          ) }
        </header>

        <aside className="app-shell-left left-side section">
          <div className="app-shell-left-inner">
            <nav className="flex flex-1 flex-col">
              <SideNav />
            </nav>
          </div>
        </aside>

        <main className="app-shell-main section">
          { children }
        </main>

        { hasRightSidebar && (
          <aside className="app-shell-right right-side section">
            { slots.rightSidebar }
          </aside>
        ) }

        <footer id="app-shell-footer" className="app-shell-footer section">
          { slots.footer }
        </footer>
      </div>
    </ShellSlotsContext.Provider>
  );
};
