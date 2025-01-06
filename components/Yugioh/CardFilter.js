// components\Yugioh\CardFilter.js
import { useState } from 'react';

const CardFilter = ({ updateFilters }) => {
  const [selectedFilters, setSelectedFilters] = useState({
    rarity: [],
    condition: []
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCheckboxChange = (event, filterType) => {
    const { value, checked } = event.target;
    let updatedValues;

    if (checked) {
      updatedValues = [...selectedFilters[filterType], value];
    } else {
      updatedValues = selectedFilters[filterType].filter((v) => v !== value);
    }

    setSelectedFilters((prevState) => ({
      ...prevState,
      [filterType]: updatedValues
    }));

    if (typeof updateFilters === 'function') {
      updateFilters(filterType, updatedValues);
    }
  };

  const renderFilters = () => {
    const filters = [
      {
        id: 'rarity-filter',
        label: 'Rarity',
        values: [
          "Common / Short Print", "Rare", "Super Rare", "Ultra Rare", "Secret Rare", "Prismatic Secret Rare", "Gold Rare", "Premium Gold Rare", "Shatterfoil Rare", "Mosaic Rare", "Starfoil Rare", "Ultimate Rare"
        ],
      },
      {
        id: 'condition-filter',
        label: "Condition",
        values: [
          "Near Mint 1st Edition", "Lightly Played 1st Edition", "Moderately Played 1st Edition", "Heavily Played 1st Edition", "Damaged 1st Edition",
          "Near Mint Limited", "Lightly Played Limited", "Moderately Played Limited", "Heavily Played Limited", "Damaged Limited",
          "Near Mint Unlimited", "Lightly Played Unlimited", "Moderately Played Unlimited", "Heavily Played Unlimited", "Damaged Unlimited"
        ],
      }
    ];

    return (
      <div id="filters-container" className="p-4 space-y-4 text-black">
        {filters.map((filter) => (
          <div key={filter.id} className="text-base font-semibold">
            <label className="block mb-2">{filter.label}:</label>
            <div className="space-y-2">
              {filter.values.map((value) => (
                <div key={value} className="flex items-center space-x-2">
                  <input
                    id={`${ filter.id }-${ value.toLowerCase().replace(/\s/g, '-') }`}
                    type="checkbox" // Change to 'radio' for single selection
                    value={value}
                    checked={selectedFilters[filter.id.split('-')[0]].includes(value)}
                    onChange={(e) => handleCheckboxChange(e, filter.id.split('-')[0])}
                  />
                  <label htmlFor={`${ filter.id }-${ value.toLowerCase().replace(/\s/g, '-') }`}>
                    {value}
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Button to trigger the modal */}
      <button
        className="p-2 text-white bg-blue-500 hover:bg-blue-600 rounded"
        onClick={() => setIsModalOpen(true)}
      >
        Open Filters
      </button>

      {/* Slide-over modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black bg-opacity-50">
          {/* Slide-over panel */}
          <div className="w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out translate-x-0">
            {/* Close button */}
            <div className="align-middle justify-start flex p-4 border-b">
              <h2 className="text-lg font-bold">Filters</h2>
              <button
                className="text-red-600 hover:text-red-800"
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </button>
            </div>

            {/* Filters content */}
            <div className="overflow-y-auto h-[calc(100vh-115px)]">
              {renderFilters()}
            </div>

            {/* Apply Filters Button */}
            <div className="p-4 border-t">
              <button
                className="w-full p-2 bg-blue-500 text-white hover:bg-blue-600 rounded"
                onClick={() => setIsModalOpen(false)} // Close modal on applying filters
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CardFilter;
