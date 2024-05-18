import React, {useState, useEffect} from 'react'
import Notification from '@/components/Notification'


const GridView=({aggregatedData, onDeleteCard, onUpdateCard, setAggregatedData}) => {
  const [notification, setNotification]=useState({
    show: false,
    message: ''
  })
  const [edit, setEdit]=useState({})
  const [editValues, setEditValues]=useState({})
  const handleEdit=(cardId, field) => {
    setEdit({...edit, [cardId]: field})
    setEditValues({
      ...editValues,
      [cardId]: {...aggregatedData.find(card => card._id===cardId)}
    })
  }
  const handleChange=(e, cardId, field) => {
    setEditValues({
      ...editValues,
      [cardId]: {...editValues[cardId], [field]: e.target.value}
    })
  }
  const handleSave=async (cardId, field) => {
    try {
      if(cardId&&editValues[cardId]&&field) {
        const updateCard={
          cardId,
          field,
          value: editValues[cardId][field]
        }

        const response=await fetch(`/api/updateCards`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateCard),
        })
        if(!response.ok) {
          throw new Error('Failed to update card')
        }
        const updatedCard=await response.json()

        // Update the local state
        setAggregatedData(currentData =>
          currentData.map(currentCard =>
            currentCard._id===cardId? {...currentCard, ...updatedCard}:currentCard
          )
        )
        setEdit({...edit, [cardId]: null})
      } else {
        throw new Error('Invalid data or missing card ID or field')
      }


    } catch(error) {
      console.error('Error saving card:', error)
    }
    setNotification({show: true, message: 'Card updated successfully!'})
  }

  const handleDelete=(cardId) => {
    try {
      onDeleteCard(cardId)
      setNotification({show: true, message: 'Card deleted successfully!'})

    } catch(error) {
      console.error('Error deleting card:', error)
    }
  }

  const calculatePriceTrend=(previousPrice, currentPrice) => {
    if(currentPrice>previousPrice) {
      return '+'
    } else if(currentPrice<previousPrice) {
      return '-'
    } else {
      return ''
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 max-h-[750px] overflow-y-auto">
      {aggregatedData?.map((card, index) => (
        <div key={index} className="bg-transparent rounded-md border border-gray-100 p-6 shadow-md shadow-black/5">
          <div className="flex items-center mb-1">
            <div className="text-2xl font-semibold">{card?.productName}</div>
          </div>
          <div className="text-sm font-medium text-gray-400">Set: {card?.setName}</div>
          <div className="text-sm font-medium text-gray-400">Number: {card?.number}</div>
          <div className="text-sm font-medium text-gray-400">Rarity: {card?.rarity}</div>
          <div className="text-sm font-medium text-gray-400">Printing:
            {edit[card._id]==='printing'? (
              <input type="text" name="printing" value={editValues[card._id]?.printing||''} onChange={(e) => handleChange(e, card._id, 'printing')} onBlur={() => handleSave(card._id, 'printing')} />
            ):(
              <span onClick={() => handleEdit(card._id, 'printing')}> {card.printing}</span>
            )}
          </div>
          <div className="text-sm font-medium text-gray-400">Condition:
            {edit[card._id]==='condition'? (
              <input type="text" name="condition" value={editValues[card._id]?.condition||''} onChange={(e) => handleChange(e, card._id, 'condition')} onBlur={() => handleSave(card._id, 'condition')} />
            ):(
              <span onClick={() => handleEdit(card._id, 'condition')}> {card.condition}</span>
            )}
          </div>
          <div className="text-sm font-medium text-gray-400 inline-block align-baseline">Market Price: {card?.marketPrice}
            {index>0&&(
              <div className="rounded inline-block ml-3 text-lg">
                {calculatePriceTrend(aggregatedData[index-1].marketPrice, card.marketPrice)==='+'
                  ? <span className="text-emerald-500 text-2xl inline-block">↑</span>
                  :calculatePriceTrend(aggregatedData[index-1].marketPrice, card.marketPrice)==='-'
                    ? <span className="text-rose-500 text-2xl inline-block">↓</span>
                    :<span className="text-gray-500 text-2xl inline-block"></span>
                }
                {Math.abs((aggregatedData[index-1].marketPrice-card.marketPrice).toFixed(2))}
              </div>
            )}
          </div>
          <div className="text-sm font-medium text-gray-400">Quantity:
            {edit[card._id]==='quantity'? (
              <input type="number" name="quantity" value={editValues[card._id]?.quantity||''} onChange={(e) => handleChange(e, card._id, 'quantity')} onBlur={() => handleSave(card._id, 'quantity')} />
            ):(
              <span onClick={() => handleEdit(card._id, 'quantity')}> {card.quantity}</span>
            )}
          </div>
          <button onClick={() => handleDelete(card._id)} className="text-red-500 font-medium text-sm hover:text-red-800">Delete</button>
        </div>
      ))}
      <Notification show={notification.show} setShow={(show) => setNotification({...notification, show})} message={notification.message} />
    </div>

  )
}

export default GridView