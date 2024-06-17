import React, {useState, useEffect, useContext, useCallback} from 'react'
import {useMarketPrice} from '@/context/MarketPriceContext'
import Notification from '@/components/Notification'

const GridView=({aggregatedData, onDeleteCard, onUpdateCard, setAggregatedData}) => {
  const fetchMarketPrice=useContext(useMarketPrice)
  const [edit, setEdit]=useState({})
  const [editValues, setEditValues]=useState({})
  const [notification, setNotification]=useState({show: false, message: ''})
  const [subtotalMarketPrice, setSubtotalMarketPrice]=useState(0)
  const [totalCardCount, setTotalCardCount]=useState(0)

  useEffect(() => {
    if(Array.isArray(aggregatedData)) {
      const subtotal=aggregatedData.reduce((sum, card) => sum+(card.marketPrice*card.quantity), 0)
      setSubtotalMarketPrice(subtotal)
    }
  }, [aggregatedData])

  useEffect(() => {
    const fetchCardCount=async () => {
      try {
        const response=await fetch('/api/countCards')
        const data=await response.json()
        setTotalCardCount(data.totalQuantity)

      } catch(error) {
        console.error('Error fetching card count:', error)
      }
    }
    fetchCardCount()
  }, [aggregatedData])

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

  const handleSave=useCallback(async (cardId, field) => {
    try {
      if(cardId&&editValues[cardId]&&field) {
        const value=parseFloat(editValues[cardId][field])
        await onUpdateCard(cardId, field, value)
        setEdit({...edit, [cardId]: null})
        setNotification({show: true, message: 'Card quantity updated successfully!'})

        // Fetch updated card count
        const response=await fetch('/api/countCards')
        const data=await response.json()
        setTotalCardCount(data.totalQuantity)

      } else {
        throw new Error('Invalid data or missing card ID or field')
      }
    } catch(error) {
      console.error('Error saving card:', error)
    }

  }, [edit, editValues, onUpdateCard])

  const updateQuantity=useCallback(async (cardId, quantity) => {
    if(quantity<=0) {
      await onDeleteCard(cardId)
      setNotification({show: true, message: 'Card deleted successfully!'})
    } else {
      await onUpdateCard(cardId, 'quantity', quantity)
      setNotification({show: true, message: 'Card quantity decreased successfully!'})
    }
  }, [onDeleteCard, onUpdateCard])

  const handleDelete=useCallback(async (cardId) => {
    try {
      const card=aggregatedData.find(card => card?._id===cardId)
      if(card) {
        const newQuantity=parseFloat(card.quantity-1)
        await updateQuantity(cardId, newQuantity)
      } else {
        throw new Error('Card not found')
      }
    } catch(error) {
      console.error('Error deleting card:', error)
    }
  }, [aggregatedData, updateQuantity])

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
    <>
      <div className="mt-6">
        <div className="text-xl font-semibold p-2">Collection Value: ${subtotalMarketPrice.toFixed(2)}</div>
        <div className="text-xl font-semibold p-2">Cards in Collection: {totalCardCount}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 max-h-[750px] overflow-y-auto p-5">

        {aggregatedData?.map((card, index) => (
          <div key={index} className="bg-transparent rounded-md border border-gray-100 p-6 shadow-md shadow-black/5">
            <div className="flex items-center mb-1">
              <div className="text-2xl font-semibold">{card?.productName}</div>
            </div>
            <div className="text-sm font-medium text-gray-400">Set: {card?.setName}</div>
            <div className="text-sm font-medium text-gray-400">Number: {card?.number}</div>
            <div className="text-sm font-medium text-gray-400">Rarity: {card?.rarity}</div>
            <div className="text-sm font-medium text-gray-400">Printing: {card?.printing}</div>
            <div className="text-sm font-medium text-gray-400">Condition: {card?.condition}</div>
            <div className="text-sm font-medium text-gray-400 inline-block align-baseline">Market Price: {card?.marketPrice}
              {index>0&&(
                <div className="rounded inline-block ml-3 text-lg">
                  {calculatePriceTrend(aggregatedData[index-1].marketPrice, card?.marketPrice)==='+'
                    ? <span className="text-emerald-500 text-2xl inline-block">↑</span>
                    :calculatePriceTrend(aggregatedData[index-1].marketPrice, card?.marketPrice)==='-'
                      ? <span className="text-rose-500 text-2xl inline-block">↓</span>
                      :<span className="text-gray-500 text-2xl inline-block"></span>
                  }
                  {Math.abs((aggregatedData[index-1].marketPrice-card?.marketPrice).toFixed(2))}
                </div>
              )}
            </div>
            <div className="text-sm font-medium text-gray-400">Quantity:
              {edit[card._id]==='quantity'? (
                <input type="number" name="quantity" value={editValues[card._id]?.quantity||''} onChange={(e) => handleChange(e, card._id, 'quantity')} onBlur={() => handleSave(card._id, 'quantity')} />
              ):(
                <span className='cursor-pointer rounded-sm mx-auto' onClick={() => handleEdit(card?._id, 'quantity')}> {card?.quantity}</span>
              )}
            </div>
            <button onClick={() => handleDelete(card?._id)} className="text-red-500 font-medium text-sm hover:text-red-800">Delete</button>
          </div>
        ))}
        <Notification show={notification.show} setShow={(show) => setNotification({...notification, show})} message={notification.message} />
      </div>
    </>
  )
}

export default GridView
