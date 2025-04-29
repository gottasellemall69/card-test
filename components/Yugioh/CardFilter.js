// components/Yugioh/CardFilter.js
import React from 'react';

const CardFilter = ( {
  filters,            // { rarity: [], condition: [] }
  updateFilters,      // (filterType, updatedValues) => void
  isModalOpen,        // boolean
  setIsModalOpen      // (open: boolean) => void
} ) => {
  const handleCheckboxChange = ( event, filterType ) => {
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
    }
  ];

  return (
    <>
      {/* 📌 trigger button */ }
      <button
        type="button"
        className="p-2 font-semibold text-black bg-white hover:bg-black hover:text-white rounded"
        onClick={ () => setIsModalOpen( true ) }
      >
        Open Filters
      </button>

      { isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black bg-opacity-50">
          <div className="w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out translate-x-0">
            {/* Close */ }
            <div className="flex border-b">
              <button
                type="button"
                className="text-red-600 hover:text-red-800 font-semibold px-4"
                onClick={ () => setIsModalOpen( false ) }
              >
                X
              </button>
            </div>

            {/* Filters */ }
            <div className="overflow-y-auto h-[calc(100vh-115px)] p-4 space-y-4 text-black">
              { filtersDef.map( filter => (
                <div key={ filter.id }>
                  <div className="block mb-2 font-semibold">{ filter.label }:</div>
                  <div className="space-y-2">
                    { filter.values.map( value => (
                      <div key={ value } className="flex items-center space-x-2">
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
            <div className="p-4 border-t">
              <button
                type="button"
                className="w-full p-2 bg-blue-500 text-white hover:bg-blue-600 rounded"
                onClick={ () => setIsModalOpen( false ) }
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      ) }
    </>
  );
};

export default CardFilter;
