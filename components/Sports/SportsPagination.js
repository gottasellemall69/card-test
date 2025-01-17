import { useEffect, useState } from 'react';

const SportsPagination = ({ totalPages, currentPage, onPageChange }) => {
  // Local state for the input value
  const [inputValue, setInputValue] = useState(currentPage.toString());

  // Synchronize the input value with the current page when the currentPage prop changes
  useEffect(() => {
    setInputValue(currentPage.toString());
  }, [currentPage]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    const page = parseInt(value, 10);
    // Only update page if input is a valid number and within range
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
    else {
      onPageChange(1);
    }
  };

  const handleInputBlur = () => {
    const page = parseInt(inputValue, 10);

    // If the input is invalid on blur, reset it to the current page
    if (isNaN(page) || page < 1 || page > totalPages) {
      setInputValue(currentPage.toString());
    } else {
      onPageChange(page);
    }
  };

  const handleInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      const page = parseInt(inputValue, 10);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        onPageChange(page);
      } else {
        setInputValue(currentPage.toString(page));
      }
    }
  };

  return (
    <nav className="pagination-container mt-4 my-10 mx-auto">
      <ul className="pagination flex justify-center items-center">
        {/* Previous button */}
        <li className={`page-item ${ currentPage === 1 ? 'disabled' : '' }`}>
          <button
            onClick={() => onPageChange(currentPage - 1)}
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
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyUp={handleInputKeyPress}
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
            onClick={() => onPageChange(currentPage + 1)}
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

export default SportsPagination;
