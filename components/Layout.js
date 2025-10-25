import { useState } from 'react';
import Link from 'next/link';
import { Dialog, DialogBackdrop, DialogPanel, TransitionChild } from '@headlessui/react';
import { Bars3Icon as MenuIcon, XMarkIcon as X } from '@heroicons/react/24/outline';
import SideNav from '@/components/Navigation/SideNav';


export default function Layout( { children } ) {
  const [ isSidebarOpen, setIsSidebarOpen ] = useState( false );
  const toggleSidebar = () => {
    setIsSidebarOpen( !isSidebarOpen );
  };

  return (
    <div className="h-full w-full glass dark:bg-gray-900">
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
                  <X title="Close" onClick={ setIsSidebarOpen } aria-hidden="true" className="size-7 text-red-600" />
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
      <div className="glass hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-80 lg:flex-col dark:bg-gray-900">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 px-6 dark:border-white/10 dark:bg-black/10">
          <nav className="flex flex-1 flex-col mt-10">
            <SideNav />
          </nav>
        </div>
      </div>
      <div className="lg:pl-80 w-full">
        <div className="sticky top-0 z-40 flex items-center gap-x-6 glass backdrop px-4 py-4 shadow-xs sm:px-6 lg:hidden dark:bg-gray-900 dark:shadow-none dark:after:pointer-events-none dark:after:absolute dark:after:inset-0 dark:after:border-b dark:after:border-white/10 dark:after:bg-black/10">
          <button
            type="button"
            onClick={ toggleSidebar }
            className=" text-gray-700 hover:text-gray-900 lg:hidden dark:text-gray-400 dark:hover:text-white justify-self-end place-items-end"
            title="Open sidebar"
          >
            <span className="sr-only">Open sidebar</span>
            <MenuIcon color={ "white" } aria-hidden="true" className="size-6" />
          </button>
          <Link href="/" className="flex-1 text-sm font-semibold leading-6 text-shadow text-white">
            CARD PRICE APP
          </Link>
          <div className="flex items-center">
            <span className="rounded-full border border-dashed border-white py-1 px-1 font-black text-shadow text-sm">PIC</span>
          </div>
        </div>
        <main className="mx-auto">
          <div className="min-h-screen p-3 w-full max-w-screen-2xl">
            { children }
          </div>
        </main>
      </div>
    </div>
  );
};
