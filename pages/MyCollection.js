// MyCollection.js
import React from 'react';

const MyCollection=({collection}) => {
  return (
    <div>
      <h2>My Collection</h2>
      {collection?.length>0? (
        <ul>
          {collection?.map((item,index) => (
            <li key={index}>
              <p>Name: {item.productName}</p>
              <p>Set: {item.setName}</p>
              <p>Number: {item.number}</p>
              <p>Printing: {item.printing}</p>
              <p>Rarity: {item.rarity}</p>
              <p>Condition: {item.condition}</p>
              <p>Price: {item.marketPrice}</p>
            </li>
          ))}
        </ul>
      ):(
        <p>No items in collection</p>
      )}
    </div>
  );
};

export default MyCollection;
