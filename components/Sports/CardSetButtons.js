// @/components/Sports/CardSetButtons.js
'use client';
import React from 'react';

function CardSetButtons({cardSets,onSelectCardSet}) {
  return (
    <select className="rounded px-2 py-2 m-2" onChange={(e) => onSelectCardSet(e.target.value)}>
      {cardSets?.map((cardSet) => (
        <option key={cardSet} value={cardSet}>
          {cardSet}
        </option>
      ))}
    </select>
  );
}

export default CardSetButtons;