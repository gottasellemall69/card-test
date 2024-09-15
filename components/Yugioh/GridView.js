'use client';
import Notification from '@/components/Notification';
import cardData from '@/public/card-data/Yugioh/card_data';
import Image from 'next/image';
import { useCallback, useMemo, useState } from 'react';

const GridView = ({ aggregatedData, onDeleteCard, onUpdateCard }) => {
  const [edit, setEdit] = useState({});
  const [editValues, setEditValues] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '' });

  const handleEdit = (cardId, field) => {
    setEdit({ ...edit, [cardId]: field });
    setEditValues({
      ...editValues,
      [cardId]: { ...aggregatedData.find(card => card._id === cardId) }
    });
  };

  const handleChange = (e, cardId, field) => {
    setEditValues({
      ...editValues,
      [cardId]: { ...editValues[cardId], [field]: e.target.value }
    });
  };

  const handleSave = useCallback(async (cardId, field) => {
    try {
      if (cardId && editValues[cardId] && field) {
        const value = parseFloat(editValues[cardId][field]);
        await onUpdateCard(cardId, field, value);
        setEdit({ ...edit, [cardId]: null });
        setNotification({ show: true, message: 'Card quantity updated successfully!' });


      } else {
        throw new Error('Invalid data or missing card ID or field');
      }
    } catch (error) {
      console.error('Error saving card:', error);
    }
  }, [edit, editValues, onUpdateCard]);

  const updateQuantity = useCallback(async (cardId, quantity) => {
    if (quantity <= 0) {
      await onDeleteCard(cardId);
      setNotification({ show: true, message: 'Card deleted successfully!' });
    } else {
      await onUpdateCard(cardId, 'quantity', quantity);
      setNotification({ show: true, message: 'Card quantity decreased successfully!' });
    }
  }, [onDeleteCard, onUpdateCard]);

  const handleDelete = useCallback(async (cardId) => {
    try {
      const card = aggregatedData.find(card => card?._id === cardId);
      if (card) {
        const newQuantity = parseFloat(card.quantity - 1);
        await updateQuantity(cardId, newQuantity);
      } else {
        throw new Error('Card not found');
      }
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  }, [aggregatedData, updateQuantity]);


  const getFullImagePath = useCallback((cardId) => `/images/yugiohImages/${ String(cardId) }.jpg`, []); // Use WebP format for better compression

  const getCardImage = useCallback((cardName) => {
    const cardInfo = cardData.find(item => item.name === cardName);
    return cardInfo ? { full: getFullImagePath(cardInfo?.id) } : null;
  }, [getFullImagePath]);

  const memoizedAggregatedData = useMemo(() => aggregatedData, [aggregatedData]);

  return (
    <>
      <div className="mx-auto w-full max-w-7xl sm:gap-10 lg:gap-3 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 mb-6">

        {memoizedAggregatedData?.map((card, index) => {
          const cardImages = getCardImage(card.productName);
          return (
            <div key={index} className="card mx-auto">
              <div className="wrapper mx-auto">
                <Image
                  priority
                  loading={'eager'}
                  unoptimized={true}
                  src={cardImages ? cardImages?.full : '/images/yugioh-card.png'} // Use WebP format for placeholder
                  alt={`${ card?.productName }`}
                  width={220}
                  height={375}
                  className="cover-image object-scale-down w-full h-auto object-center mx-auto"
                />
                <div className="black-overlay"></div>
                <div className="details">
                  <div className="title text-2xl font-black text-filter outline-2 outline-black text-white">{card.productName}</div>
                  <div>Set: {card.setName}</div>
                  <div>Number: {card.number}</div>
                  <div>Rarity: {card.rarity}</div>
                  <div>Printing: {card.printing}</div>
                  <div>Condition: {card.condition}</div>
                  <div>Market Price: ${card.marketPrice}</div>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-400 my-2.5">Quantity:
                {edit[card._id] === 'quantity' ? (
                  <input type="number" name="quantity" value={editValues[card._id]?.quantity || ''} onChange={(e) => handleChange(e, card._id, 'quantity')} onBlur={() => handleSave(card._id, 'quantity')} />
                ) : (
                  <span className='cursor-pointer rounded-sm mx-auto' onClick={() => handleEdit(card?._id, 'quantity')}> {card?.quantity}</span>
                )}
              </div>
              <button onClick={() => handleDelete(card._id)} className="text-red-500 font-medium text-sm hover:text-red-800">Delete</button>
            </div>);
        })}
        <Notification show={notification.show} setShow={(show) => setNotification({ ...notification, show })} message={notification.message} />
      </div>
    </>
  );
};

export default GridView;