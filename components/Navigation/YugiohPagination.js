import { useEffect, useState } from 'react';

const YugiohPagination = ({ currentPage, itemsPerPage, totalItems, handlePageClick }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const [inputPage, setInputPage] = useState(currentPage);

  useEffect(() => {
    setInputPage(currentPage);
  }, [currentPage]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^[0-9\b]+$/.test(value)) {
      setInputPage(value);
    }
  };

  const handleInputSubmit = () => {
    let pageNumber = parseInt(inputPage, 10);
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      handlePageClick(pageNumber);
    } else if (pageNumber < 1) {
      handlePageClick(1);
      setInputPage(1);
    } else if (pageNumber > totalPages) {
      handlePageClick(totalPages);
      setInputPage(totalPages);
    }
  };

  return (
    <nav className="pagination-container mt-4 my-10 place-content-stretch w-full">
      <ul className="pagination flex justify-center mx-auto items-center">
        {/* Previous button */}
        <li className={`page-item ${ currentPage === 1 ? 'disabled' : '' }`}>
          <button
            onClick={() => handlePageClick(currentPage - 1)}
            disabled={currentPage === 1}
            className="border border-white page-link px-3 py-2 mx-1 text-black font-bold bg-white rounded hover:bg-black hover:text-white"
          >
            Previous
          </button>
        </li>

        {/* Page input box */}
        <li className="page-item">
          <input
            type="text"
            value={inputPage}
            onChange={handleInputChange}
            onBlur={handleInputSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleInputSubmit()}
            className="page-input text-black px-3 py-2 mx-1 text-center border rounded w-16"
            aria-label="Page number input"
          />
        </li>

        <li className="page-item">
          <span className="page-total px-3 py-2 mx-1 font-bold">
            / {totalPages}
          </span>
        </li>

        {/* Next button */}
        <li className={`page-item ${ currentPage === totalPages ? 'disabled' : '' }`}>
          <button
            onClick={() => handlePageClick(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="border border-white page-link px-3 py-2 mx-1 text-black font-bold bg-white rounded hover:bg-black hover:text-white"
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default YugiohPagination;
