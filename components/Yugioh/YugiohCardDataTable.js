// components\Yugioh\YugiohCardDataTable.js
import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import dynamic from 'next/dynamic';
import Notification from '@/components/Notification.js';
const YugiohPagination = dynamic(() => import('@/components/Yugioh/YugiohPagination.js'), { ssr: false });

const YugiohCardDataTable = ({ matchedCardData, setMatchedCardData }) => {
    const router = useRouter();
    const itemsPerPage = 30; // Adjust as needed
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: [], direction: 'ascending' });
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [selectAllChecked, setSelectAllChecked] = useState(false);
    const [notification, setNotification] = useState({
        show: false,
        message: ''
      });

    // Handlers for pagination, sorting, and selections...
    const handlePageClick = useCallback((page) => {
        setCurrentPage(page);
    }, []);

    const handleSort = useCallback((key) => {
        setSortConfig((prevConfig) => {
            let direction = 'ascending';
            if (prevConfig.key === key && prevConfig.direction === 'ascending') {
                direction = 'descending';
            }

            setMatchedCardData((prevData) => {
                const sorted = [...prevData].sort((a, b) => {
                    const aValue = key === 'marketPrice' ? (a.data?.marketPrice || 0) : a.card[key];
                    const bValue = key === 'marketPrice' ? (b.data?.marketPrice || 0) : b.card[key];
                    return aValue < bValue ? (direction === 'ascending' ? -1 : 1) : aValue > bValue ? (direction === 'ascending' ? 1 : -1) : 0;
                });
                return sorted;
            });

            return { key, direction };
        });
    }, [setMatchedCardData]);

    // Memoize sorted and paginated data
    const sortedAndPaginatedData = useMemo(() => {
        if (!Array.isArray(matchedCardData)) {
            return { currentItems: [], totalCount: 0 };
        }

        const sortedData = [...matchedCardData].sort((a, b) => {
            const aValue = sortConfig.key === 'marketPrice' ? (a.data?.marketPrice || 0) : a.card[sortConfig.key];
            const bValue = sortConfig.key === 'marketPrice' ? (b.data?.marketPrice || 0) : b.card[sortConfig.key];
            return aValue < bValue ? (sortConfig.direction === 'ascending' ? -1 : 1) : aValue > bValue ? (sortConfig.direction === 'ascending' ? 1 : -1) : 0;
        });

        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
        return { currentItems, totalCount: sortedData.length };
    }, [matchedCardData, currentPage, sortConfig]);

    // Function to handle checkbox toggle
    const toggleCheckbox = useCallback((index) => {
        const paginatedIndex = (currentPage - 1) * itemsPerPage + index;
        setSelectedRows((prevSelected) => {
            const newSelectedRows = new Set(prevSelected);
            if (newSelectedRows.has(paginatedIndex)) {
                newSelectedRows.delete(paginatedIndex);
            } else {
                newSelectedRows.add(paginatedIndex);
            }
            return newSelectedRows;
        });
    }, [currentPage, itemsPerPage]);

    const toggleSelectAll = useCallback(() => {
        if (!selectAllChecked) {
            const allRowsIndexes = Array.from({ length: matchedCardData?.length }, (_, index) => index);
            setSelectedRows(new Set(allRowsIndexes));
        } else {
            setSelectedRows(new Set());
        }
        setSelectAllChecked(!selectAllChecked);
    }, [selectAllChecked, matchedCardData]);

    // Function to handle adding selected rows to collection
    const addToCollection = useCallback(async () => {
        try {
            if (selectedRows.size === 0) {
                setNotification({ show: true, message: 'No cards were selected to add to the collection!' });
                return;
            }

    const token = localStorage.getItem("token");
        if (!token) {
            setNotification({ show: true, message: "You must be logged in to add cards." });
            return;
            }

            const selectedData = Array.from(selectedRows).map((index) => matchedCardData[index]);

            const collectionArray = selectedData.map(({ card, data }) => ({
                productName: card?.productName,
                setName: card?.setName,
                number: card?.number,
                printing: card?.printing,
                rarity: card?.rarity,
                condition: card?.condition,
                marketPrice: data?.marketPrice,
                'quantity': 1
            }));

            const response = await fetch('/api/Yugioh/cards', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                body: JSON.stringify({ cards: collectionArray }),
            });

            if (!response.ok) {
                throw new Error("Failed to add cards to the collection.");
            }

            setNotification({ show: true, message: 'Card(s) added to the collection!' });
        } catch (error) {
            setNotification({ show: true, message: 'Card(s) failed to save!' });
            console.error('Failed to save the cards:', error);
        }
    }, [selectedRows, matchedCardData]);

    const handleGoToCollectionPage = useCallback(() => {
        router.push('/yugioh/my-collection');
    }, [router]);

    const convertToCSV = useCallback((data) => {
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

        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        return encodeURI(csvContent);
    }, []);

    const downloadCSV = useCallback(() => {
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
    }, [matchedCardData, convertToCSV]);

    return (
        <div className="mx-auto w-full mb-10">
      <Notification show={notification.show} setShow={(show) => setNotification({ ...notification, show })} message={notification.message} />

            {sortedAndPaginatedData.currentItems.length > 0 && (
                <>

                <div className="w-full -mt-5">
                <div className="w-fit mx-auto">
                    <YugiohPagination
                        currentPage={currentPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={sortedAndPaginatedData.totalCount}
                        handlePageClick={handlePageClick}
                    />
              </div>
                        <table className="text-white items-center w-full border-collapse">
                            <thead className="p-1 bg-transparent">
                                <tr>
                                    <th className="sticky px-1 top-0 border-x-2 border-y-2 border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter">
                                        <input
                                            type="checkbox"
                                            checked={selectAllChecked}
                                            onChange={toggleSelectAll} />
                                    </th>
                                    <th
                                        onClick={() => handleSort('productName')}
                                        className="sticky cursor-pointer top-0 z-10 p-2 border-x-2 border-y-2 border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-sm lg:text-base font-black text-white whitespace-pre backdrop-blur backdrop-filter">
                                        Name
                                        {sortConfig.key === 'productName' && (
                                            <span className="ml-1">
                                                {sortConfig.direction === 'ascending' ? <ChevronUpIcon className="h-2 w-2 text-white font-black inline" /> : <ChevronDownIcon className="h-2 w-2 text-white font-black inline" />}
                                            </span>
                                        )}
                                    </th>
                                    <th
                                        onClick={() => handleSort('setName')}
                                        className="sticky cursor-pointer top-0 z-10 p-2 border-x-2 border-y-2 border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-sm lg:text-base font-black text-white whitespace-pre backdrop-blur backdrop-filter">
                                        Set
                                        {sortConfig.key === 'setName' && (
                                            <span className="ml-1">
                                                {sortConfig.direction === 'ascending' ? <ChevronUpIcon className="h-2 w-2 text-white font-black inline" /> : <ChevronDownIcon className="h-2 w-2 text-white font-black inline" />}
                                            </span>
                                        )}
                                    </th>
                                    <th
                                        onClick={() => handleSort('number')}
                                        className="sticky cursor-pointer top-0 z-10 p-2 border-x-2 border-y-2 border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-sm lg:text-base font-black text-white whitespace-pre backdrop-blur backdrop-filter">
                                        Number
                                        {sortConfig.key === 'number' && (
                                            <span className="ml-1">
                                                {sortConfig.direction === 'ascending' ? <ChevronUpIcon className="h-2 w-2 text-white font-black inline" /> : <ChevronDownIcon className="h-2 w-2 text-white font-black inline" />}
                                            </span>
                                        )}
                                    </th>
                                    <th
                                        onClick={() => handleSort('rarity')}
                                        className="sticky cursor-pointer top-0 z-10 p-2 border-x-2 border-y-2 border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-sm lg:text-base font-black text-white whitespace-pre backdrop-blur backdrop-filter">
                                        Rarity
                                        {sortConfig.key === 'rarity' && (
                                            <span className="ml-1">
                                                {sortConfig.direction === 'ascending' ? <ChevronUpIcon className="h-2 w-2 text-white font-black inline" /> : <ChevronDownIcon className="h-2 w-2 text-white font-black inline" />}
                                            </span>
                                        )}
                                    </th>
                                    <th
                                        onClick={() => handleSort('condition')}
                                        className="sticky cursor-pointer top-0 z-10 p-2 border-x-2 border-y-2 border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-sm lg:text-base font-black text-white whitespace-pre backdrop-blur backdrop-filter">
                                        Condition
                                        {sortConfig.key === 'condition' && (
                                            <span className="ml-1">
                                                {sortConfig.direction === 'ascending' ? <ChevronUpIcon className="h-2 w-2 text-white font-black inline" /> : <ChevronDownIcon className="h-2 w-2 text-white font-black inline" />}
                                            </span>
                                        )}
                                    </th>
                                    <th
                                        onClick={() => handleSort('marketPrice')}
                                        className="sticky cursor-pointer top-0 z-10 p-2 border-x-2 border-y-2 border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-sm lg:text-base font-black text-white whitespace-pre backdrop-blur backdrop-filter">
                                        Price
                                        {sortConfig.key === 'marketPrice' && (
                                            <span className="ml-1">
                                                {sortConfig.direction === 'ascending' ? <ChevronUpIcon className="h-2 w-2 text-white font-black inline" /> : <ChevronDownIcon className="h-2 w-2 text-white font-black inline" />}
                                            </span>
                                        )}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 text-black px-1 py-1 mx-auto">
                                {sortedAndPaginatedData.currentItems.map(({ card, data, error }, index) => (
                                    <tr key={index}>
                                        <td className="border border-gray-100 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedRows.has((currentPage - 1) * itemsPerPage + index)}
                                                onChange={() => toggleCheckbox(index)} />
                                        </td>
                                        <td className="p-2 text-center border-t border-gray-100 text-xs lg:text-sm sm:text-left text-black hover:bg-black hover:text-white">{card?.productName}</td>
                                        <td className="p-2 text-center border-t border-gray-100 text-xs lg:text-sm sm:text-left text-black hover:bg-black hover:text-white">{card?.setName}</td>
                                        <td className="p-2 text-center border-t border-gray-100 text-xs lg:text-sm sm:text-left text-black hover:bg-black hover:text-white">{card?.number}</td>
                                        <td className="p-2 text-center border-t border-gray-100 text-xs lg:text-sm sm:text-left text-black hover:bg-black hover:text-white">{card?.rarity}</td>
                                        <td className="p-2 text-center border-t border-gray-100 text-xs lg:text-sm sm:text-left text-black hover:bg-black hover:text-white">{card?.condition}</td>
                                        <td className="p-2 text-center border-t border-gray-100 text-xs lg:text-sm sm:text-left text-black hover:bg-black hover:text-white">{data?.marketPrice !== undefined ? `${data?.marketPrice}` : error}</td>
                                    </tr>
                                ))}

                            </tbody>

                        </table>
                        <div className="max-h-fit w-full">
                    <button className="border border-white rounded-lg px-2 py-2 mx-auto m-1 text-white text-sm font-bold hover:text-black hover:bg-white" onClick={downloadCSV}>
                        Download CSV
                    </button>
                    <button className="float-start border border-white rounded-lg px-2 py-2 mx-auto m-1 text-sm text-white font-bold hover:text-black hover:bg-white" onClick={addToCollection}>
                        Add cards to collection
                    </button>
                    <button className="float-end border border-white rounded-lg px-2 py-2 mx-auto text-sm m-1 text-white font-bold hover:text-black hover:bg-white" onClick={handleGoToCollectionPage}>
                        View Collection
                    </button>
                </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default YugiohCardDataTable;