"use client";
import { X } from 'lucide-react';
// components/Yugioh/CardFilter.js
import React from 'react';

const CardFilter = ( {
  filters,            // { rarity: [], condition: [] }
  updateFilters,      // (filterType, updatedValues) => void
  isModalOpen,        // boolean
  setIsModalOpen      // (open: boolean) => void
} ) => {
  const handleCheckboxChange = async ( event, filterType ) => {
    const { value, checked } = event.target;
    const prev = filters[ filterType ] || [];
    const updatedValues = checked
      ? [ ...prev, value ]
      : prev.filter( v => v !== value );
    updateFilters( filterType, updatedValues );
  };

  const filtersDef = [
    {
      id: 'rarity',
      label: 'Rarity',
      values: [
        "Common / Short Print", "Rare", "Super Rare", "Ultra Rare",
        "Secret Rare", "Prismatic Secret Rare", "Gold Rare",
        "Premium Gold Rare", "Shatterfoil Rare", "Mosaic Rare",
        "Collector's Rare", "Starfoil Rare", "Ultimate Rare"
      ]
    },
    {
      id: 'condition',
      label: 'Condition',
      values: [
        "Near Mint 1st Edition", "Lightly Played 1st Edition",
        "Moderately Played 1st Edition", "Heavily Played 1st Edition",
        "Damaged 1st Edition", "Near Mint Limited", "Lightly Played Limited",
        "Moderately Played Limited", "Heavily Played Limited", "Damaged Limited",
        "Near Mint Unlimited", "Lightly Played Unlimited",
        "Moderately Played Unlimited", "Heavily Played Unlimited",
        "Damaged Unlimited"
      ]
    },
    {
      id: 'printing',
      label: 'Printing',
      values: [
        "1st Edition",
        "Unlimited",
        "Limited"
      ]
    }
  ];

  return (
    <>
      {/* 📌 trigger button */ }
      <button
        type="button"
        className="px-1.5 py-1.5 my-2 glass font-semibold text-black bg-white hover:bg-black hover:text-white rounded-xs"
        onClick={ () => setIsModalOpen( true ) }
      >
        Open Filters
      </button>

      { isModalOpen && (
        <aside className="absolute flex items-start justify-items-start bg-black bg-opacity-60">
          <div className="z-50 h-full w-96 text-white bg-opacity-60 glass shadow-xl transform transition-transform duration-300 ease-in-out translate-x-0">
            {/* Close */ }
            <div className="flex border-b">
              <button
                type="button"
                className="text-red-600 text-2xl hover:text-red-800 font-black px-4 py-2"
                title={ "Close" }
                onClick={ () => setIsModalOpen( false ) }
              >
                <X size={ 40 } color={ "Red" } />
              </button>
            </div>

            {/* Filters */ }
            <div className="items-start justify-center sticky overflow-y-auto h-72 p-4 space-y-4 text-white text-shadow font-medium z-50">
              { filtersDef.map( filter => (
                <div key={ filter.id }>
                  <div className="block mb-2 font-semibold">{ filter.label }:</div>
                  <div className="space-y-2">
                    { filter.values.map( value => (
                      <div key={ value } className="flex items-start space-x-2">
                        <input
                          type="checkbox"
                          id={ `${ filter.id }-${ value }` }
                          value={ value }
                          checked={ filters[ filter.id ]?.includes( value ) || false }
                          onChange={ e => handleCheckboxChange( e, filter.id ) }
                        />
                        <label htmlFor={ `${ filter.id }-${ value }` }>{ value }</label>
                      </div>
                    ) ) }
                  </div>
                </div>
              ) ) }
            </div>

            {/* Apply */ }
            <div className=" border-t">
              <button
                type="button"
                className="z-50 flex w-full h-full mx-auto justify-center px-4 py-2 bg-blue-600 text-white font-bold hover:bg-blue-900"
                onClick={ () => setIsModalOpen( false ) }
              >
                Apply Filters
              </button>
            </div>
          </div>
        </aside>
      ) }
    </>
  );
};

export default CardFilter;
