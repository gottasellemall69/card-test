import React, {useState, useEffect, useCallback, useRef} from 'react'
import Notification from '@/components/Notification'
import {useMarketPrice} from '@/context/MarketPriceContext'

const GridView=({aggregatedData, onDeleteCard, onUpdateCard}) => {
  const [notification, setNotification]=useState({show: false, message: ''})
  const [edit, setEdit]=useState({})
  const [editValues, setEditValues]=useState({})
  const [subtotalMarketPrice, setSubtotalMarketPrice]=useState(0)
  const [collectionTotal, setCollectionTotal]=useState([])
  const [priceChanges, setPriceChanges]=useState({})
  const {fetchMarketPrice}=useMarketPrice()
  const lastFetchTime=useRef({})

  useEffect(() => {
    if(Array.isArray(aggregatedData)) {
      const subtotal=aggregatedData.reduce((sum, card) => sum+card.marketPrice, 0)
      setSubtotalMarketPrice(subtotal)
    }
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
        const value=editValues[cardId][field]
        await onUpdateCard(cardId, field, value)
        setEdit({...edit, [cardId]: null})
        setNotification({show: true, message: 'Card quantity updated successfully!'})
      } else {
        throw new Error('Invalid data or missing card ID or field')
      }
    } catch(error) {
      console.error('Error saving card:', error)
    }
  }, [edit, editValues, onUpdateCard])

  const updateQuantity=useCallback(async (cardId, quantity) => {
    if(quantity===0) {
      await onDeleteCard(cardId)
      setNotification({show: true, message: 'Card deleted successfully!'})
    }
    else {
      await onUpdateCard(cardId, 'quantity', quantity)
      setNotification({show: true, message: 'Card quantity decreased successfully!'})
    }

  }, [onDeleteCard, onUpdateCard])

  const handleDelete=useCallback(async (cardId) => {
    try {
      const card=aggregatedData.find(card => card?._id===cardId)
      if(card) {
        const newQuantity=card.quantity-1
        await updateQuantity(cardId, newQuantity)

      } else {
        throw new Error('Card not found')
      }
    } catch(error) {
      console.error('Error deleting card:', error)
      setNotification({show: true, message: 'Card not found!'})
    }
  }, [aggregatedData, updateQuantity])

  const calculatePriceTrend=useCallback(async (cardId, previousPrice, currentPrice) => {
    let trend=''
    let change=0

    if(currentPrice>previousPrice) {
      trend='+'
      change=currentPrice-previousPrice
    } else if(currentPrice<previousPrice) {
      trend='-'
      change=previousPrice-currentPrice
    }

    setPriceChanges(prevState => ({
      ...prevState,
      [cardId]: {change, trend}
    }))

    await onUpdateCard(cardId, 'marketPrice', currentPrice)
  }, [onUpdateCard])

  const throttleFetch=(setName, wait) => {
    const now=Date.now()
    if(lastFetchTime.current[setName]&&(now-lastFetchTime.current[setName]<wait)) {
      return false
    }
    lastFetchTime.current[setName]=now
    return true
  }

  const updateMarketPrices=useCallback(async () => {
    if(Array.isArray(aggregatedData)) {
      const setNames=[...new Set(aggregatedData.map(card => card.setName))]

      for(const setName of setNames) {
        if(throttleFetch(setName, 3600000)) { // Throttle requests to every 60 minutes per set
          const setCards=aggregatedData.filter(card => card.setName===setName)
          const setData=await fetchMarketPrice(setName)

          setCards.forEach(async (card) => {
            const previousPrice=card.marketPrice
            const currentPrice=setData.find(c => c.number===card.number)?.marketPrice

            if(currentPrice!==null&&currentPrice!==undefined&&currentPrice!==previousPrice) {
              calculatePriceTrend(card._id, previousPrice, currentPrice)
            }
          })
        }
      }
    }
  }, [aggregatedData, calculatePriceTrend, fetchMarketPrice])

  useEffect(() => {
    updateMarketPrices()

    // Set up interval to re-fetch market prices every hour
    const intervalId=setInterval(updateMarketPrices, 3600000)

    return () => clearInterval(intervalId)
  }, [aggregatedData, updateMarketPrices])


  return (
    <>


      <div className="mt-6">
        <div className="text-xl font-semibold p-2">Collection Value: ${subtotalMarketPrice.toFixed(2)}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 max-h-[750px] overflow-y-auto p-5">
        {Array.isArray(aggregatedData)&&aggregatedData.map((card, index) => (
          <div key={index} className="bg-transparent rounded-md border border-gray-100 p-6 shadow-md shadow-black/5">
            <div className="flex items-center mb-1">
              <div className="text-2xl font-semibold">{card?.productName}</div>
            </div>
            <div className="text-sm font-medium text-gray-400">Set: {card?.setName}</div>
            <div className="text-sm font-medium text-gray-400">Number: {card?.number}</div>
            <div className="text-sm font-medium text-gray-400">Rarity: {card?.rarity}</div>
            <div className="text-sm font-medium text-gray-400">Printing: {card?.printing}</div>
            <div className="text-sm font-medium text-gray-400">Condition: {card?.condition}</div>
            <div className="text-sm font-medium text-gray-400 inline-block align-baseline">Market Price: {card?.marketPrice.toFixed(2)}            <div className="flex items-center mt-2">
              {edit[card?._id]==='quantity'? (
                <input
                  type="number"
                  value={editValues[card?._id].quantity}
                  onChange={(e) => handleChange(e, card?._id, 'quantity')}
                  className="border border-gray-300 rounded text-black"
                />
              ):(
                <span className="">Quantity: {card?.quantity}</span>
              )}
              {edit[card?._id]==='quantity'? (
                <button
                  className="text-stone-200 hover:underline ml-1"
                  onClick={() => handleSave(card?._id, 'quantity')}
                >Save</button>
              ):(
                <button
                  className="text-stone-200 hover:underline ml-5"
                  onClick={() => handleEdit(card?._id, 'quantity')}
                >Edit</button>
              )}
            </div>
              {priceChanges[card?._id]&&(
                <div className="rounded inline-block text-lg">
                  {priceChanges[card?._id].trend==='+'
                    ? <span className="text-emerald-500 text-2xl inline-block">↑</span>
                    :priceChanges[card?._id].trend==='-'
                      ? <span className="text-rose-500 text-2xl inline-block">↓</span>
                      :<span className="text-gray-500 text-2xl inline-block"></span>
                  }
                  {Math.abs(priceChanges[card?._id].change).toFixed(2)}
                </div>
              )}
              <button
                onClick={() => handleDelete(card?._id)}
                className="text-red-500 hover:text-white text-sm bg-transparent font-black rounded-lg w-fit px-1 mt-4 py-1"
              >Delete Card</button>
            </div>
          </div>
        ))}
      </div>
      <Notification show={notification.show} setShow={(show) => setNotification({...notification, show})} message={notification.message} />
    </>
  )
}

export default GridView