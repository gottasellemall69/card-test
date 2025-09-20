import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import Notification from '@/components/Notification';
import cardData from '@/public/card-data/Yugioh/card_data.json';

const TableView = ( { aggregatedData, onDeleteCard, onUpdateCard, handleSortChange } ) => {
  const [ sortConfig, setSortConfig ] = useState( { key: null, direction: 'ascending' } );
  const [ edit, setEdit ] = useState( {} );
  const [ editValues, setEditValues ] = useState( {} );
  const [ notification, setNotification ] = useState( { show: false, message: '' } );
  const router = useRouter();

  const cardIndex = useMemo( () => {
    const index = {};
    cardData.forEach( ( entry ) => {
      index[ entry.name.toLowerCase() ] = entry;
    } );
    return index;
  }, [] );

  const resolveCardId = ( name ) => {
    if ( !name ) return null;
    return cardIndex[ name.toLowerCase() ]?.id || null;
  };

  const calculatePriceTrend = ( previousPrice, currentPrice ) => {
    if ( currentPrice > previousPrice ) {
      return '+';
    } else if ( currentPrice < previousPrice ) {
      return '-';
    } else {
      return '';
    }
  };

  const handleEdit = ( cardId, field ) => {
    setEdit( ( prev ) => ( { ...prev, [ cardId ]: field } ) );
    const card = aggregatedData.find( ( c ) => c._id === cardId );
    if ( card ) {
      setEditValues( ( prev ) => ( {
        ...prev,
        [ cardId ]: { ...card, deleteAmount: 1 }
      } ) );
    }
  };

  const handleChange = ( e, cardId, field ) => {
    const { value } = e.target;
    setEditValues( ( prev ) => ( {
      ...prev,
      [ cardId ]: { ...prev[ cardId ], [ field ]: value }
    } ) );
  };

  const handleSave = async ( cardId, field ) => {
    try {
      const value = parseFloat( editValues[ cardId ][ field ] );
      await onUpdateCard( cardId, field, value );
      setEdit( ( prev ) => ( { ...prev, [ cardId ]: null } ) );
      setNotification( { show: true, message: 'Card quantity updated successfully!' } );
    } catch ( err ) {
      console.error( 'Save failed', err );
    }
  };

  const updateQuantity = async ( cardId, quantity ) => {
    try {
      if ( quantity <= 0 ) {
        await onDeleteCard( cardId );
        setNotification( { show: true, message: 'Card deleted successfully!' } );
      } else {
        await onUpdateCard( cardId, 'quantity', quantity );
        setNotification( { show: true, message: 'Card quantity updated successfully!' } );
      }
    } catch ( err ) {
      console.error( 'Quantity update failed', err );
    }
  };

  const handleDelete = async ( cardId ) => {
    const delAmount = editValues[ cardId ]?.deleteAmount || 1;
    const current = aggregatedData.find( ( c ) => c._id === cardId );
    const newQty = Math.max( 0, ( current?.quantity || 0 ) - delAmount );
    await updateQuantity( cardId, newQty );
  };

  const handleSort = ( key ) => {
    let direction = 'ascending';
    if ( sortConfig.key === key && sortConfig.direction === 'ascending' ) {
      direction = 'descending';
    }

    setSortConfig( { key, direction } );
    handleSortChange?.( key, direction );
  };

  const sortedData = useMemo( () => {
    let sortableItems = [ ...aggregatedData ];
    if ( sortConfig.key !== null ) {
      sortableItems.sort( ( a, b ) => {
        if ( a[ sortConfig.key ] < b[ sortConfig.key ] ) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if ( a[ sortConfig.key ] > b[ sortConfig.key ] ) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      } );
    }
    return sortableItems;
  }, [ aggregatedData, sortConfig ] );

  const getSortArrow = ( key ) => {
    if ( sortConfig.key !== key ) return '';
    return sortConfig.direction === 'ascending' ? '?' : '?';
  };

  const handleRowNavigation = ( card ) => {
    if ( !card ) return;
    const cardId = resolveCardId( card.productName );
    const letter = card?.setName?.charAt( 0 ).toUpperCase() || card?.productName?.charAt( 0 ).toUpperCase();

    const query = {
      letter,
      set_name: card?.setName,
      set_code: card?.number,
      rarity: card?.rarity,
      edition: card?.printing,
      source: 'collection'
    };

    if ( cardId ) {
      query.card = cardId;
    } else {
      query.productName = card?.productName;
    }

    router.push( {
      pathname: '/yugioh/sets/[letter]/cards/card-details',
      query
    } );
  };

  return (
    <div className="overflow-x-auto table-container">
      <Notification show={ notification.show } setShow={ ( s ) => setNotification( prev => ( { ...prev, show: s } ) ) } message={ notification.message } />

      <table className="min-w-full text-sm text-white">
        <thead className='bg-white/5 text-xs uppercase tracking-wide text-white/70'>
          <tr>
            <th onClick={ () => handleSort( 'quantity' ) } className="p-3 cursor-pointer text-left">Qty { getSortArrow( 'quantity' ) }</th>
            <th className="p-3 text-left">Status</th>
            <th onClick={ () => handleSort( 'productName' ) } className="p-3 cursor-pointer text-left">Name { getSortArrow( 'productName' ) }</th>
            <th onClick={ () => handleSort( 'setName' ) } className="p-3 cursor-pointer text-left">Set { getSortArrow( 'setName' ) }</th>
            <th onClick={ () => handleSort( 'number' ) } className="p-3 cursor-pointer text-left">Number { getSortArrow( 'number' ) }</th>
            <th onClick={ () => handleSort( 'printing' ) } className="p-3 cursor-pointer text-left">Printing { getSortArrow( 'printing' ) }</th>
            <th onClick={ () => handleSort( 'rarity' ) } className="p-3 cursor-pointer text-left">Rarity { getSortArrow( 'rarity' ) }</th>
            <th onClick={ () => handleSort( 'condition' ) } className="p-3 cursor-pointer text-left">Condition { getSortArrow( 'condition' ) }</th>
            <th onClick={ () => handleSort( 'marketPrice' ) } className="p-3 cursor-pointer text-left">Price { getSortArrow( 'marketPrice' ) }</th>
            <th className="p-3 text-left"></th>
            <th className="p-3 text-left"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          { sortedData?.map( ( card, index ) => (
            <tr
              key={ card._id ?? index }
              className="interactive-row"
              onClick={ ( event ) => {
                if ( event.target.closest && event.target.closest( 'input,button,a,label,svg,path' ) ) {
                  return;
                }
                handleRowNavigation( card );
              } }
            >
              <td className="p-3 align-middle">
                { edit[ card._id ] === 'quantity' ? (
                  <input
                    type="number"
                    className="w-16 text-center rounded bg-white/5"
                    value={ editValues[ card._id ]?.quantity || '' }
                    onChange={ ( e ) => handleChange( e, card._id, 'quantity' ) }
                    onBlur={ () => handleSave( card._id, 'quantity' ) }
                  />
                ) : (
                  <span
                    className="cursor-pointer font-semibold"
                    onClick={ () => handleEdit( card._id, 'quantity' ) }
                  >
                    { card.quantity }
                  </span>
                ) }
              </td>
              <td className="p-3 align-middle text-xs">
                <span className="badge badge-success inline-flex items-center gap-1">
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                  In Collection
                </span>
              </td>
              <td className="p-3 align-middle text-sm font-semibold text-white">{ card?.productName }</td>
              <td className="p-3 align-middle text-sm text-white/70">{ card?.setName }</td>
              <td className="p-3 align-middle text-sm text-white/70">{ card?.number }</td>
              <td className="p-3 align-middle text-sm text-white/70">{ card?.printing }</td>
              <td className="p-3 align-middle text-sm text-white/70">{ card?.rarity }</td>
              <td className="p-3 align-middle text-sm text-white/70">{ card?.condition }</td>
              <td className="p-3 align-middle text-sm text-white/90">{ card?.marketPrice }</td>
              <td className="p-3 align-middle text-white">
                <input
                  type="number"
                  className="w-16 text-center rounded bg-white/5"
                  min={ 1 }
                  max={ card.quantity }
                  value={ editValues[ card._id ]?.deleteAmount || 1 }
                  onChange={ ( e ) =>
                    setEditValues( ( prev ) => ( {
                      ...prev,
                      [ card._id ]: {
                        ...prev[ card._id ],
                        deleteAmount: parseInt( e.target.value ) || 1
                      }
                    } ) )
                  }
                  onClick={ ( e ) => e.stopPropagation() }
                />
              </td>
              <td className="p-3 align-middle">
                <button
                  type="button"
                  onClick={ ( e ) => {
                    e.stopPropagation();
                    handleDelete( card._id );
                  } }
                  className="text-red-400 hover:text-red-200 text-sm font-semibold"
                >
                  Delete
                </button>
              </td>
            </tr>
          ) ) }
        </tbody>
      </table>
    </div>
  );
};

export default TableView;

