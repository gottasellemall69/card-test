import React, {useState} from 'react'


const MyCollection=({aggregatedData}) => {


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
        <div className="grid grid-cols-1 gap-6 mb-6">
          <div className="p-6 relative flex flex-col min-w-0 mb-4 lg:mb-0 break-words w-full rounded">
            <div className="rounded-t mb-0 px-0 border-0">
              <div className="block w-full overflow-x-auto max-h-[750px] overflow-y-auto">
                <table className="text-white items-center w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="sticky top-0 z-10 p-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter">Qty</th>
                      <th className="sticky top-0 z-10 p-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter">Name</th>
                      <th className="sticky top-0 z-10 p-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter">Set</th>
                      <th className="sticky top-0 z-10 p-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter">Number</th>
                      <th className="sticky top-0 z-10 p-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter">Printing</th>
                      <th className="sticky top-0 z-10 p-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter">Rarity</th>
                      <th className="sticky top-0 z-10 p-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter">Condition</th>
                      <th className="sticky top-0 z-10 p-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter">Price</th>
                      <th className="sticky top-0 z-10 p-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter">Shift</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aggregatedData?.map((card, index) => (
                      <tr key={index} className="bg-white">
                        <td className="border border-gray-800 p-1 whitespace-pre-wrap text-sm font-medium text-black hover:bg-black hover:text-white">{card?.quantity}</td>
                        <td className="border border-gray-800 p-1 whitespace-pre-wrap text-sm font-medium text-black hover:bg-black hover:text-white">{card?.productName}</td>
                        <td className="border border-gray-800 p-1 whitespace-pre-wrap text-sm font-medium text-black hover:bg-black hover:text-white">{card?.setName}</td>
                        <td className="border border-gray-800 p-1 whitespace-pre-wrap text-sm font-medium text-black hover:bg-black hover:text-white">{card?.number}</td>
                        <td className="border border-gray-800 p-1 whitespace-pre-wrap text-sm font-medium text-black hover:bg-black hover:text-white">{card?.printing}</td>
                        <td className="border border-gray-800 p-1 whitespace-pre-wrap text-sm font-medium text-black hover:bg-black hover:text-white">{card?.rarity}</td>
                        <td className="border border-gray-800 p-1 whitespace-pre-wrap text-sm font-medium text-black hover:bg-black hover:text-white">{card?.condition}</td>
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
