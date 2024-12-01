import DownloadYugiohCSVButton from "@/components/Yugioh/Buttons/DownloadYugiohCSVButton";
import CardFilter from "@/components/Yugioh/CardFilter";
import YugiohPagination from "@/components/Yugioh/YugiohPagination";
import YugiohSearchBar from "@/components/Yugioh/YugiohSearchBar";
import { SpeedInsights } from "@vercel/speed-insights/next";
import dynamic from 'next/dynamic';
import Head from "next/head";
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
const TableView = dynamic(() => import("@/components/Yugioh/TableView"), { ssr: false });
const GridView = dynamic(() => import('@/components/Yugioh/GridView'), { ssr: false });

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
  const [itemsPerPage] = useState(20); // Adjust the number based on your design
  const [subtotalMarketPrice, setSubtotalMarketPrice] = useState(0);

  const handleSearch = useCallback((searchTerm) => {
    setSearchTerm(searchTerm);  // Update the state with the current search term
    setCurrentPage(1);
    if (searchTerm === "") {
      // If the search input is cleared, reset the aggregated data and pagination
      fetchData();  // Fetch the original data
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
    setCurrentPage(1);  // Reset pagination to page 1
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

  const applySorting = useCallback( (data) => {
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

  const handleSortChange = useCallback( (sortKey) => {
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


      <header className="bg-gradient-to-r from-purple-900/80 to-slate-900/80 rounded-lg shadow-xl p-6 mb-8">
      <h1 className="text-4xl font-bold text-white mb-4">My Collection</h1>
      <div className="flex items-center space-x-2">
        <span className="text-xl font-semibold text-white">Total Collection Value:</span>
        <span className="text-2xl font-bold text-emerald-400">${subtotalMarketPrice}</span>
      </div>
    </header>
        

        <div className="flex flex-wrap my-4 glass max-w-7xl ">
                <DownloadYugiohCSVButton
                  type="button"
                  aggregatedData={aggregatedData}
                  userCardList={[]}
                />

                <button
                  type="button"
                  disabled={true}
                  onClick={onDeleteAllCards}
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                  Delete All Cards
                </button>


                
          </div>
          <div className="flex flex-wrap gap-4 mb-6">
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setView('grid')}
          className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
            view === 'grid'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary hover:bg-secondary/80'
          }`}
        >
                  Grid View
                </button>
                <button
          onClick={() => setView('table')}
          className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
            view === 'table'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary hover:bg-secondary/80'
          }`}
        >
                  Table View
                </button>
                </div>

                <button
        onClick={toggleFilterMenu}
        className="inline-flex items-center px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
      >
     
                  {isFilterMenuOpen ? "Close Filter" : "Open Filter"}
                  
                </button>
                 {isFilterMenuOpen && <CardFilter updateFilters={handleFilterChange} />} 
                </div>
<div className="inline text-black">
                  <YugiohSearchBar
                    searchTerm={searchTerm}
                    onSearch={handleSearch} />
                </div>

              

       
          {!isLoading && view === "grid" ? (
            <>
                <Suspense fallback={<div>Loading...</div>}>
                <GridView
                  aggregatedData={paginatedData}
                  onDeleteCard={onDeleteCard}
                  onUpdateCard={onUpdateCard}
                  setAggregatedData={setAggregatedData}
                />
                <div className=" max-w-7xl mt-24">
                  <YugiohPagination
                  currentPage={currentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={aggregatedData.length}
                  handlePageClick={handlePageClick}
                /></div>
                </Suspense>
            </>
          ) : (

              <Suspense fallback={<div>Loading...</div>}>
                
                <TableView
                  handleSortChange={handleSortChange}
                  onUpdateCard={onUpdateCard}
                  aggregatedData={aggregatedData}
                  onDeleteCard={onDeleteCard}
                />
              </Suspense>

          )}

        

      <SpeedInsights></SpeedInsights>
    </>
  );
};

export default MyCollectionPage;
