'use client';
// @/components/YugiohCardListInput.js
import Notification from '@/components/Notification';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
const LoadingSpinner = dynamic(() => import('@/components/LoadingSpinner'));
const YugiohPagination = dynamic(() => import('@/components/Navigation/YugiohPagination'));

const YugiohCardListInput = ({ cardList, setCardList, handleSubmit, isLoading, error, matchedCardData, setMatchedCardData }) => {
  const router = useRouter();
  const [notification, setNotification] = useState({
    show: false,
    message: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30; // Adjust as needed
  const [sortConfig, setSortConfig] = useState({ key: [], direction: 'ascending' });
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectAllChecked, setSelectAllChecked] = useState(false);

  // Pagination handlers
  const handlePageClick = (page) => {
    setCurrentPage(page);
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }

    setSortConfig({ key, direction });

    setMatchedCardData((prevData) => {
      const sorted = [...prevData].sort((a, b) => {
        const aValue = key === 'marketPrice' ? (a.data.marketPrice || 0) : a.card[key];
        const bValue = key === 'marketPrice' ? (b.data.marketPrice || 0) : b.card[key];
        if (aValue < bValue) {
          return direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
      return sorted;
    });
  };

  // Memoize sorted and paginated data
  const sortedAndPaginatedData = useMemo(() => {
    if (!Array.isArray(matchedCardData)) {
      return (
        { currentItems: [], totalCount: 0 }
      );
    }

    const sortedData = [...matchedCardData].sort((a, b) => {
      const aValue = sortConfig.key === 'marketPrice' ? (a.data?.marketPrice || 0) : a.card[sortConfig.key];
      const bValue = sortConfig.key === 'marketPrice' ? (b.data?.marketPrice || 0) : b.card[sortConfig.key];
      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

    // Pagination calculation
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
    return { currentItems, totalCount: sortedData.length };
  }, [matchedCardData, currentPage, sortConfig.key, sortConfig.direction]);

  // Function to handle checkbox toggle
  const toggleCheckbox = (index) => {
    const paginatedIndex = (currentPage - 1) * itemsPerPage + index;
    const newSelectedRows = new Set(selectedRows);
    if (newSelectedRows.has(paginatedIndex)) {
      newSelectedRows.delete(paginatedIndex);
    } else {
      newSelectedRows.add(paginatedIndex);
    }
    setSelectedRows(newSelectedRows);
  };

  const toggleSelectAll = () => {
    if (!selectAllChecked) {
      const allRowsIndexes = Array.from({ length: matchedCardData?.length }, (_, index) => index);
      setSelectedRows(new Set(allRowsIndexes));
    } else {
      setSelectedRows(new Set());
    }
    setSelectAllChecked(!selectAllChecked);
  };

  // Function to handle adding selected rows to collection
  const addToCollection = async () => {
    try {
      // Ensure selectedRows contains valid indices
      if (selectedRows.size === 0) {
        setNotification({ show: true, message: 'No cards were selected to add to the collection!' });
        console.log('No cards selected to add to collection');
        return;
      }

      const selectedData = Array.from(selectedRows).map((index) => matchedCardData[index]);

      const collectionArray = selectedData.map(({ card, data }, index) => ({
        productName: card?.productName,
        setName: card?.setName,
        number: card?.number,
        printing: card?.printing,
        rarity: card?.rarity,
        condition: card?.condition,
        marketPrice: data?.marketPrice,
        'quantity': parseInt("1")
      }));

      // Send a POST request to the server to save the cards
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cards: collectionArray }), // Ensure cards data is included in the request body
      });

      // Check if the response is ok
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      // Parse the response data
      const result = await response.json();
      setNotification({ show: true, message: 'Card(s) added to the collection!' });
      console.log('Success:', result);
    } catch (error) {
      setNotification({ show: true, message: 'Card(s) failed to save!' });
      console.error('Failed to save the cards:', error);
    }
  };

  const handleGoToCollectionPage = () => {
    router.push('/MyCollectionPage');
  };

  // Function to convert data to CSV
  const convertToCSV = (data) => {
    const headers = ["Name", "Set", "Number", "Printing", "Rarity", "Condition", "Market Price"];
    const rows = data.map(({ card, data }) => [
      card?.productName,
      card?.setName,
      card?.number,
      card?.printing,
      card?.rarity,
      card?.condition,
      data?.marketPrice
    ]);

    let csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    return encodeURI(csvContent);
  };

  // Function to download CSV
  const downloadCSV = () => {
    if (!matchedCardData || matchedCardData.length === 0) {
      setNotification({ show: true, message: 'No data available to download!' });
      return;
    }

    const csvContent = convertToCSV(matchedCardData);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "yugioh_cards.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <textarea
          className="w-full sm:mx-auto rounded-sm text-black flex flex-wrap text-nowrap h-72 resize-none justify-items-center p-2"
          value={cardList}
          onChange={(e) => setCardList(e.target.value)}
          placeholder="Enter your list of cards..."
        />
        <button
          className="border border-white rounded-lg px-2 py-2 mx-auto m-2 text-white font-bold hover:text-black hover:bg-white"
          type="submit"
        >
          Submit
        </button>
      </form>
      <>
        {isLoading && <LoadingSpinner />}
        {error && <p>{error}</p>}
        <Notification show={Notification.show} setShow={(show) => Notification({ ...Notification, show })} message={Notification.message} />

        {sortedAndPaginatedData.currentItems.length > 0 && (

          <div className="box-content max-h-[700px] overflow-y-auto lg:w-full lg:mx-auto overflow-x-hidden">
            <button
              className="border border-white rounded-lg px-2 py-2 mx-auto m-1 text-white text-sm font-bold hover:text-black hover:bg-white"
              onClick={downloadCSV}
            >
              Download CSV
            </button>
            <button
              className="float-start border border-white rounded-lg px-2 py-2 mx-auto m-1 text-sm text-white font-bold hover:text-black hover:bg-white"
              onClick={addToCollection}
            >
              Add cards to collection
            </button>
            <button
              className="float-end border border-white rounded-lg px-2 py-2 mx-auto text-sm m-1 text-white font-bold hover:text-black hover:bg-white"
              onClick={handleGoToCollectionPage}
            >
              View Collection
            </button>
            <table className="divide-y divide-gray-200 w-full">

              <thead className="p-1 bg-transparent">
                <tr>
                  <th className="sticky px-1 top-0 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter">

                    <input
                      type="checkbox"
                      checked={selectAllChecked}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th
                    onClick={() => handleSort('productName')}
                    className="sticky top-0 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter cursor-pointer">
                    Name
                    {sortConfig.key === 'productName' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'ascending' ? <ChevronUpIcon className="h-3 w-2 text-white font-black inline" /> : <ChevronDownIcon className="h-3 w-2 text-white font-black inline" />}
                      </span>
                    )}
                  </th>
                  <th
                    onClick={() => handleSort('setName')}
                    className="sticky top-0  border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter cursor-pointer">
                    Set
                    {sortConfig.key === 'setName' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'ascending' ? <ChevronUpIcon className="h-3 w-2 text-white font-black inline" /> : <ChevronDownIcon className="h-3 w-2 text-white font-black inline" />}
                      </span>
                    )}
                  </th>
                  <th
                    onClick={() => handleSort('number')}
                    className="sticky top-0  border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter cursor-pointer">
                    Number
                    {sortConfig.key === 'number' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'ascending' ? <ChevronUpIcon className="h-3 w-2 text-white font-black inline" /> : <ChevronDownIcon className="h-3 w-2 text-white font-black inline" />}
                      </span>
                    )}
                  </th>

                  <th
                    onClick={() => handleSort('rarity')}
                    className="sticky top-0  border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter cursor-pointer">
                    Rarity
                    {sortConfig.key === 'rarity' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'ascending' ? <ChevronUpIcon className="h-3 w-2 text-white font-black inline" /> : <ChevronDownIcon className="h-3 w-2 text-white font-black inline" />}
                      </span>
                    )}
                  </th>
                  <th
                    onClick={() => handleSort('condition')}
                    className="sticky top-0  border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter cursor-pointer">
                    Condition
                    {sortConfig.key === 'condition' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'ascending' ? <ChevronUpIcon className="h-3 w-2 text-white font-black inline" /> : <ChevronDownIcon className="h-3 w-2 text-white font-black inline" />}
                      </span>
                    )}
                  </th>
                  <th
                    onClick={() => handleSort('marketPrice')}
                    className="sticky top-0  border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter cursor-pointer">
                    Price
                    {sortConfig.key === 'marketPrice' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'ascending' ? <ChevronUpIcon className="h-3 w-2 text-white font-black inline" /> : <ChevronDownIcon className="h-3 w-2 text-white font-black inline" />}
                      </span>
                    )}
                  </th>

                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-black px-1 py-1 mx-auto">
                {sortedAndPaginatedData.currentItems.map(({ card, data, error }, index) => (
                  <tr key={index}>
                    <td className="border border-black text-center">
                      <input
                        type="checkbox"
                        checked={selectedRows.has((currentPage - 1) * itemsPerPage + index)}
                        onChange={() => toggleCheckbox(index)}
                      />
                    </td>
                    <td className="border border-gray-800 my-1 break-words mx-1 p-1 text-xs font-medium text-black hover:bg-black hover:text-white">{card?.productName}</td>
                    <td className="border border-gray-800 my-1 break-words mx-1 p-1 text-xs font-medium text-black hover:bg-black hover:text-white">{card?.setName}</td>
                    <td className="border border-gray-800 my-1 break-words mx-1 p-1 text-xs font-medium text-black hover:bg-black hover:text-white">{card?.number}</td>
                    <td className="border border-gray-800 my-1 break-words mx-1 p-1 text-xs font-medium text-black hover:bg-black hover:text-white">{card?.rarity}</td>
                    <td className="border border-gray-800 my-1 break-words mx-1 p-1 text-xs font-medium text-black hover:bg-black hover:text-white">{card?.condition}</td>
                    <td className="border border-gray-800 my-1 break-words mx-1 p-1 text-xs font-medium text-black hover:bg-black hover:text-white">{data?.marketPrice !== undefined ? `${ data?.marketPrice }` : error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <YugiohPagination
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              totalItems={sortedAndPaginatedData.totalCount}
              handlePageClick={handlePageClick}
            />
          </div>
        )}
      </>
    </div>
  );
};

export default YugiohCardListInput;
