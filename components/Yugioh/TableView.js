import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Notification from '@/components/Notification';

const SORTABLE_COLUMNS = {
  quantity: { key: 'quantity', type: 'number' },
  productName: { key: 'productName', type: 'string' },
  setName: { key: 'setName', type: 'string' },
  number: { key: 'number', type: 'string' },
  printing: { key: 'printing', type: 'string' },
  rarity: { key: 'rarity', type: 'string' },
  condition: { key: 'condition', type: 'string' },
  marketPrice: { key: 'marketPrice', type: 'number' },
};

const DEFAULT_SORT_KEY = 'setName';

const normalizeValue = ( value, type ) => {
  if ( type === 'number' ) {
    const numeric = Number( value );
    return Number.isFinite( numeric ) ? numeric : 0;
  }
  return ( value ?? '' ).toString().toLowerCase();
};

const TableView = ( { aggregatedData = [], onDeleteCard, onUpdateCard } ) => {
  const safeCards = Array.isArray( aggregatedData ) ? aggregatedData : [];
  const [ sortConfig, setSortConfig ] = useState( { key: DEFAULT_SORT_KEY, direction: 'ascending' } );
  const [ edit, setEdit ] = useState( {} );
  const [ editValues, setEditValues ] = useState( {} );
  const [ notification, setNotification ] = useState( { show: false, message: '' } );
  const [ selectedRows, setSelectedRows ] = useState( () => new Set() );
  const [ lastCheckedId, setLastCheckedId ] = useState( null );
  const safeIds = useMemo(
    () => safeCards.map( ( card ) => card?._id ).filter( Boolean ),
    [ safeCards ],
  );

  useEffect( () => {
    setSelectedRows( ( prev ) => {
      const validIdSet = new Set( safeIds );
      let changed = false;
      const next = new Set();
      prev.forEach( ( id ) => {
        if ( validIdSet.has( id ) ) {
          next.add( id );
        } else {
          changed = true;
        }
      } );
      if ( !changed && next.size === prev.size ) {
        return prev;
      }
      return next;
    } );
  }, [ safeIds ] );

  const showNotification = useCallback( ( message ) => {
    setNotification( { show: true, message } );
  }, [] );

  const cardLookup = useMemo( () => {
    return safeCards.reduce( ( map, card ) => {
      map.set( card._id, card );
      return map;
    }, new Map() );
  }, [ safeCards ] );

  const calculatePriceTrend = ( previousPrice, currentPrice ) => {
    const prev = Number( previousPrice ) || 0;
    const next = Number( currentPrice ) || 0;
    if ( next > prev ) return '+';
    if ( next < prev ) return '-';
    return '';
  };

  const handleEdit = useCallback( ( cardId, field ) => {
    const card = cardLookup.get( cardId );
    if ( !card ) return;

    setEdit( ( prev ) => ( { ...prev, [ cardId ]: field } ) );
    setEditValues( ( prev ) => ( {
      ...prev,
      [ cardId ]: { ...card, deleteAmount: prev[ cardId ]?.deleteAmount ?? 1 },
    } ) );
  }, [ cardLookup ] );

  const handleChange = ( event, cardId, field ) => {
    const { value } = event.target;
    setEditValues( ( prev ) => ( {
      ...prev,
      [ cardId ]: { ...prev[ cardId ], [ field ]: value },
    } ) );
  };

  const handleSave = async ( cardId, field ) => {
    const rawValue = editValues[ cardId ]?.[ field ];
    const parsedValue = Number( rawValue );

    if ( Number.isNaN( parsedValue ) ) {
      showNotification( 'Please enter a valid number.' );
      return;
    }

    try {
      await onUpdateCard( cardId, field, parsedValue );
      setEdit( ( prev ) => ( { ...prev, [ cardId ]: null } ) );
      showNotification( 'Card quantity updated successfully!' );
    } catch ( err ) {
      console.error( 'Save failed', err );
      showNotification( 'Unable to update this card. Please try again.' );
    }
  };

  const updateQuantity = async ( cardId, quantity ) => {
    const nextQuantity = Number( quantity );
    if ( Number.isNaN( nextQuantity ) ) {
      showNotification( 'Please enter a valid quantity.' );
      return;
    }

    try {
      if ( nextQuantity <= 0 ) {
        await onDeleteCard( cardId );
        showNotification( 'Card deleted successfully!' );
      } else {
        await onUpdateCard( cardId, 'quantity', nextQuantity );
        showNotification( 'Card quantity updated successfully!' );
      }
    } catch ( err ) {
      console.error( 'Quantity update failed', err );
      showNotification( 'Unable to update this card. Please try again.' );
    }
  };

  const handleDelete = async ( cardId ) => {
    const delAmount = Number( editValues[ cardId ]?.deleteAmount ) || 1;
    const current = cardLookup.get( cardId );
    const newQty = Math.max( 0, ( current?.quantity || 0 ) - delAmount );
    await updateQuantity( cardId, newQty );
  };

  const handleSort = ( key ) => {
    if ( !SORTABLE_COLUMNS[ key ] ) return;
    let direction = 'ascending';
    if ( sortConfig.key === key && sortConfig.direction === 'ascending' ) {
      direction = 'descending';
    }

    setSortConfig( { key, direction } );
  };

  const sortedData = useMemo( () => {
    const { key, direction } = sortConfig;
    const column = SORTABLE_COLUMNS[ key ] || SORTABLE_COLUMNS[ DEFAULT_SORT_KEY ];
    const items = [ ...safeCards ];

    items.sort( ( a, b ) => {
      const aValue = normalizeValue( a?.[ column.key ], column.type );
      const bValue = normalizeValue( b?.[ column.key ], column.type );
      if ( aValue < bValue ) return direction === 'ascending' ? -1 : 1;
      if ( aValue > bValue ) return direction === 'ascending' ? 1 : -1;
      return 0;
    } );

    return items;
  }, [ safeCards, sortConfig ] );

  const getSortArrow = ( key ) => {
    if ( sortConfig.key !== key ) return '';
    return sortConfig.direction === 'ascending' ? '^' : 'v';
  };

  const displayedRowIds = useMemo(
    () => sortedData.map( ( card ) => card?._id ).filter( Boolean ),
    [ sortedData ],
  );

  const isAllSelected =
    displayedRowIds.length > 0 && displayedRowIds.every( ( id ) => selectedRows.has( id ) );

  const toggleRowSelection = useCallback(
    ( event, cardId ) => {
      const { checked } = event.target;
      const isShift = event.nativeEvent?.shiftKey;
      setSelectedRows( ( prev ) => {
        const next = new Set( prev );
        if ( isShift && lastCheckedId && lastCheckedId !== cardId ) {
          const start = displayedRowIds.indexOf( lastCheckedId );
          const end = displayedRowIds.indexOf( cardId );
          if ( start !== -1 && end !== -1 ) {
            const [ lo, hi ] = start < end ? [ start, end ] : [ end, start ];
            for ( let i = lo; i <= hi; i += 1 ) {
              const idInRange = displayedRowIds[ i ];
              if ( checked ) next.add( idInRange );
              else next.delete( idInRange );
            }
          }
        }

        if ( checked ) next.add( cardId );
        else next.delete( cardId );

        return next;
      } );
      setLastCheckedId( cardId );
    },
    [ displayedRowIds, lastCheckedId ],
  );

  const applySelectionToDisplayed = useCallback(
    ( shouldSelect ) => {
      setSelectedRows( ( prev ) => {
        const next = new Set( prev );
        displayedRowIds.forEach( ( id ) => {
          if ( shouldSelect ) next.add( id );
          else next.delete( id );
        } );
        return next;
      } );
    },
    [ displayedRowIds ],
  );

  const handleHeaderSelectAll = useCallback(
    ( event ) => {
      applySelectionToDisplayed( event.target.checked );
      setLastCheckedId( null );
    },
    [ applySelectionToDisplayed ],
  );

  const handleToolbarSelectToggle = useCallback( () => {
    applySelectionToDisplayed( !isAllSelected );
    setLastCheckedId( null );
  }, [ applySelectionToDisplayed, isAllSelected ] );

  const clearSelection = useCallback( () => {
    setSelectedRows( new Set() );
    setLastCheckedId( null );
  }, [] );

  const handleBulkDelete = useCallback( async () => {
    const selectedIds = Array.from( selectedRows );
    if ( selectedIds.length === 0 ) {
      showNotification( 'Select at least one card to delete.' );
      return;
    }
    const confirmed = window.confirm(
      `Delete ${ selectedIds.length } selected card${ selectedIds.length > 1 ? 's' : '' }?`,
    );
    if ( !confirmed ) {
      return;
    }
    try {
      await Promise.all( selectedIds.map( ( cardId ) => onDeleteCard( cardId ) ) );
      showNotification( 'Selected cards deleted.' );
      clearSelection();
    } catch ( error ) {
      console.error( 'Bulk delete failed:', error );
      showNotification( 'Failed to delete one or more cards. Please try again.' );
    }
  }, [ clearSelection, onDeleteCard, selectedRows, showNotification ] );

  const selectedCount = selectedRows.size;

  return (
    <div className="max-w-full overflow-x-auto">
      <Notification
        show={ notification.show }
        setShow={ ( show ) => setNotification( ( prev ) => ( { ...prev, show } ) ) }
        message={ notification.message }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/80">
        <span className="font-semibold text-white">
          { selectedCount } selected
        </span>
        <button
          type="button"
          onClick={ handleToolbarSelectToggle }
          className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition hover:border-white/40"
        >
          { isAllSelected ? 'Unselect Page' : 'Select Page' }
        </button>
        <button
          type="button"
          onClick={ clearSelection }
          className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition hover:border-white/40"
        >
          Clear All
        </button>
        <button
          type="button"
          onClick={ handleBulkDelete }
          className="rounded-full border border-rose-400/50 bg-rose-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-rose-100 transition hover:bg-rose-500/20"
        >
          Delete Selected
        </button>
      </div>

      <table className="w-full table-auto text-xs sm:text-sm">
        <thead className="bg-black/60 text-white">
          <tr>
            <th className="border border-white/10 px-3 py-2 text-center">
              <input
                type="checkbox"
                className="size-4 cursor-pointer accent-indigo-500"
                checked={ isAllSelected }
                onChange={ handleHeaderSelectAll }
                aria-label="Select all visible cards"
              />
            </th>
            <th onClick={ () => handleSort( 'quantity' ) } className="cursor-pointer border border-white/10 px-3 py-2 text-center font-semibold uppercase tracking-wide">
              Qty { getSortArrow( 'quantity' ) }
            </th>
            <th onClick={ () => handleSort( 'productName' ) } className="cursor-pointer border border-white/10 px-3 py-2 text-center font-semibold uppercase tracking-wide">
              Name { getSortArrow( 'productName' ) }
            </th>
            <th onClick={ () => handleSort( 'setName' ) } className="cursor-pointer border border-white/10 px-3 py-2 text-center font-semibold uppercase tracking-wide">
              Set { getSortArrow( 'setName' ) }
            </th>
            <th onClick={ () => handleSort( 'number' ) } className="cursor-pointer border border-white/10 px-3 py-2 text-center font-semibold uppercase tracking-wide">
              Code { getSortArrow( 'number' ) }
            </th>
            <th onClick={ () => handleSort( 'printing' ) } className="cursor-pointer border border-white/10 px-3 py-2 text-center font-semibold uppercase tracking-wide">
              Printing { getSortArrow( 'printing' ) }
            </th>
            <th onClick={ () => handleSort( 'rarity' ) } className="cursor-pointer border border-white/10 px-3 py-2 text-center font-semibold uppercase tracking-wide">
              Rarity { getSortArrow( 'rarity' ) }
            </th>
            <th onClick={ () => handleSort( 'condition' ) } className="cursor-pointer border border-white/10 px-3 py-2 text-center font-semibold uppercase tracking-wide">
              Condition { getSortArrow( 'condition' ) }
            </th>
            <th onClick={ () => handleSort( 'marketPrice' ) } className="cursor-pointer border border-white/10 px-3 py-2 text-center font-semibold uppercase tracking-wide">
              Price { getSortArrow( 'marketPrice' ) }
            </th>
            <th className="border border-white/10 px-3 py-2" />
            <th className="border border-white/10 px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          { sortedData?.map( ( card, index ) => {
            const cardId = card?._id;
            const rowKey = cardId ?? `${ card?.productName ?? 'card' }-${ index }`;
            const isSelected = cardId ? selectedRows.has( cardId ) : false;
            return (
              <tr
                key={ rowKey }
                className={ `border-b border-white/5 bg-black/30 text-white transition-colors hover:bg-black/20 ${ isSelected ? 'bg-indigo-500/10' : '' }` }
              >
                <td className="px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    className="size-4 cursor-pointer accent-indigo-500"
                    checked={ isSelected }
                    disabled={ !cardId }
                    onChange={ ( event ) => cardId && toggleRowSelection( event, cardId ) }
                    aria-label="Select card"
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  { edit[ card._id ] === 'quantity' ? (
                    <input
                      type="number"
                      className="w-16 rounded border border-white/20 bg-white/90 px-2 py-1 text-center text-black"
                      value={ editValues[ card._id ]?.quantity ?? card.quantity ?? '' }
                      onChange={ ( e ) => handleChange( e, card._id, 'quantity' ) }
                      onBlur={ () => handleSave( card._id, 'quantity' ) }
                    />
                  ) : (
                    <span
                      className="cursor-pointer font-semibold text-indigo-200 underline-offset-4 hover:text-white hover:underline"
                      onClick={ () => handleEdit( card._id, 'quantity' ) }
                    >
                      { card.quantity }
                    </span>
                  ) }
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-center sm:text-left">
                  { ( () => {
                    const letterFromSet =
                      typeof card?.setName === 'string' && card.setName.length > 0
                        ? card.setName.charAt( 0 ).toUpperCase()
                        : null;
                    const fallbackLetter =
                      typeof card?.productName === 'string' && card.productName.length > 0
                        ? card.productName.charAt( 0 ).toUpperCase()
                        : null;
                    const letter = letterFromSet || fallbackLetter || undefined;

                    const query = { source: 'collection' };

                    if ( card?.cardId ) {
                      query.card = String( card.cardId );
                    }
                    if ( card?.productName ) {
                      query.card_name = card.productName;
                    }
                    if ( card?.setName ) query.set_name = card.setName;
                    if ( card?.number ) query.set_code = card.number;
                    if ( card?.rarity ) {
                      query.rarity = card.rarity;
                      query.set_rarity = card.rarity;
                    }
                    if ( card?.printing ) query.edition = card.printing;
                    if ( letter ) query.letter = letter;

                    return (
                      <Link
                        href={ {
                          pathname: '/yugioh/sets/[letter]/cards/card-details',
                          query,
                        } }
                        className="block h-full w-full cursor-pointer text-inherit hover:underline"
                      >
                        { card?.productName || 'Unknown Name' }
                      </Link>
                    );
                  } )() }
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-center sm:text-left">{ card?.setName }</td>
                <td className="whitespace-nowrap px-3 py-2 text-center sm:text-left">{ card?.number }</td>
                <td className="whitespace-nowrap px-3 py-2 text-center sm:text-left">{ card?.printing }</td>
                <td className="whitespace-nowrap px-3 py-2 text-center sm:text-left">{ card?.rarity }</td>
                <td className="whitespace-nowrap px-3 py-2 text-center sm:text-left">{ card?.condition }</td>
                <td className="whitespace-nowrap px-3 py-2 text-center sm:text-left">{ Number.isFinite( Number( card?.marketPrice ) ) ? Number( card.marketPrice ).toFixed( 2 ) : card?.marketPrice ?? '0.00' }</td>
                <td className="flex items-center gap-2 px-3 py-2">
                  <input
                    type="number"
                    className="w-16 rounded border border-white/20 bg-white/90 px-2 py-1 text-center text-black"
                    min={ 1 }
                    max={ card.quantity }
                    value={ editValues[ card._id ]?.deleteAmount ?? 1 }
                    onChange={ ( e ) =>
                      setEditValues( ( prev ) => ( {
                        ...prev,
                        [ card._id ]: {
                          ...prev[ card._id ],
                          deleteAmount: Number( e.target.value ) || 1,
                        },
                      } ) )
                    }
                  />
                  <button
                    type="button"
                    onClick={ () => handleDelete( card._id ) }
                    className="text-sm font-semibold text-rose-300 hover:text-rose-100"
                  >
                    Delete
                  </button>
                </td>
                <td className="px-3 py-2 text-center text-xs text-white/60">
                  { calculatePriceTrend( card?.oldPrice ?? 0, card?.marketPrice ?? 0 ) }
                </td>
              </tr>
            );
          } ) }
        </tbody>
      </table>
    </div>
  );
};

export default TableView;
