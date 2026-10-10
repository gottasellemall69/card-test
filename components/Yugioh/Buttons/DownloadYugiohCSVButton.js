import { escapeCsvValue, downloadCsv } from '@/lib/client/csv';
const CSV_DELIMITER = '|';
const CSV_HEADER = [
  '"Name"',
  '"Set"',
  '"Number"',
  '"Printing"',
  '"Rarity"',
  '"Condition"',
  '"Price"',
  '"Low Price"',
  '"Quantity"',
].join(CSV_DELIMITER);

const buildCsvRow = (card = {}) => {
  const {
    productName = '',
    setName = '',
    number = '',
    printing = '',
    rarity = '',
    condition = '',
    marketPrice = '',
    lowPrice = '',
    quantity = '',
  } = card ?? {};

  return [
    escapeCsvValue(productName),
    escapeCsvValue(setName),
    escapeCsvValue(number),
    escapeCsvValue(printing),
    escapeCsvValue(rarity),
    escapeCsvValue(condition),
    escapeCsvValue(marketPrice),
    escapeCsvValue(lowPrice),
    escapeCsvValue(quantity),
  ].join(CSV_DELIMITER);
};

const DownloadYugiohCSVButton = ({
  aggregatedData = [],
  fileName = 'yugioh_card_collection.csv',
  className = '',
}) => {
  const hasCards = Array.isArray(aggregatedData) && aggregatedData.length > 0;

  const downloadCSV = () => {
    if (!hasCards) {
      return;
    }

    const csvBody = aggregatedData.map(buildCsvRow).join('\n');
    downloadCsv(`\uFEFF${CSV_HEADER}\n${csvBody}`, fileName);
  };

  return (
    <button
      name="DownloadYugiohCSVButton"
      type="button"
      className={`relative m-1 rounded-lg border border-zinc-400 px-4 py-2 font-semibold text-black transition hover:bg-black hover:text-white ${className}`}
      onClick={downloadCSV}
      disabled={!hasCards}
    >
      Download CSV
    </button>
  );
};

export default DownloadYugiohCSVButton;
