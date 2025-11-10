'use client';

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
].join( CSV_DELIMITER );

const escapeCsvValue = ( value ) => {
  if ( value === null || value === undefined ) {
    return '""';
  }

  const stringValue = String( value );
  return `"${ stringValue.replace( /"/g, '""' ) }"`;
};

const buildCsvRow = ( card = {} ) => {
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
    escapeCsvValue( productName ),
    escapeCsvValue( setName ),
    escapeCsvValue( number ),
    escapeCsvValue( printing ),
    escapeCsvValue( rarity ),
    escapeCsvValue( condition ),
    escapeCsvValue( marketPrice ),
    escapeCsvValue( lowPrice ),
    escapeCsvValue( quantity ),
  ].join( CSV_DELIMITER );
};

const DownloadYugiohCSVButton = ( {
  aggregatedData = [],
  fileName = 'yugioh_card_collection.csv',
  className = '',
} ) => {
  const hasCards = Array.isArray( aggregatedData ) && aggregatedData.length > 0;

  const downloadCSV = () => {
    if ( !hasCards ) {
      return;
    }

    let url;

    try {
      const csvBody = aggregatedData.map( buildCsvRow ).join( '\n' );
      const csvContent = `\uFEFF${ CSV_HEADER }\n${ csvBody }`;
      const blob = new Blob( [ csvContent ], { type: 'text/csv;charset=utf-8;' } );
      url = URL.createObjectURL( blob );

      const element = document.createElement( 'a' );
      element.href = url;
      element.download = fileName;
      document.body.appendChild( element );
      element.click();
      document.body.removeChild( element );
    } catch ( error ) {
      console.error( 'Error generating CSV:', error );
    } finally {
      if ( url ) {
        URL.revokeObjectURL( url );
      }
    }
  };

  return (
    <button
      name="DownloadYugiohCSVButton"
      type="button"
      className={ `relative m-1 rounded-lg border border-zinc-400 px-4 py-2 font-semibold text-black transition hover:bg-black hover:text-white ${ className }` }
      onClick={ downloadCSV }
      disabled={ !hasCards }
    >
      Download CSV
    </button>
  );
};

export default DownloadYugiohCSVButton;
