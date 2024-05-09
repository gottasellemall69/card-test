import React, {useState} from 'react'
import Link from 'next/link'
import DownloadYugiohCSVButton from './DownloadYugiohCSVButton'

const MyCollection=({aggregatedData, onDeleteCard, onUpdateCard}) => {
  const [edit, setEdit]=useState({})
  const [editValues, setEditValues]=useState({})

  const handleEdit=(card, field) => {
    setEdit({...edit, [card]: field})
    setEditValues({...editValues, [card]: {...card}})
  }

  const handleChange=(e, cardId) => {
    setEditValues({
      ...editValues,
      [cardId]: {...editValues[cardId], [e.target.name]: e.target.value}
    })
  }

  const handleSave=(cardId) => {
    console.log('Saving card with ID:', cardId) // Debug log
    if(cardId&&editValues[cardId]) {
      onUpdateCard(cardId, editValues[cardId])
      setEdit({})
      setEditValues({})
    } else {
      console.error('Invalid data or missing card ID on save:', cardId, editValues[cardId])
    }
  }

  const handleDelete=(card) => {
    console.log('Card object:', card)
    const cardId=card._id

    console.log("Deleting card with ID:", cardId)
    if(cardId) {
      onDeleteCard(cardId)
    } else {
      console.error('Invalid cardId:', cardId)
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
    <>
      <div className="p-6">
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
                  <input type="text" name="printing" value={editValues[card.id]?.printing||''} onChange={(e) => handleChange(e, card._id)} onBlur={() => handleSave(card._id)} />
                ):(
                  <span onClick={() => handleEdit(card._id, 'printing')}>{card.printing}</span>
                )}
              </div>
              <div className="text-sm font-medium text-gray-400">Condition:
                {edit[card]==='condition'? (
                  <input type="text" name="condition" value={editValues[card._id]?.condition||''} onChange={(e) => handleChange(e, card._id)} onBlur={() => handleSave(card)} />
                ):(
                  <span onClick={() => handleEdit(card, 'condition')}>{card.condition}</span>
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
                {edit[card]==='quantity'? (
                  <input type="number" name="quantity" value={editValues[card._id]?.quantity||''} onChange={(e) => handleChange(e, card._id)} onBlur={() => handleSave(card._id)} />
                ):(
                  <span onClick={() => handleEdit(card, 'quantity')}>{card.quantity}</span>
                )}
              </div>
              <button onClick={() => handleDelete(card)} className="text-red-500 font-medium text-sm hover:text-red-800">Delete</button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 mb-6">
          <div className="p-6 relative flex flex-col min-w-0 mb-4 lg:mb-0 break-words w-full rounded">
            <div className="rounded-t mb-0 px-0 border-0">
              <div className="flex flex-wrap items-center px-4 py-2">
                <div className="relative w-full max-w-full flex-grow flex-1">
                  <h3 className="font-semibold text-base dark:text-gray-50">
                    <DownloadYugiohCSVButton
                      aggregatedData={aggregatedData}
                      userCardList={[]}
                    />
                  </h3>
                </div>
              </div>
              <div className="block w-full overflow-x-auto max-h-[750px] overflow-y-auto">
                <table className="text-white items-center w-full border-collapse">
                  <thead>
                    <tr>
                      <th
                        className="sticky top-0 z-10 p-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter">
                        Qty
                      </th>
                      <th
                        className="sticky top-0 z-10 p-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter">
                        Name
                      </th>
                      <th
                        className="hidden md:table-cell sticky top-0 z-10 p-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter">
                        Set
                      </th>
                      <th
                        className="sticky top-0 z-10 p-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter">
                        Number
                      </th>
                      <th
                        className="sticky top-0 z-10 p-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter">
                        Printing
                      </th>
                      <th
                        className="sticky top-0 z-10 p-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter">
                        Rarity
                      </th>
                      <th
                        className="hidden md:table-cell sticky top-0 z-10 p-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter">
                        Condition
                      </th>
                      <th
                        className="sticky top-0 z-10 p-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter">
                        Price
                      </th>
                      <th
                        className="sticky top-0 z-10 p-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter">
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {aggregatedData?.map((card, index) => (
                      <tr key={index} className="bg-white">
                        <td className="border border-gray-800 p-1 whitespace-pre-wrap text-sm font-medium text-black hover:bg-black hover:text-white">{card?.quantity}</td>
                        <td className="border border-gray-800 p-1 whitespace-pre-wrap text-sm font-medium text-black hover:bg-black hover:text-white">{card?.productName}</td>
                        <td className="border border-gray-800 p-1 whitespace-pre-wrap text-sm font-medium text-black hidden md:table-cell hover:bg-black hover:text-white">{card?.setName}</td>
                        <td className="border border-gray-800 p-1 whitespace-pre-wrap text-sm font-medium text-black hover:bg-black hover:text-white">{card?.number}</td>
                        <td className="border border-gray-800 p-1 whitespace-pre-wrap text-sm font-medium text-black hover:bg-black hover:text-white">{card?.printing}</td>
                        <td className="border border-gray-800 p-1 whitespace-pre-wrap text-sm font-medium text-black hover:bg-black hover:text-white">{card?.rarity}</td>
                        <td className="border border-gray-800 p-1 whitespace-pre-wrap text-sm font-medium text-black hidden md:table-cell hover:bg-black hover:text-white">{card?.condition}</td>
                        <td className="border border-gray-800 p-1 whitespace-pre-wrap text-sm font-medium text-black hover:bg-black hover:text-white">{card?.marketPrice}</td>

                        {index>0&&(
                          <td className="border border-gray-800 p-1 whitespace-pre-wrap text-sm font-medium text-black hover:bg-black hover:text-white">
                            <div className={`flex items-center text-sm font-semibold ${ calculatePriceTrend(aggregatedData[index-1].marketPrice, card.marketPrice)==='+'? 'text-emerald-600':'text-rose-500' }`}>
                              {calculatePriceTrend(aggregatedData[index-1].marketPrice, card.marketPrice)}{Math.abs((aggregatedData[index-1].marketPrice-card.marketPrice).toFixed(2))}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default MyCollection
