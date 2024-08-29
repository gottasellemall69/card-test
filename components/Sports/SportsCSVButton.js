
const SportsCSVButton = ({ sportsData }) => {
  // Convert data to CSV format
  const convertToCSV = (data) => {
    const headers = ['Product Name', 'Console URI', 'Price 1', 'Price 2', 'Price 3'];
    const rows = data.map((item) => [
      item.productName,
      item.consoleUri,
      item.price1,
      item.price2,
      item.price3,
    ]);

    // Join headers and rows into CSV format
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    return csvContent;
  };

  // Trigger CSV download
  const downloadCSV = () => {
    const csvData = convertToCSV(sportsData);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sports_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button onClick={downloadCSV}>Export to CSV</button>
  );
};

export default SportsCSVButton;
