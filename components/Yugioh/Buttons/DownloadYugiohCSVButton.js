const DownloadYugiohCSVButton = ({ aggregatedData, userCardList }) => {
  const downloadCSV = () => {
    try {
      const csvHeader = '"Name"|"Set"|"Number"|"Printing"|"Rarity"|"Condition"|"Price"|"Quantity"';
      const csvData = aggregatedData?.map((card) => {
        const productName = card?.productName || '';
        const userCard = userCardList?.filter((entry) =>
          entry.toLowerCase().includes(productName.toLowerCase())
        );

        const relevantCard = userCard.filter((userEntry) =>
          userEntry.toLowerCase().includes(card.productName?.toLowerCase()) &&
          userEntry.toLowerCase().includes(card.number?.toLowerCase()) &&
          userEntry.toLowerCase().includes(card.printing?.toLowerCase()) &&
          userEntry.toLowerCase().includes(card.condition?.toLowerCase())
        );

        return [
          `"${ card.productName.replace(/"/g, '""') }"`,
          `"${ card?.setName.replace(/"/g, '""') || '' }"`,
          `"${ card?.number.replace(/"/g, '""') || '' }"`,
          `"${ card?.printing.replace(/"/g, '""') || '' }"`,
          `"${ card?.rarity.replace(/"/g, '""') || '' }"`,
          `"${ card?.condition.replace(/"/g, '""') || '' }"`,
          `"${ card?.marketPrice ? card.marketPrice.toString().replace(/"/g, '""') : '' }"`,
          `"${ card?.quantity ? card.quantity.toString().replace(/"/g, '""') : '' }"`
        ].join('|');  // Updated delimiter
      }).join("\n");

      const csvContent = `${ csvHeader }\n${ csvData }`;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const element = document.createElement('a');
      element.href = url;
      element.download = 'yugioh_card_collection.csv';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      URL.revokeObjectURL(url); // Clean up the URL object
    } catch (error) {
      console.error('Error generating CSV:', error);
    }
  };

  return (
    <button
      name="DownloadYugiohCSVButton"
      className="relative bg-white text-black font-bold m-1 px-2 py-2 text-nowrap rounded-lg border border-zinc-400 hover:bg-black hover:text-white"
      onClick={downloadCSV}
    >
      Download CSV
    </button>
  );
};

export default DownloadYugiohCSVButton;
