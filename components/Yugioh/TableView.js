import { useMemo, useState } from 'react';
import Notification from '@/components/Notification';

const TableView = ( { aggregatedData, onDeleteCard, onUpdateCard } ) => {
  const [ sortConfig, setSortConfig ] = useState( { key: null, direction: 'ascending' } );
  const [ edit, setEdit ] = useState( {} );
  const [ editValues, setEditValues ] = useState( {} );
  const [ notification, setNotification ] = useState( { show: false, message: '' } );

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
    return sortConfig.direction === 'ascending' ? '▲' : '▼';
  };

  return (
    <div className="overflow-x-auto">
      <Notification show={ notification.show } setShow={ ( s ) => setNotification( prev => ( { ...prev, show: s } ) ) } message={ notification.message } />

      <table className="w-full table-auto">
        <thead className='border border-zinc-300'>
          <tr>
            <th onClick={ () => handleSort( 'quantity' ) } className="sticky cursor-pointer top-0 z-10 p-2 border-x-2 border-y-2 border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-sm lg:text-base font-black text-white whitespace-pre backdrop-blur backdrop-filter">
              Qty { getSortArrow( 'quantity' ) }
            </th>
            <th onClick={ () => handleSort( 'productName' ) } className="sticky cursor-pointer top-0 z-10 p-2 border-x-2 border-y-2 border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-sm lg:text-base font-black text-white whitespace-pre backdrop-blur backdrop-filter">
              Name { getSortArrow( 'productName' ) }
            </th>
            <th onClick={ () => handleSort( 'setName' ) } className="sticky cursor-pointer top-0 z-10 p-2 border-x-2 border-y-2 border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-sm lg:text-base font-black text-white whitespace-pre backdrop-blur backdrop-filter">
              Set { getSortArrow( 'setName' ) }
            </th>
            <th onClick={ () => handleSort( 'number' ) } className="sticky cursor-pointer top-0 z-10 p-2 border-x-2 border-y-2 border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-sm lg:text-base font-black text-white whitespace-pre backdrop-blur backdrop-filter">
              Number { getSortArrow( 'number' ) }
            </th>
            <th onClick={ () => handleSort( 'rarity' ) } className="sticky cursor-pointer top-0 z-10 p-2 border-x-2 border-y-2 border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-sm lg:text-base font-black text-white whitespace-pre backdrop-blur backdrop-filter">
              Rarity { getSortArrow( 'rarity' ) }
            </th>
            <th onClick={ () => handleSort( 'condition' ) } className="sticky cursor-pointer top-0 z-10 p-2 border-x-2 border-y-2 border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-sm lg:text-base font-black text-white whitespace-pre backdrop-blur backdrop-filter">
              Condition { getSortArrow( 'condition' ) }
            </th>
            <th onClick={ () => handleSort( 'marketPrice' ) } className="sticky cursor-pointer top-0 z-10 p-2 border-x-2 border-y-2 border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-sm lg:text-base font-black text-white whitespace-pre backdrop-blur backdrop-filter">
              Price { getSortArrow( 'marketPrice' ) }
            </th>
            <th className="sticky top-0 z-10 p-2 border-x-2 border-y-2 border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-sm lg:text-base font-black text-white whitespace-pre backdrop-blur backdrop-filter">
            </th>
            <th className="rounded sticky top-0 z-10 border-x-2 border-y-2 border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-sm lg:text-base font-black text-white whitespace-pre backdrop-blur backdrop-filter">
            </th>
          </tr>
        </thead>
        <tbody className="w-full max-h-[450px] overflow-y-auto">
          { sortedData?.map( ( card, index ) => (
            <tr key={ ( card._id, index ) } className="glass transition-colors">
              <td className="text-white p-2">
                { edit[ card._id ] === 'quantity' ? (
                  <input
                    type="number"
                    className="text-black w-16 text-center"
                    value={ editValues[ card._id ]?.quantity || '' }
                    onChange={ ( e ) => handleChange( e, card._id, 'quantity' ) }
                    onBlur={ () => handleSave( card._id, 'quantity' ) }
                  />
                ) : (
                  <span
                    className="cursor-pointer hover:text-purple-300"
                    onClick={ () => handleEdit( card._id, 'quantity' ) }
                  >
                    { card.quantity }
                  </span>
                ) }
              </td>
              <td className="p-2 text-center border-t border-gray-100 text-xs lg:text-sm sm:text-left">{ card?.productName }</td>
              <td className="p-2 text-center border-t border-gray-100 text-xs lg:text-sm sm:text-left">{ card?.setName }</td>
              <td className="p-2 text-center border-t border-gray-100 text-xs lg:text-sm sm:text-left">{ card?.number }</td>
              <td className="p-2 text-center border-t border-gray-100 text-xs lg:text-sm sm:text-left">{ card?.rarity }</td>
              <td className="p-2 text-center border-t border-gray-100 text-xs lg:text-sm sm:text-left">{ card?.condition }</td>
              <td className="p-2 text-center border-t border-gray-100 text-xs lg:text-sm sm:text-left">{ card?.marketPrice }</td>
              <td className="text-white p-2 flex flex-row items-center gap-2">
                <input
                  type="number"
                  className="w-14 text-black text-center"
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
                />
                <button
                  onClick={ () => handleDelete( card._id ) }
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