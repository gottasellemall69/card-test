// components/Sports/SportsPagination.js


const SportsPagination = ({ totalPages, currentPage, onPageChange }) => {
  return (
    <nav className="pagination-container mt-4 my-10 mx-auto ">
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
            value={currentPage}
            onChange={onPageChange}
            onKeyDown={(e) => e.key === 'Enter'}
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
