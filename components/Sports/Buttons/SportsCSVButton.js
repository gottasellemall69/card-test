import { flattenSportsProducts } from '@/utils/sportsData';
import { downloadCsv, escapeCsvValue } from '@/lib/client/csv';
export default function SportsCSVButton({ sportsData }) {
  const download = () => {
    const rows = flattenSportsProducts(sportsData).map((card) =>
      [card.productName, card.consoleUri, card.price1, card.price3, card.price2]
        .map(escapeCsvValue)
        .join(','),
    );
    downloadCsv(`\uFEFFName,Set,Ungraded,PSA 9,PSA 10\n${rows.join('\n')}`, 'sports_data.csv');
  };
  return sportsData?.length > 0 ? (
    <button
      type="button"
      name="SportsCSVButton"
      className="bg-white border border-zinc-500 font-bold px-2 py-2 m-2 mx-auto rounded cursor-pointer text-black hover:bg-black hover:text-white"
      onClick={download}
    >
      Download CSV
    </button>
  ) : null;
}
