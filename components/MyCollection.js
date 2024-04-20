// MyCollection.js
import React from 'react';

const MyCollection=({cards}) => {
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
    <div>
      <div className="bg-grayscale-700 min-h-screen w-full">
        <div className="container mx-auto py-8">
          <h1 className="text-3xl font-semibold mb-4">My Collection</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards?.map((card,index) => (
              <div key={index} className="bg-none shadow-md rounded-md p-4 relative">
                <h2 className="text-lg font-semibold mb-2">{cards.productName}</h2>
                <p className="text-gray-500 mb-2">Set: {cards.setName}</p>
                <p className="text-gray-500 mb-2">Number: {cards.number}</p>
                <p className="text-gray-500 mb-2">Printing: {cards.printing}</p>
                <p className="text-gray-500 mb-2">Rarity: {cards.rarity}</p>
                <p className="text-gray-500 mb-2">Condition: {cards.condition}</p>
                <p className="text-gray-500 mb-2">Price: ${cards.marketPrice}</p>
                {index>0&&(
                  <div
                    className={`absolute top-0 left-0 -mt-3 -ml-3 w-6 h-6 rounded-full flex items-center justify-center ${calculatePriceTrend(cards[index-1].marketPrice,card.marketPrice)==='up'
                      ? 'bg-green-500'
                      :calculatePriceTrend(cards[index-1].marketPrice,card.marketPrice)==='down'
                        ? 'bg-red-500'
                        :'bg-gray-500'
                      }`}
                  >
                    <span
                      className={`text-white text-xs font-semibold ${calculatePriceTrend(cards[index-1].marketPrice,card.marketPrice)==='up'
                        ? 'transform rotate-45'
                        :calculatePriceTrend(cards[index-1].marketPrice,card.marketPrice)==='down'
                          ? 'transform rotate-45'
                          :''
                        }`}
                    >
                      {calculatePriceTrend(cards[index-1].marketPrice,card.marketPrice)==='up'
                        ? '↑'
                        :calculatePriceTrend(cards[index-1].marketPrice,card.marketPrice)==='down'
                          ? '↓'
                          :'='}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyCollection;
