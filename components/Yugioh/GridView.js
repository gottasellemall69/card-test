import { useCallback, useMemo, useState } from 'react';
import Image from 'next/image';
import Notification from '@/components/Notification';
import cardData from '@/public/card-data/Yugioh/card_data';

const GridView = ({ aggregatedData, onDeleteCard, onUpdateCard }) => {
  const [edit, setEdit] = useState({});
  const [editValues, setEditValues] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '' });

  const handleEdit = (cardId, field) => {
    setEdit(prev => ({ ...prev, [cardId]: field }));
    const card = aggregatedData.find((card) => card._id === cardId);
    if (card) {
      setEditValues(prev => ({ ...prev, [cardId]: { ...card } }));
    }
  };

  const handleChange = (e, cardId, field) => {
    const { value } = e.target;
    setEditValues((prev) => ({
      ...prev,
      [cardId]: { ...prev[cardId], [field]: value },
    }));
  };

  const handleSave = useCallback(async (cardId, field) => {
    try {
      const value = parseFloat(editValues[cardId][field]);
      await onUpdateCard(cardId, field, value);
      setEdit((prev) => ({ ...prev, [cardId]: null }));
      setNotification({ show: true, message: 'Card quantity updated successfully!' });
    } catch (error) {
      console.error('Error saving card:', error);
    }
  }, [editValues, onUpdateCard]);

  const updateQuantity = useCallback(async (cardId, quantity) => {
    try {
      if (quantity <= 0) {
        await onDeleteCard(cardId);
        setNotification({ show: true, message: 'Card deleted successfully!' });
      } else {
        await onUpdateCard(cardId, 'quantity', quantity);
        setNotification({ show: true, message: 'Card quantity updated successfully!' });
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  }, [onDeleteCard, onUpdateCard]);

  const handleDelete = useCallback(async (cardId) => {
    const card = aggregatedData.find((card) => card?._id === cardId);
    if (card) {
      const newQuantity = parseFloat(card.quantity) - 1;
      await updateQuantity(cardId, newQuantity);
    }
  }, [aggregatedData, updateQuantity]);

  const getFullImagePath = useCallback((cardId) => `/images/yugiohImages/${String(cardId)}.webp`, []);

  const getCardImage = useCallback((cardName) => {
    const cardInfo = cardData.find(item => item.name === cardName);
    return cardInfo ? { full: getFullImagePath(cardInfo.id) } : null;
  }, [getFullImagePath]);

  const memoizedAggregatedData = useMemo(() => aggregatedData, [aggregatedData]);

  return (
    <>
      <div className="my-10 mx-auto">
        {memoizedAggregatedData.map((card) => {
          const cardImages = getCardImage(card.productName);
          return (
            <div key={card._id} className="card mx-auto">
              <div className="wrapper mx-auto">
                <Image
                  className="cover-image"
                  priority={true}
                  unoptimized={true}
                  src={cardImages ? cardImages.full : '/images/yugioh-card.png'}
                  alt={`${card.productName}`}
                  quality={75}
                  width={240}
                  height={310}
                />
                <div className="black-overlay"></div>
                <span className="mx-auto details p-2">
                  <h3 className="title text-xl font-black text-filter outline-2 outline-black text-white">{card.productName}</h3>
                  <div>Set: {card.setName}</div>
                  <div>Number: {card.number}</div>
                  <div>Rarity: {card.rarity}</div>
                  <div>Printing: {card.printing}</div>
                  <div>Condition: {card.condition}</div>
                  <div>Market Price: ${card.marketPrice}</div>
                </span>
              </div>
              <span className="mx-auto inline-flex flex-row w-full flex-wrap">
                <div className="float-start text-sm font-medium text-gray-400">
                  Quantity:
                  {edit[card._id] === 'quantity' ? (
                    <input
                      type="number"
                      name="quantity"
                      value={editValues[card._id]?.quantity || ''}
                      onChange={(e) => handleChange(e, card._id, 'quantity')}
                      onBlur={() => handleSave(card._id, 'quantity')}
                    />
                  ) : (
                    <span className="cursor-pointer rounded-sm mx-auto p-1" onClick={() => handleEdit(card._id, 'quantity')}>{card.quantity}</span>
                  )}
                </div>
                <div><button onClick={() => handleDelete(card._id)} className="float-end  text-red-500 font-medium text-sm hover:text-red-800">
                  Delete
                </button></div>
                
              </span>
            </div>
          );
        })}
      </div>
      <div className="mx-auto z-50 align-middle justify-center items-center content-center place-self-center w-fit">
        <Notification show={notification.show} setShow={(show) => setNotification((prev) => ({ ...prev, show }))} message={notification.message} />
      </div>
    </>
  );
};

export default GridView;
