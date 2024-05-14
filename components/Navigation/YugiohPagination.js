'use client';
// @/components/Yugioh/YugiohPagination.js
/**
 * Renders a pagination component for a Yugioh card list.
 * 
 * @param {Object} props - The props object containing the pagination data.
 * @param {number} props.currentPage - The current page number.
 * @param {number} props.itemsPerPage - The number of items to display per page.
 * @param {number} props.totalItems - The total number of items.
 * @param {function} props.handlePageClick - The function to handle page click events.
 * @returns {JSX.Element} The pagination component.
 */
// @/components/Yugioh/YugiohPagination.js

import React from 'react';

function YugiohPagination({currentPage,itemsPerPage,totalItems,handlePageClick}) {
  const pageCount=Math.ceil(totalItems/itemsPerPage);

  return (

    <nav aria-label="Pagination Navigation">
      <ul className="mt-2 items-center gap-2 flex flex-row w-full mx-auto border-t border-gray-200 bg-transparent px-4 py-3 sm:px-6">
        {currentPage>1&&(
          <li>
            <button className="relative inline-flex items-center rounded-md border border-gray-300 bg-transparent backdrop filter px-4 py-2 text-sm font-medium text-white text-shadow hover:text-black hover:bg-white" onClick={() => handlePageClick(currentPage-1)} disabled={currentPage===1}>
              Previous
            </button>
          </li>
        )}
        {Array.from({length: pageCount},(_,i) => (
          <li className="hidden gap-2 mx-auto w-full sm:flex flex-row items-center sm:justify-center" key={i+1}>
            <button onClick={() => handlePageClick(i+1)} className={currentPage===i+1? 'active':''}>
              {i+1}
            </button>
          </li>
        ))}
        <div className="mx-auto gap-2 flex w-full flex-row items-center sm:space-y-2 sm:justify-center sm:hidden">
          {Array.from({length: currentPage-currentPage+1},(_,i) => i+1).map((page) => (
            <li className={`mx-auto relative w-full text-white text-shadow`} key={page}>
              Page {currentPage} of {pageCount}
            </li>
          ))}
        </div>
        {currentPage<pageCount&&(
          <li>
            <button className="relative inline-flex items-center rounded-md border border-gray-300 bg-transparent backdrop filter px-4 py-2 text-sm font-medium text-white text-shadow hover:text-black hover:bg-white" onClick={() => handlePageClick(currentPage+1)} disabled={currentPage===pageCount}>
              Next
            </button>
          </li>
        )}
      </ul>
    </nav>

  );
}

export default YugiohPagination;
