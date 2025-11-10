'use client';

import { useMemo } from 'react';
import { Minus, Plus } from 'lucide-react';
import { YUGIOH_FILTER_SECTIONS } from '@/constants/yugiohFilters';

const FilterPanel = ( {
  filters = {},
  updateFilters,
  clearFilters,
  sections = YUGIOH_FILTER_SECTIONS,
  title = 'Refine results',
  className = '',
} ) => {
  const handleToggle = ( sectionId, option, checked ) => {
    if ( typeof updateFilters !== 'function' ) {
      return;
    }

    const prev = filters[ sectionId ] || [];
    const nextValues = checked
      ? [ ...prev, option ]
      : prev.filter( ( value ) => value !== option );

    updateFilters( sectionId, nextValues );
  };

  const activeCount = useMemo( () => {
    return Object.values( filters ).reduce(
      ( total, entries ) => total + ( Array.isArray( entries ) ? entries.length : 0 ),
      0,
    );
  }, [ filters ] );

  return (
    <aside
      className={ `rounded-sm border border-white/10 bg-black/40 p-6 text-white shadow-2xl backdrop-blur ${ className }` }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/50">Filters</p>
          <h3 className="text-lg font-semibold">{ title }</h3>
          { activeCount > 0 && (
            <p className="text-xs text-indigo-100/80">{ activeCount } active</p>
          ) }
        </div>
        { typeof clearFilters === 'function' && activeCount > 0 && (
          <button
            type="button"
            onClick={ clearFilters }
            className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70 transition hover:border-white/40 hover:text-white"
          >
            Clear All
          </button>
        ) }
      </div>

      <div className="mt-6 space-y-4">
        { sections.map( ( section ) => {
          const activeValues = new Set( filters[ section.id ] || [] );

          return (
            <details
              key={ section.id }
              className="group rounded-2xl border border-white/10 bg-white/5"
              open
            >
              <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold tracking-wide text-white/80">
                <span>{ section.label }</span>
                <span className="text-white/60 group-open:hidden">
                  <Plus size={ 16 } />
                </span>
                <span className="hidden text-white/60 group-open:block">
                  <Minus size={ 16 } />
                </span>
              </summary>
              <div className="border-t border-white/5 px-4 py-3 text-sm">
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  { section.options.map( ( option ) => {
                    const checkboxId = `${ section.id }-${ option }`;
                    const checked = activeValues.has( option );

                    return (
                      <label
                        key={ option }
                        htmlFor={ checkboxId }
                        className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-white/80 transition hover:border-white/30"
                      >
                        <input
                          id={ checkboxId }
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-400"
                          checked={ checked }
                          onChange={ ( event ) => handleToggle( section.id, option, event.target.checked ) }
                        />
                        <span className="text-sm">{ option }</span>
                      </label>
                    );
                  } ) }
                </div>
              </div>
            </details>
          );
        } ) }
      </div>
    </aside>
  );
};

export default FilterPanel;

