'use client';
import Notification from '@/components/Notification';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useCallback, useMemo, useState } from 'react';

const LoadingSpinner = dynamic(() => import('@/components/LoadingSpinner'));
const YugiohPagination = dynamic(() => import('@/components/Navigation/YugiohPagination'));

const YugiohCardListInput = ({ cardList, setCardList, handleSubmit, isLoading, error, matchedCardData, setMatchedCardData }) => {
  const router = useRouter();
  const [notification, setNotification] = useState({ show: false, message: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'ascending' });
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectAllChecked, setSelectAllChecked] = useState(false);

  const handlePageClick = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleSort = useCallback((key) => {
    setSortConfig(prevConfig => {
      const direction = prevConfig.key === key && prevConfig.direction === 'ascending' ? 'descending' : 'ascending';
      return { key, direction };
    });

    setMatchedCardData(prevData => {
      const sorted = [...prevData].sort((a, b) => {
        const aValue = sortConfig.key === 'marketPrice' ? (a.data?.marketPrice || 0) : a.card[sortConfig.key];
        const bValue = sortConfig.key === 'marketPrice' ? (b.data?.marketPrice || 0) : b.card[sortConfig.key];
        return (aValue < bValue ? -1 : 1) * (sortConfig.direction === 'ascending' ? 1 : -1);
      });
      return sorted;
    });
  }, [setMatchedCardData]);

  const sortedAndPaginatedData = useMemo(() => {
    if (!Array.isArray(matchedCardData)) return { currentItems: [], totalCount: 0 };

    const sortedData = [...matchedCardData].sort((a, b) => {
      const aValue = sortConfig.key === 'marketPrice' ? (a.data?.marketPrice || 0) : a.card[sortConfig.key];
      const bValue = sortConfig.key === 'marketPrice' ? (b.data?.marketPrice || 0) : b.card[sortConfig.key];
      return (aValue < bValue ? -1 : 1) * (sortConfig.direction === 'ascending' ? 1 : -1);
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
    return { currentItems, totalCount: sortedData.length };
  }, [matchedCardData, currentPage, sortConfig]);

  const toggleCheckbox = useCallback((index) => {
    setSelectedRows(prevSelectedRows => {
      const newSelectedRows = new Set(prevSelectedRows);
      const paginatedIndex = (currentPage - 1) * itemsPerPage + index;
      if (newSelectedRows.has(paginatedIndex)) {
        newSelectedRows.delete(paginatedIndex);
      } else {
        newSelectedRows.add(paginatedIndex);
      }
      return newSelectedRows;
    });
  }, [currentPage, itemsPerPage]);

  const toggleSelectAll = useCallback(() => {
    setSelectAllChecked(prevSelectAllChecked => {
      if (!prevSelectAllChecked) {
        const allRowsIndexes = Array.from({ length: matchedCardData?.length }, (_, index) => index);
        setSelectedRows(new Set(allRowsIndexes));
      } else {
        setSelectedRows(new Set());
      }
      return !prevSelectAllChecked;
    });
  }, [matchedCardData]);

  const addToCollection = useCallback(async () => {
    if (selectedRows.size === 0) {
      setNotification({ show: true, message: 'No cards were selected to add to the collection!' });
      return;
    }

    const selectedData = Array.from(selectedRows).map(index => matchedCardData[index]);
    const collectionArray = selectedData.map(({ card, data }) => ({
      productName: card?.productName,
      setName: card?.setName,
      number: card?.number,
      printing: card?.printing,
      rarity: card?.rarity,
      condition: card?.condition,
      marketPrice: data?.marketPrice,
      quantity: 1,
    }));

    try {
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: collectionArray }),
      });

      if (!response.ok) {
        throw new Error('Failed to add cards to collection');
      }

      const result = await response.json();
      setNotification({ show: true, message: 'Cards added to the collection successfully!' });
      console.log('Success:', result);
    } catch (error) {
      setNotification({ show: true, message: 'Card(s) failed to save!' });
      console.error('Error:', error);
    }
  }, [selectedRows, matchedCardData]);

  const handleGoToCollectionPage = useCallback(() => {
    router.push('/MyCollectionPage');
  }, [router]);

  const convertToCSV = useCallback((data) => {
    const headers = ['Name', 'Set', 'Number', 'Printing', 'Rarity', 'Condition', 'Market Price'];
    const rows = data.map(({ card, data }) => [
      card?.productName,
      card?.setName,
      card?.number,
      card?.printing,
      card?.rarity,
      card?.condition,
      data?.marketPrice,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    return encodeURI(csvContent);
  }, []);

  const downloadCSV = useCallback(() => {
    if (!matchedCardData?.length) {
      setNotification({ show: true, message: 'No data available to download!' });
      return;
    }

    const csvContent = convertToCSV(matchedCardData);
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', 'yugioh_cards.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [matchedCardData, convertToCSV]);

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
        {sortedAndPaginatedData.currentItems.length > 0 && (

          <div className="container max-h-[700px] overflow-y-auto lg:w-10/12">
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
            <table className="divide-y divide-gray-200 p-5">

              <thead className="p-1 bg-transparent">
                <tr>
                  <th className="sticky px-1 top-0 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter">
                    <input type="checkbox" checked={selectAllChecked} onChange={toggleSelectAll} />
                  </th>
                  {['productName', 'setName', 'number', 'rarity', 'condition', 'marketPrice'].map((key) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      className="sticky top-0 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter cursor-pointer"
                    >
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                      {sortConfig.key === key && (sortConfig.direction === 'ascending' ? <ChevronUpIcon className="inline w-4 h-4" /> : <ChevronDownIcon className="inline w-4 h-4" />)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedAndPaginatedData.currentItems.map(({ card, data }, index) => (
                  <tr key={index}>
                    <td className="text-white">
                      <input type="checkbox" checked={selectedRows.has(index)} onChange={() => toggleCheckbox(index)} />
                    </td>
                    <td className="text-white p-1 text-center whitespace-pre-wrap break-words text-xs">{card?.productName}</td>
                    <td className="text-white p-1 text-center whitespace-pre-wrap break-words text-xs">{card?.setName}</td>
                    <td className="text-white p-1 text-center whitespace-pre-wrap break-words text-xs">{card?.number}</td>
                    <td className="text-white p-1 text-center whitespace-pre-wrap break-words text-xs">{card?.rarity}</td>
                    <td className="text-white p-1 text-center whitespace-pre-wrap break-words text-xs">{card?.condition}</td>
                    <td className="text-white p-1 text-center whitespace-pre-wrap break-words text-xs">{data?.marketPrice ? `$${ data.marketPrice.toFixed(2) }` : 'N/A'}</td>
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
      <Notification show={notification.show} setShow={(show) => setNotification({ ...notification, show })} message={notification.message} />
    </div>
  );
};

export default YugiohCardListInput;
