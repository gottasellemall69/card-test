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
function YugiohPagination({currentPage,itemsPerPage,totalItems,handlePageClick}) {
  const pageCount=Math.ceil(totalItems/itemsPerPage);

  return (
    <>
      <nav aria-label="Pagination Navigation">
        <ul className="items-center gap-2 inline-flex mx-auto w-full border-t border-gray-200 bg-transparent px-4 py-3 sm:px-6">
          {pageCount>1&&(
            <li>
              <button onClick={() => handlePageClick(currentPage-1)} disabled={currentPage===1}>
                <div className="relative inline-flex items-center rounded-md border border-gray-300 bg-transparent backdrop filter px-4 py-2 text-sm font-medium text-white text-shadow hover:text-black hover:bg-white">
                  Previous
                </div>
              </button>
            </li>
          )}
          <div className="hidden gap-2 mx-auto w-fit sm:flex flex-row items-center sm:justify-center">
            {Array.from({length: pageCount},(_,i) => i+1).map((pageNumber) => (
              <li className="mx-auto space-x-2 relative inline-flex items-center rounded-md border border-gray-300 bg-transparent backdrop filter px-4 py-2 text-sm font-medium text-white text-shadow hover:text-black hover:bg-white" key={pageNumber} style={{backgroundColor: currentPage===pageNumber? 'white':'',color: currentPage===pageNumber? 'black':''}}>
                <button onClick={() => handlePageClick(pageNumber)}>{pageNumber}</button>
              </li>
            ))}
          </div>
          <div className="mx-auto gap-2 flex flex-row items-center sm:space-y-2 sm:justify-center sm:hidden">
            {Array.from({length: currentPage-currentPage+1},(_,i) => i+1).map((page) => (
              <li
                className={`mx-auto relative w-fit inline-flex text-white text-shadow`}
                key={page}
              >
                Page {currentPage} of {pageCount}
              </li>
            ))}
          </div>
          {pageCount>1&&(
            <li>
              <button onClick={() => handlePageClick(currentPage+1)} disabled={currentPage===pageCount}>
                <div className="relative inline-flex items-center rounded-md border border-gray-300 bg-transparent backdrop filter px-4 py-2 text-sm font-medium text-white text-shadow hover:text-black hover:bg-white">
                  Next
                </div>
              </button>
            </li>
          )}
        </ul>
      </nav>
    </>
  );
}

export default YugiohPagination;