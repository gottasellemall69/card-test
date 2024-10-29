import DownloadYugiohCSVButton from "@/components/Yugioh/Buttons/DownloadYugiohCSVButton";
import CardFilter from "@/components/Yugioh/CardFilter";
import YugiohPagination from "@/components/Yugioh/YugiohPagination";
import YugiohSearchBar from "@/components/Yugioh/YugiohSearchBar";
import { SpeedInsights } from "@vercel/speed-insights/next";
import dynamic from 'next/dynamic';
import Head from "next/head";
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
const TableView = dynamic(() => import("@/components/Yugioh/TableView"),{ssr: true});
const GridView = dynamic(() => import('@/components/Yugioh/GridView'),{ssr: true});

const MyCollectionPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aggregatedData, setAggregatedData] = useState([]);
  const [filters, setFilters] = useState({
    rarity: [],
    condition: [],
  });
  const [sortConfig, setSortConfig] = useState({
    key: "",
    direction: "",
  });
  const [view, setView] = useState("grid"); // 'table' or 'grid'
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12); // Adjust the number based on your design
  const [subtotalMarketPrice, setSubtotalMarketPrice] = useState(0);
  const [totalCardCount, setTotalCardCount] = useState('');

  const handleSearch = useCallback((searchTerm) => {
    setSearchTerm(searchTerm);  // Update the state with the current search term
    setCurrentPage(1);
    if (searchTerm === "") {
      // If the search input is cleared, reset the aggregated data and pagination
      fetchData();  // Fetch the original data
      setCurrentPage(1);  // Reset pagination to page 1
    }
    // Otherwise, filter the data based on the search term
    const filteredData = aggregatedData.filter((card) =>
      card.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.setName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.rarity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.printing.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.condition.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setAggregatedData(filteredData);
  }, [aggregatedData]);


  useEffect(() => {
    if (Array.isArray(aggregatedData) && aggregatedData.length) {
      const subtotal = aggregatedData.reduce(
        (sum, card) => sum + (card.marketPrice || 0) * (card.quantity || 0),
        0
      );
      setSubtotalMarketPrice(subtotal.toFixed(2));
    }
  }, [aggregatedData]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/Yugioh/my-collection");
      if (!response.ok) {
        throw new Error("Failed to fetch aggregated data");
      }
      const data = await response.json();
      const filteredData = applyFilters(data);
      const sortedData = applySorting(filteredData);
      setAggregatedData(sortedData);
    } catch (error) {
      setError("Error fetching aggregated data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filters, sortConfig]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const applyFilters = useCallback((data) => {
    if (filters.rarity.length === 0 && filters.condition.length === 0) {
      return data;
    }
    return data.filter((card) => {
      return (
        (filters.rarity.length === 0 || filters.rarity.includes(card.rarity)) &&
        (filters.condition.length === 0 || filters.condition.includes(card.condition))
      );
    });
  }, [filters]);

  const handleFilterChange = useCallback((filterName, selectedOptions) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [filterName]: selectedOptions,
    }));
    setCurrentPage(1);
  }, []);

  const applySorting = useCallback((data) => {
    if (!sortConfig.key) {
      return data;
    }
    return [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "ascending" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "ascending" ? 1 : -1;
      }
      return 0;
    });
  }, [sortConfig]);

  const handleSortChange = useCallback(async(sortKey) => {
    setSortConfig((prevSortConfig) => ({
      key: sortKey,
      direction: prevSortConfig.key === sortKey && prevSortConfig.direction === "ascending" ? "descending" : "ascending",
    }));
  }, []);

  const onUpdateCard = useCallback(async (cardId, field, value) => {
      try {
        if (cardId && field && value !== undefined && value !== null) {
          const updateCard = { cardId, field, value };
          const response = await fetch("/api/Yugioh/updateCards", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updateCard),
          });
          if (!response.ok) {
            throw new Error("Failed to update card");
          }
          await fetchData();
          const updatedCard = await response.json();
          setAggregatedData((currentData) =>
            currentData.map((card) =>
              card._id === cardId ? { ...card, ...updatedCard } : card
            )
          );
        } else {
          throw new Error("Invalid cardId, field, or value");
        }
      } catch (error) {
        console.error("Error updating card:", error);
      }
    },
    [fetchData]
  );

  const onDeleteCard = useCallback(async (cardId) => {
      try {
        const response = await fetch(`/api/Yugioh/deleteCards`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ cardId: cardId }),
        });
        if (!response.ok) {
          throw new Error("Failed to delete card");
        }
        await fetchData();
        setAggregatedData((currentData) =>
          currentData.filter((card) => card._id !== cardId)
        );
      } catch (error) {
        console.error("Error deleting card:", error);
      }
    },
    [fetchData]
  );

  const onDeleteAllCards = async () => {
    try {
      const response = await fetch(`/api/Yugioh/deleteAllCards`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to delete all cards");
      }
      await fetchData();
      setAggregatedData([]);
    } catch (error) {
      console.error("Error deleting all cards:", error);
    }
  };

  // Get paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return aggregatedData.slice(startIndex, startIndex + itemsPerPage);
  }, [aggregatedData, currentPage, itemsPerPage]);

  const handlePageClick = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const toggleFilterMenu = useCallback(() => {
    setIsFilterMenuOpen((prevState) => !prevState);
  }, []);

  return (
    <>
      <Head>
        <title>My Collection</title>
        <meta
          name="description"
          content="Enter list of TCG cards, get data back"
        />
        <meta
          name="keywords"
          content="javascript,nextjs,price-tracker,trading-card-game,tailwindcss"
        />
        <meta name="charset" content="UTF-8" />
      </Head>

      <div className="w-full mx-auto mt-8">
        <h1 className="text-3xl font-semibold mb-6">My Collection</h1>
        <details className="italic text-sm text-white mb-5 max-w-[500px]">
          You can click on the number of the quantity field below the card image
          to manually update it, and clicking the delete button underneath the
          card will decrease the quantity by 1, or if there is only one card,
          will remove the card from the collection.
          <br />
          Hover over or tap the card image to view the details of the card.
        </details>

        <div className="mx-auto container w-full">
          {isFilterMenuOpen && <CardFilter updateFilters={handleFilterChange} />}
         
            {view === "grid" ? (
              <>
              <Suspense fallback={<div>Loading...</div>}>
              
        <div className="flex flex-col sm:flex-row w-fit mx-auto sm:mx-0 sm:gap-10 align-baseline">


<div className="float-left space-x-2 sm:space-x-0 space-y-0 sm:space-y-2">
  <button
    type="button"
    onClick={() => setView("grid")}
    className={`px-2 py-2 ${ view === "grid"
      ? "my-1 text-sm border border-white rounded-lg mx-auto sm:m-2 text-black font-bold bg-white hover:text-white hover:bg-black"
      : "relative bg-black text-white font-bold my-2 px-2 py-2 rounded border border-zinc-400 hover:bg-white hover:text-black"
      }`}
  >
    Grid View
  </button>
  <button
    type="button"
    onClick={() => setView("table")}
    className={`px-2 py-2 ${ view === "table"
      ? "my-1 text-sm border border-white rounded-lg mx-auto sm:m-2 text-black bg-white font-bold hover:text-white hover:bg-black"
      : "relative bg-black text-white font-bold my-2 px-2 py-2 rounded border border-zinc-400 hover:bg-white hover:text-black"
      }`}
  >
    Table View
  </button>
</div>

<div className="float-right flex-wrap flex-row">
  <button
    onClick={toggleFilterMenu}
    className="text-nowrap bg-white text-black font-bold m-1 px-2 py-2 rounded border border-zinc-400 hover:bg-black hover:text-white"
  >
    {isFilterMenuOpen ? "Close Filter" : "Open Filter"}
  </button>

  <DownloadYugiohCSVButton
    aggregatedData={aggregatedData}
    userCardList={[]}
  />

  <button
    disabled={true}
    type="button"
    onClick={onDeleteAllCards}
    className="my-2 float-start flex-wrap text-sm border hover:cursor-not-allowed border-red-500 rounded-lg px-2 py-2 mx-auto text-red-500 font-bold hover:text-white hover:bg-red-500"
  >
    Delete All Cards
  </button>
</div>
</div>
<div className="mt-6">

<span className="text-xl font-semibold p-2">
  Total Collection Value: ${subtotalMarketPrice}
</span>

</div>
                <div className="container mx-auto max-w-xl place-self-center align-top text-black my-2 pb-5">
                  <YugiohSearchBar
                    searchTerm={searchTerm}
                    onSearch={handleSearch} />
                </div>
                <div className="container contents p-3 mx-auto">
                  
                  <GridView
                    aggregatedData={paginatedData}
                    onDeleteCard={onDeleteCard}
                    onUpdateCard={onUpdateCard}
                    setAggregatedData={setAggregatedData}
                  />
                 
                </div>
                <YugiohPagination
                  currentPage={currentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={aggregatedData.length}
                  handlePageClick={handlePageClick}
                />
                 </Suspense>
              </>
            ) : (
              <>
              <Suspense fallback={<div>Loading...</div>}>
                <div className="container mx-auto max-w-xl place-self-center align-top text-black my-2">
                  <YugiohSearchBar
                    searchTerm={searchTerm}
                    onSearch={handleSearch} />
                </div>
                <TableView
                  handleSortChange={handleSortChange}
                  onUpdateCard={onUpdateCard}
                  aggregatedData={aggregatedData}
                  onDeleteCard={onDeleteCard}
                />
                </Suspense>
              </>
            )}
          
        </div>
      </div>
      <SpeedInsights></SpeedInsights>
    </>
  );
};

export default MyCollectionPage;
