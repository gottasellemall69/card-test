'use client';

import { useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { X } from 'lucide-react';
import { YUGIOH_FILTER_SECTIONS } from '@/constants/yugiohFilters';

const CardFilter = ( {
  filters,            // { rarity: [], condition: [] }
  updateFilters,      // (filterType, updatedValues) => void
  open,        // boolean (optional controlled prop)
  setOpen,     // (open: boolean) => void (optional controlled setter)
  isModalOpen, // legacy boolean prop
  setIsModalOpen, // legacy setter
  renderTrigger,
  triggerLabel = 'Open Filters',
  triggerClassName = 'rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:text-white',
  title = 'Card Filters',
} ) => {
  const [ internalOpen, setInternalOpen ] = useState( false );

  const resolvedOpen =
    typeof open === 'boolean'
      ? open
      : typeof isModalOpen === 'boolean'
        ? isModalOpen
        : internalOpen;

  const resolvedSetOpen =
    typeof setOpen === 'function'
      ? setOpen
      : typeof setIsModalOpen === 'function'
        ? setIsModalOpen
        : setInternalOpen;

  const openFilters = () => resolvedSetOpen( true );
  const closeFilters = () => resolvedSetOpen( false );

  const handleCheckboxChange = async ( event, filterType ) => {
    const { value, checked } = event.target;
    const prev = filters[ filterType ] || [];
    const updatedValues = checked
      ? [ ...prev, value ]
      : prev.filter( v => v !== value );
    updateFilters( filterType, updatedValues );
  };

  const triggerContent =
    typeof renderTrigger === 'function'
      ? renderTrigger( { openFilters, closeFilters, isOpen: resolvedOpen } )
      : (
        <button
          type="button"
          onClick={ openFilters }
          className={ triggerClassName }
        >
          { triggerLabel }
        </button>
      );

  return (
    <div>
      { triggerContent }
      <Dialog open={ resolvedOpen } onClose={ resolvedSetOpen } className="relative z-10 ">
        <div className="fixed inset-0" />

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-12 sm:pl-2 glass backdrop">
              <DialogPanel
                transition
                className="pointer-events-auto w-screen max-w-md transform transition duration-500 ease-in-out data-closed:translate-x-full sm:duration-700"
              >
                <div className="relative flex h-full flex-col overflow-y-auto py-6 shadow-xl dark:bg-gray-800 dark:after:absolute dark:after:inset-y-0 dark:after:left-0 dark:after:w-px dark:after:bg-white/10">
                  <div className="px-4 sm:px-6">
                    <div className="flex items-start justify-between">
                      <DialogTitle className="text-base font-semibold text-white">
                        { title }
                      </DialogTitle>
                      <div className="ml-3 flex h-7 items-center">
                        <button
                          type="button"
                          title={ "Close" }
                          onClick={ closeFilters }
                          className="relative rounded-md text-white hover:text-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:hover:text-white dark:focus-visible:outline-indigo-500"
                        >
                          <span className="absolute -inset-2.5" />
                          <span className="sr-only">Close filters</span>
                          <X color={ `red` } aria-hidden="true" className="size-6" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="relative mt-6 flex-1 px-4 ">
                    <div className="space-y-6">
                      { YUGIOH_FILTER_SECTIONS.map( filter => (
                        <div key={ filter.id } className="space-y-3">
                          <p className="text-sm font-semibold text-white">{ filter.label }</p>
                          <div className="space-y-2">
                            { filter.options.map( value => (
                              <label
                                key={ value }
                                htmlFor={ `${ filter.id }-${ value }` }
                                className="flex items-start gap-2 text-sm text-gray-200"
                              >
                                <input
                                  type="checkbox"
                                  id={ `${ filter.id }-${ value }` }
                                  value={ value }
                                  checked={ filters[ filter.id ]?.includes( value ) || false }
                                  onChange={ e => handleCheckboxChange( e, filter.id ) }
                                  className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                                />
                                <span>{ value }</span>
                              </label>
                            ) ) }
                          </div>
                        </div>
                      ) ) }
                    </div>

                    <div className="mt-6 border-t border-gray-200 pt-4 dark:border-white/10">
                      <button
                        type="button"
                        className="flex w-full justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        onClick={ closeFilters }
                      >
                        Apply Filters
                      </button>
                    </div>
                  </div>
                </div>
              </DialogPanel>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default CardFilter;
