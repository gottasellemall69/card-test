// @/components/YugiohCardListInput.js
import React,{useState,useMemo} from 'react';
import {useRouter} from 'next/router';
import {ChevronDownIcon,ChevronUpIcon} from '@heroicons/react/24/solid';
import LoadingSpinner from '@/components/LoadingSpinner';
import YugiohPagination from '@/components/YugiohPagination';

const YugiohCardListInput=({
  cardList,
  setCardList,
  handleSubmit,
  isLoading,
  error,
  matchedCardData,
  setMatchedCardData
}) => {
  const [currentPage,setCurrentPage]=useState(1);
  const itemsPerPage=25; // Adjust as needed
  const [sortConfig,setSortConfig]=useState({key: [],direction: 'ascending'});
  const [selectedRows,setSelectedRows]=useState([]);
  const router=useRouter();

  // Pagination handlers
  const handlePageClick=(page) => {
    setCurrentPage(page);
  };

  const handleSort=(key) => {
    let direction='ascending';
    if(sortConfig.key===key&&sortConfig.direction==='ascending') {
      direction='descending';
    }
    setSortConfig({key,direction});

    setMatchedCardData((prevData) => {
      const sorted=[...prevData].sort((a,b) => {
        const aValue=key==='marketPrice'? (a.data.marketPrice||0):a.card[key];
        const bValue=key==='marketPrice'? (b.data.marketPrice||0):b.card[key];
        if(aValue<bValue) {
          return direction==='ascending'? -1:1;
        }
        if(aValue>bValue) {
          return direction==='ascending'? 1:-1;
        }
        return 0;
      });
      return sorted;
    });
  };

  // Memoize sorted and paginated data
  const sortedAndPaginatedData=useMemo(() => {
    if(!Array.isArray(matchedCardData)) {
      return {currentItems: [],totalCount: 0};
    }
    const sortedData=[...matchedCardData].sort((a,b) => {
      const aValue=sortConfig.key==='marketPrice'? (a.data.marketPrice||0):a.card[sortConfig.key];
      const bValue=sortConfig.key==='marketPrice'? (b.data.marketPrice||0):b.card[sortConfig.key];
      if(aValue<bValue) {
        return sortConfig.direction==='ascending'? -1:1;
      }
      if(aValue>bValue) {
        return sortConfig.direction==='ascending'? 1:-1;
      }
      return 0;
    });

    // Pagination calculation
    const indexOfLastItem=currentPage*itemsPerPage;
    const indexOfFirstItem=indexOfLastItem-itemsPerPage;
    const currentItems=sortedData.slice(indexOfFirstItem,indexOfLastItem);

    return {currentItems,totalCount: sortedData.length};
  },[currentPage,itemsPerPage,matchedCardData,sortConfig]);

  // Function to handle checkbox toggle
  const toggleCheckbox=(index) => {
    const selectedIndex=selectedRows.indexOf(index);
    let newSelected=[...selectedRows];

    if(selectedIndex===-1) {
      newSelected.push(index);
    } else {
      newSelected.splice(selectedIndex,1);
    }

    setSelectedRows(newSelected);
  };

  // Function to handle adding selected rows to collection
  const addToCollection=() => {
    const selectedData=selectedRows.map((index) => sortedAndPaginatedData.currentItems[index]);
    console.log('Selected Rows Data:',selectedData);

    const collectionArray=[]; // Initialize an array to store selected data
    selectedData.forEach(({card,data}) => {
      // Extract the required information from the selected data and add it to the collection array
      const item={
        productName: card?.productName,
        setName: card?.setName,
        number: card?.number,
        printing: card?.printing,
        rarity: card?.rarity,
        condition: card?.condition,
        marketPrice: data?.marketPrice,
      };
      collectionArray.push(item);
    });

    // Now, collectionArray contains the selected data for further processing or storage
    console.log('Collection Array:',collectionArray);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <textarea
          className="text-black text-nowrap max-w-7xl w-full h-72 p-2 resize-none"
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
        {isLoading&&<LoadingSpinner />}
        {error&&<p>{error}</p>}
        <h2 className="my-5 text-white font-black">Matched Card Data:</h2>
        {sortedAndPaginatedData.currentItems.length>0&&(
          <>
            <table className="mx-auto divide-y w-full divide-gray-200">
              <thead className="mx-auto bg-transparent">
                <tr>
                  <th className="p-2 border-b border-gray-300 bg-stone-500 bg-opacity-20 text-center text-white">
                    Select
                  </th>
                  <th
                    onClick={() => handleSort('productName')}
                    className="sticky top-0 z-10 p-2 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter cursor-pointer">
                    Name
                    {sortConfig.key==='productName'&&(
                      <span className="ml-1">
                        {sortConfig.direction==='ascending'? <ChevronUpIcon className="h-4 w-4 inline" />:<ChevronDownIcon className="h-4 w-4 inline" />}
                      </span>
                    )}
                  </th>
                  <th
                    onClick={() => handleSort('setName')}
                    className="hidden md:table-cell sticky top-0 z-10 p-2 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter cursor-pointer">
                    Set
                    {sortConfig.key==='setName'&&(
                      <span className="ml-1">
                        {sortConfig.direction==='ascending'? <ChevronUpIcon className="h-4 w-4 inline" />:<ChevronDownIcon className="h-4 w-4 inline" />}
                      </span>
                    )}
                  </th>
                  <th
                    onClick={() => handleSort('number')}
                    className="sticky top-0 z-10 p-2 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter cursor-pointer">
                    Number
                    {sortConfig.key==='number'&&(
                      <span className="ml-1">
                        {sortConfig.direction==='ascending'? <ChevronUpIcon className="h-4 w-4 inline" />:<ChevronDownIcon className="h-4 w-4 inline" />}
                      </span>
                    )}
                  </th>
                  <th
                    onClick={() => handleSort('printing')}
                    className="sticky top-0 z-10 p-2 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter cursor-pointer">
                    Printing
                    {sortConfig.key==='printing'&&(
                      <span className="ml-1">
                        {sortConfig.direction==='ascending'? <ChevronUpIcon className="h-4 w-4 inline" />:<ChevronDownIcon className="h-4 w-4 inline" />}
                      </span>
                    )}
                  </th>
                  <th
                    onClick={() => handleSort('rarity')}
                    className="sticky top-0 z-10 p-2 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter cursor-pointer">
                    Rarity
                    {sortConfig.key==='rarity'&&(
                      <span className="ml-1">
                        {sortConfig.direction==='ascending'? <ChevronUpIcon className="h-4 w-4 inline" />:<ChevronDownIcon className="h-4 w-4 inline" />}
                      </span>
                    )}
                  </th>
                  <th
                    onClick={() => handleSort('condition')}
                    className="hidden md:table-cell sticky top-0 z-10 p-2 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter cursor-pointer">
                    Condition
                    {sortConfig.key==='condition'&&(
                      <span className="ml-1">
                        {sortConfig.direction==='ascending'? <ChevronUpIcon className="h-4 w-4 inline" />:<ChevronDownIcon className="h-4 w-4 inline" />}
                      </span>
                    )}
                  </th>
                  <th
                    onClick={() => handleSort('marketPrice')}
                    className="sticky top-0 z-10 p-2 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter cursor-pointer">
                    Price
                    {sortConfig.key==='marketPrice'&&(
                      <span className="ml-1">
                        {sortConfig.direction==='ascending'? <ChevronUpIcon className="h-4 w-4 inline" />:<ChevronDownIcon className="h-4 w-4 inline" />}
                      </span>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-black">
                {sortedAndPaginatedData.currentItems.map(({card,data},index) => (
                  <tr key={index}>
                    <td className="border border-gray-800 p-2 text-center">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(index)}
                        onChange={() => toggleCheckbox(index)}
                      />
                    </td>
                    <td className="border border-gray-800 p-2 whitespace-pre-wrap text-sm font-medium text-black hover:bg-black hover:text-white">{card?.productName}</td>
                    <td className="border border-gray-800 p-2 whitespace-pre-wrap text-sm font-medium text-black hidden md:table-cell hover:bg-black hover:text-white">{card?.setName}</td>
                    <td className="border border-gray-800 p-2 whitespace-pre-wrap text-sm font-medium text-black hover:bg-black hover:text-white">{card?.number}</td>
                    <td className="border border-gray-800 p-2 whitespace-pre-wrap text-sm font-medium text-black hover:bg-black hover:text-white">{card?.printing}</td>
                    <td className="border border-gray-800 p-2 whitespace-pre-wrap text-sm font-medium text-black hover:bg-black hover:text-white">{card?.rarity}</td>
                    <td className="border border-gray-800 p-2 whitespace-pre-wrap text-sm font-medium text-black hidden md:table-cell hover:bg-black hover:text-white">{card?.condition}</td>
                    <td className="border border-gray-800 p-2 whitespace-pre-wrap text-sm font-medium text-black hover:bg-black hover:text-white">{data?.marketPrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              className="border border-white rounded-lg px-2 py-2 mx-auto m-2 text-white font-bold hover:text-black hover:bg-white"
              onClick={addToCollection}>
              Add to Collection
            </button>
          </>
        )}
      </>
      <YugiohPagination
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        totalItems={sortedAndPaginatedData.totalCount}
        handlePageClick={handlePageClick}
      />
    </div>
  );
};

export default YugiohCardListInput;
