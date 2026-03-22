import React from 'react';
import {CARD_SETS} from '@/constants/cardSets';

interface CardSetSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const CardSetSelector: React.FC<CardSetSelectorProps> = ({ value, onChange }) => {
  return (
    <select 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Select a sports card set"
      className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-base font-medium text-white shadow-sm transition hover:border-white/30 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
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
