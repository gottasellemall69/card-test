import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
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

  const handleEdit = ( cardId, field ) => {
    setEdit( ( prev ) => ( { ...prev, [ cardId ]: field } ) );
    const card = aggregatedData.find( ( c ) => c._id === cardId );
    if ( card ) {
      setEditValues( ( prev ) => ( {
        ...prev,
        [ cardId ]: { ...card, deleteAmount: 1 },
      } ) );
    }
  };

  const handleChange = ( event, cardId, field ) => {
    const { value } = event.target;
    setEditValues( ( prev ) => ( {
      ...prev,
      [ cardId ]: { ...prev[ cardId ], [ field ]: value },
    } ) );
  };

  const handleSave = async ( cardId, field ) => {
    try {
      const value = parseFloat( editValues[ cardId ][ field ] );
      await onUpdateCard( cardId, field, value );
      setEdit( ( prev ) => ( { ...prev, [ cardId ]: null } ) );
      setNotification( { show: true, message: 'Card quantity updated successfully!' } );
    } catch ( error ) {
      console.error( 'Save failed', error );
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
    } catch ( error ) {
      console.error( 'Quantity update failed', error );
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
    const sortableItems = [ ...( aggregatedData || [] ) ];
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
    return sortConfig.direction === 'ascending' ? '-' : '+';
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
      source: 'collection',
    };

    if ( cardId ) {
      query.card = cardId;
    } else {
      query.productName = card?.productName;
    }

    router.push( {
      pathname: '/yugioh/sets/[letter]/cards/card-details',
      query,
    } );
  };

  return (
    <>

      <div class="flex flex-col overflow-x-auto glass">
        <div class="mx-auto max-w-[90%] bg-none rounded-lg ">


          <table className="responsive-table text-sm text-white">
            <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/70">
              <tr>
                <th scope="col" onClick={ () => handleSort( 'quantity' ) } className="p-3 align-middle text-sm text-white/70 text-nowrap cursor-pointer">
                  Qty { getSortArrow( 'quantity' ) }
                </th>
                <th scope="col" onClick={ () => handleSort( 'productName' ) } className="p-3 align-middle text-sm text-white/70 text-nowrap cursor-pointer">
                  Name { getSortArrow( 'productName' ) }
                </th>
                <th scope="col" onClick={ () => handleSort( 'setName' ) } className="p-3 align-middle text-sm text-white/70 text-nowrap cursor-pointer">
                  Set { getSortArrow( 'setName' ) }
                </th>
                <th scope="col" onClick={ () => handleSort( 'number' ) } className="p-3 align-middle text-sm text-white/70 text-nowrap cursor-pointer">
                  Number { getSortArrow( 'number' ) }
                </th>
                <th scope="col" onClick={ () => handleSort( 'printing' ) } className="p-3 align-middle text-sm text-white/70 text-nowrap cursor-pointer">
                  Printing { getSortArrow( 'printing' ) }
                </th>
                <th scope="col" onClick={ () => handleSort( 'rarity' ) } className="p-3 align-middle text-sm text-white/70 text-nowrap cursor-pointer">
                  Rarity { getSortArrow( 'rarity' ) }
                </th>
                <th scope="col" onClick={ () => handleSort( 'condition' ) } className="p-3 align-middle text-sm text-white/70 text-nowrap cursor-pointer">
                  Condition { getSortArrow( 'condition' ) }
                </th>
                <th scope="col" onClick={ () => handleSort( 'marketPrice' ) } className="p-3 align-middle text-sm text-white/70 text-nowrap cursor-pointer">
                  Price { getSortArrow( 'marketPrice' ) }
                </th>
                <th scope="col" className="text-left">
                  Delete Qty
                </th>
                <th scope="col" className="p-3 align-middle text-sm text-white/70 text-nowrap text-left">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 lg:divide-transparent">
              { sortedData?.map( ( card, index ) => (
                <tr key={ card._id ?? index } className="interactive-row">
                  <td data-label="Qty" className="align-middle">
                    { edit[ card._id ] === 'quantity' ? (
                      <input
                        type="number"
                        className="w-16 text-center rounded bg-white/5"
                        value={ editValues[ card._id ]?.quantity || '' }
                        onChange={ ( event ) => handleChange( event, card._id, 'quantity' ) }
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
                  <td
                    data-label="Name"
                    title="View details"
                    className="align-middle text-sm font-semibold text-white hover:underline"
                    onClick={ ( event ) => {
                      if ( event.target.closest && event.target.closest( 'input,button,a,label,svg,path' ) ) {
                        return;
                      }
                      handleRowNavigation( card );
                    } }
                  >
                    { card?.productName }
                  </td>
                  <td data-label="Set" className="p-5 align-middle text-sm text-white/70">
                    { card?.setName }
                  </td>
                  <td data-label="Number" className="p-5 align-middle text-sm text-white/70">
                    { card?.number }
                  </td>
                  <td data-label="Printing" className="p-5 align-middle text-sm text-white/70">
                    { card?.printing }
                  </td>
                  <td data-label="Rarity" className="p-5 align-middle text-sm text-white/70">
                    { card?.rarity }
                  </td>
                  <td data-label="Condition" className="p-5 align-middle text-sm text-white/70">
                    { card?.condition }
                  </td>
                  <td data-label="Price" className="p-5 align-middle text-sm text-white/70">
                    { card?.marketPrice }
                  </td>
                  <td data-label="Delete Qty" className="p-5 align-middle text-sm text-white/70">
                    <input
                      type="number"
                      className="w-16 text-center rounded bg-white/5"
                      min={ 1 }
                      max={ card.quantity }
                      value={ editValues[ card._id ]?.deleteAmount || 1 }
                      onChange={ ( event ) =>
                        setEditValues( ( prev ) => ( {
                          ...prev,
                          [ card._id ]: {
                            ...prev[ card._id ],
                            deleteAmount: parseInt( event.target.value, 10 ) || 1,
                          },
                        } ) )
                      }
                      onClick={ ( event ) => event.stopPropagation() }
                    />
                  </td>
                  <td data-label="Actions" className="align-middle">
                    <button
                      type="button"
                      onClick={ ( event ) => {
                        event.stopPropagation();
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
      </div>
      <Notification
        show={ notification.show }
        setShow={ ( showValue ) => setNotification( ( prev ) => ( { ...prev, show: showValue } ) ) }
        message={ notification.message }
      />
    </>

  );
};

export default TableView;
