// MyCollection.js
import React from 'react';

const MyCollection=({aggregatedData}) => {
  const calculatePriceTrend=(previousPrice,currentPrice) => {
    if(currentPrice>previousPrice) {
      return 'up';
    } else if(currentPrice<previousPrice) {
      return 'down';
    } else {
      return 'same';
    }
  };

  return (
    <div className="container mx-auto py-8 min-h-screen w-full">
      <h1 className="text-3xl font-semibold mb-4 p-5">My Collection</h1>
      <div className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 m-5 p-5 py-10">
        {aggregatedData?.map((card,index) => (
          <div key={index} className="bg-none shadow-md rounded-md p-4 relative border border-zinc-300">
            <h2 className="text-lg font-semibold mb-2">{card?.productName}</h2>
            <p className="text-grayscale-100 text-shadow mb-2">Set: {card?.setName}</p>
            <p className="text-grayscale-100 text-shadow mb-2">Number: {card?.number}</p>
            <p className="text-grayscale-100 text-shadow mb-2">Printing: {card?.printing}</p>
            <p className="text-grayscale-100 text-shadow mb-2">Rarity: {card?.rarity}</p>
            <p className="text-grayscale-100 text-shadow mb-2">Condition: {card?.condition}</p>
            <p className="text-grayscale-100 text-shadow mb-2">Price: {card?.marketPrice}</p>
            {index>0&&(
              <div
                className={`absolute top-0 left-0 -mt-3 -ml-3 w-8 h-8 rounded-full flex items-center justify-center ${calculatePriceTrend(aggregatedData[index-1].marketPrice,card.marketPrice)==='up'
                  ? 'bg-green-500'
                  :calculatePriceTrend(aggregatedData[index-1].marketPrice,card.marketPrice)==='down'
                    ? 'bg-red-500'
                    :'bg-gray-500'
                  }`}
              >
                <span
                  className={`text-white text-xs font-semibold ${calculatePriceTrend(aggregatedData[index-1].marketPrice,card.marketPrice)==='up'
                    ? 'transform rotate-45'
                    :calculatePriceTrend(aggregatedData[index-1].marketPrice,card.marketPrice)==='down'
                      ? 'transform rotate-45'
                      :''
                    }`}
                >
                  {calculatePriceTrend(aggregatedData[index-1].marketPrice,card.marketPrice)==='up'
                    ? '↑'
                    :calculatePriceTrend(aggregatedData[index-1].marketPrice,card.marketPrice)==='down'
                      ? '↓'
                      :'='}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyCollection;
