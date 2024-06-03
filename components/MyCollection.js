import React from 'react'

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
                      <th className="sticky top-0 z-10 p-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter">Condition</th>
                      <th className="sticky top-0 z-10 p-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter">Market Price</th>
                    </tr>
                  </thead>
                  <tbody className="relative">
                    {aggregatedData?.map((card, index) => (
                      <tr key={index}>
                        <td className="p-2 text-center border-t border-gray-100 text-sm">{card?.quantity}</td>
                        <td className="p-2 text-center border-t border-gray-100 text-sm">{card?.productName}</td>
                        <td className="p-2 text-center border-t border-gray-100 text-sm">{card?.setName}</td>
                        <td className="p-2 text-center border-t border-gray-100 text-sm">{card?.number}</td>
                        <td className="p-2 text-center border-t border-gray-100 text-sm">{card?.printing}</td>
                        <td className="p-2 text-center border-t border-gray-100 text-sm">{card?.condition}</td>
                        <td className="p-2 text-center border-t border-gray-100 text-sm">{card?.marketPrice.toFixed(2)}
                          {index>0&&(
                            <div className="rounded inline-block ml-3 text-lg">
                              {calculatePriceTrend(aggregatedData[index-1].marketPrice, card.marketPrice)==='+'
                                ? <span className="text-emerald-500 text-2xl inline-block">↑</span>
                                :calculatePriceTrend(aggregatedData[index-1].marketPrice, card.marketPrice)==='-'
                                  ? <span className="text-rose-500 text-2xl inline-block">↓</span>
                                  :<span className="text-gray-500 text-2xl inline-block"></span>
                              }
                              {Math.abs((aggregatedData[index-1].marketPrice-card.marketPrice).toFixed(3))}
                            </div>
                          )}
                        </td>
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
