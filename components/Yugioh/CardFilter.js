'use client';

import { useMemo, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { Minus, Plus, X } from 'lucide-react';
import { YUGIOH_FILTER_SECTIONS } from '@/constants/yugiohFilters';

const CardFilter = ( {
  filters = {},            // { rarity: [], condition: [] }
  updateFilters,      // (filterType, updatedValues) => void
  clearFilters,
  sections = YUGIOH_FILTER_SECTIONS,
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

  const activeCount = useMemo( () => {
    return Object.values( filters || {} ).reduce(
      ( total, entries ) => total + ( Array.isArray( entries ) ? entries.length : 0 ),
      0,
    );
  }, [ filters ] );

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
      <Dialog open={ resolvedOpen } onClose={ resolvedSetOpen } className="relative z-[120]">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 data-closed:opacity-0"
        />
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-0">
              <DialogPanel
                transition
                className="pointer-events-auto w-screen max-w-md transform transition duration-300 ease-out data-closed:translate-x-full"
              >
                <div className="relative flex h-full flex-col overflow-y-auto border-l border-white/10 bg-slate-950/92 py-6 text-white shadow-2xl backdrop-blur-xl">
                  <div className="px-5 sm:px-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-white/50">Filters</p>
                        <DialogTitle className="text-lg font-semibold text-white">
                          { title }
                        </DialogTitle>
                        { activeCount > 0 && (
                          <p className="text-xs text-indigo-100/80">{ activeCount } active</p>
                        ) }
                      </div>
                      <div className="flex items-center gap-2">
                        { typeof clearFilters === 'function' && activeCount > 0 && (
                          <button
                            type="button"
                            onClick={ clearFilters }
                            className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70 transition hover:border-white/40 hover:text-white"
                          >
                            Clear All
                          </button>
                        ) }
                        <button
                          type="button"
                          title={ "Close" }
                          onClick={ closeFilters }
                          className="relative rounded-md p-1 text-white/70 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                          <span className="sr-only">Close filters</span>
                          <X aria-hidden="true" className="size-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="relative mt-6 flex-1 px-5 sm:px-6">
                    <div className="space-y-4">
                      { sections.map( filter => {
                        const activeValues = new Set( filters[ filter.id ] || [] );

                        return (
                          <details
                            key={ filter.id }
                            className="group rounded-2xl border border-white/10 bg-white/5"
                            open
                          >
                            <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold tracking-wide text-white/80">
                              <span>{ filter.label }</span>
                              <span className="text-white/60 group-open:hidden">
                                <Plus size={ 16 } />
                              </span>
                              <span className="hidden text-white/60 group-open:block">
                                <Minus size={ 16 } />
                              </span>
                            </summary>
                            <div className="border-t border-white/5 px-4 py-3 text-sm">
                              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                                { filter.options.map( value => (
                                  <label
                                    key={ value }
                                    htmlFor={ `${ filter.id }-${ value }` }
                                    className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-white/80 transition hover:border-white/30"
                                  >
                                    <input
                                      type="checkbox"
                                      id={ `${ filter.id }-${ value }` }
                                      value={ value }
                                      checked={ activeValues.has( value ) }
                                      onChange={ e => handleCheckboxChange( e, filter.id ) }
                                      className="h-4 w-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-400"
                                    />
                                    <span className="text-sm">{ value }</span>
                                  </label>
                                ) ) }
                              </div>
                            </div>
                          </details>
                        );
                      } ) }
                    </div>

                    <div className="mt-6 border-t border-white/10 pt-4">
                      <button
                        type="button"
                        className="flex w-full justify-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
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
