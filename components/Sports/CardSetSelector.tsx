import React from 'react';
import {CARD_SETS} from 'D:/CSVParse/venv/env/card-test/constants/cardSets';

interface CardSetSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const CardSetSelector: React.FC<CardSetSelectorProps> = ({ value, onChange }) => {
  return (
    <select 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full md:w-auto px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
    >
      {CARD_SETS.map((set) => (
        <option key={set} value={set}>
          {set}
        </option>
      ))}
    </select>
  );
};

export default CardSetSelector;