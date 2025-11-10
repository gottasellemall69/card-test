"use client";

import { useMemo, useState } from 'react';
import { Filter } from 'lucide-react';
import CardFilter from '@/components/Yugioh/CardFilter.js';

const BASE_BUTTON_CLASSES =
  'inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-white/40 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-60';

const noop = () => {};

const FiltersButton = ( {
  filters = {},
  updateFilters = noop,
  label = 'Filters',
  className = '',
  disabled = false,
  showCount = true,
  ...restProps
} ) => {
  const [ isOpen, setIsOpen ] = useState( false );

  const activeCount = useMemo( () => {
    return Object.values( filters ).reduce( ( total, value ) => {
      if ( Array.isArray( value ) ) {
        return total + value.length;
      }
      return total;
    }, 0 );
  }, [ filters ] );

  const buttonClasses = [ BASE_BUTTON_CLASSES, className ].filter( Boolean ).join( ' ' );

  return (
    <CardFilter
      filters={ filters }
      updateFilters={ updateFilters }
      open={ isOpen }
      setOpen={ setIsOpen }
      renderTrigger={ ( { openFilters } ) => (
        <button
          type="button"
          className={ buttonClasses }
          onClick={ openFilters }
          aria-haspopup="dialog"
          aria-expanded={ isOpen }
          disabled={ disabled }
          { ...restProps }
        >
          <Filter size={ 16 } aria-hidden="true" />
          <span>{ label }</span>
          { showCount && activeCount > 0 && (
            <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-bold text-indigo-200">
              { activeCount }
            </span>
          ) }
        </button>
      ) }
    />
  );
};

export default FiltersButton;
