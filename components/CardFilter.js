
const CardFilter = ({ updateFilters }) => {
  const createCheckbox = (id, label, value) => {
    const handleChange = () => {
      const checked = event.target.checked;
      const filterType = id.split('-')[0];

      const values = Array.from(document.querySelectorAll(`input[id^="${ filterType }"]:checked`)).map((checkbox) => checkbox.value);

      console.log('Applying filters:', filterType, values);

      if (typeof updateFilters === 'function') {
        updateFilters(filterType, values);
        console.log('Filters applied.');
      }
    };

    return (
      <div key={id} className="mr-4 gap-3 space-3">
        <input
          id={id}
          type="checkbox"
          value={value}
          onChange={handleChange}
          className="mr-1"
        />
        <label htmlFor={id}>{label}</label>
      </div>
    );
  };

  const renderFilters = () => {
    const filters = [
      {
        id: 'rarity-filter',
        label: 'Rarity',
        values: [
          "Common / Short Print", "Rare", "Super Rare", "Ultra Rare", "Secret Rare", "Prismatic Secret Rare", "Premium Gold Rare"
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
      <div id="filters-container">
        {filters.map((filter) => (
          <div key={filter.id} className="inline-block items-center text-base p-3 font-semibold mx-auto">
            {filter.label + ': '}
            {filter.values.map((values) => (
              createCheckbox(
                `${ filter.id }-${ values.toLowerCase().replace(/\s/g, '-') }`,
                values,
                values
              )
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {renderFilters()}
    </>
  );
};

export default CardFilter;
