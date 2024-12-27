'use client'
import { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import DownloadYugiohCSVButton from "@/components/Yugioh/Buttons/DownloadYugiohCSVButton";
import CardFilter from "@/components/Yugioh/CardFilter";
import YugiohPagination from "@/components/Yugioh/YugiohPagination";
import YugiohSearchBar from "@/components/Yugioh/YugiohSearchBar";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Suspense } from "react";

const TableView = dynamic(() => import("@/components/Yugioh/TableView"), {
  ssr: false,
});
const GridView = dynamic(() => import("@/components/Yugioh/GridView"), {
  ssr: false,
  loading: () => <div className="w-full max-w-7xl mx-auto text-3xl font-black">Loading...</div>,
});


const MyCollectionPage = ({ error }) => {
  // States for managing data and UI
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [initialData, setInitialData] = useState([]);
  const [aggregatedData, setAggregatedData] = useState(initialData || []);
  const [filters, setFilters] = useState({
    rarity: [],
    condition: [],
  });
  const [sortConfig, setSortConfig] = useState({
    key: "",
    direction: "",
  });
  const [view, setView] = useState("grid");
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [subtotalMarketPrice, setSubtotalMarketPrice] = useState(0);

   // Update subtotal market price when aggregatedData changes
   useEffect(() => {
    if (Array.isArray(aggregatedData) && aggregatedData.length) {
      const subtotal = aggregatedData.reduce(
        (sum, card) => sum + (card.marketPrice || 0) * (card.quantity || 0),
        0
      );
      setSubtotalMarketPrice(subtotal.toFixed(2));
    }
  }, [aggregatedData]);



  // Handle search functionality
  const handleSearch = useCallback((searchTerm) => {
    setSearchTerm(searchTerm);
    setCurrentPage(1);
    if (searchTerm === "") {
      // Reset to initial data if the search is cleared
      setAggregatedData(initialData);
    } else {
      const filteredData = initialData.filter((card) =>
        ["productName", "setName", "number", "rarity", "printing", "condition"]
          .some((key) => card[key]?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setAggregatedData(filteredData);
    }
  }, [initialData]);
  

  // Apply filters to the data
  const applyFilters = useCallback(
    (data) => {
      if (!filters.rarity.length && !filters.condition.length) return data;
      return data.filter((card) => {
        return (
          (!filters.rarity.length || filters.rarity.includes(card.rarity)) &&
          (!filters.condition.length || filters.condition.includes(card.condition))
        );
      });
    },
    [filters]
  );

  // Handle filter changes
  const handleFilterChange = useCallback(
    (filterName, selectedOptions) => {
      setFilters((prevFilters) => ({
        ...prevFilters,
        [filterName]: selectedOptions,
      }));
      setCurrentPage(1);
    },
    []
  );

  // Apply sorting to the data
  const applySorting = useCallback(
    (data) => {
      if (!sortConfig.key) return data;
      return [...data].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    },
    [sortConfig]
  );

  // Handle sorting change
  const handleSortChange = useCallback(
    (sortKey) => {
      setSortConfig((prevSortConfig) => ({
        key: sortKey,
        direction:
          prevSortConfig.key === sortKey && prevSortConfig.direction === "ascending"
            ? "descending"
            : "ascending",
      }));
    },
    []
  );

  // Paginate the data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return aggregatedData.slice(startIndex, startIndex + itemsPerPage);
  }, [aggregatedData, currentPage, itemsPerPage]);

  const handlePageClick = useCallback((page) => setCurrentPage(page), []);

  const toggleFilterMenu = useCallback(() => setIsFilterMenuOpen((prev) => !prev), []);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch("/api/Yugioh/my-collection");
      if (!response.ok) {
        throw new Error("Failed to fetch aggregated data");
      }
      const data = await response.json();
      const filteredData = applyFilters(data);
      const sortedData = applySorting(filteredData);
      setInitialData(data); // Store the unfiltered data
      setAggregatedData(sortedData);
    } catch (error) {
      setError("Error fetching aggregated data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [applyFilters, applySorting]);  

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdatePrices = useCallback(async () => {
    setIsUpdatingPrices(true);
    try {
      const response = await fetch('/api/Yugioh/updateCardPrices', { method: 'POST' });
  
      if (!response.ok) {
        throw new Error('Failed to update card prices.');
      }
  
      const result = await response.json();
  
      alert(`Prices updated successfully.`);
      await fetchData(); // Refresh collection data to reflect updated prices
    } catch (error) {
      console.error('Error updating card prices:', error);
      alert('An error occurred while updating prices. Please try again later.');
    } finally {
      setIsUpdatingPrices(false);
    }
  }, [fetchData]);  

  const onUpdateCard = useCallback(async(cardId, field, value) => {
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
    []
  );

  const onDeleteCard = useCallback(async(cardId) => {
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
    []
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
        <div className="flex items-center">
          <span className="text-xl font-semibold text-white">Total Collection Value:</span>
          <span className="text-2xl font-bold text-emerald-400">
            ${subtotalMarketPrice}
          </span>
        </div>
      </header>
      <div className="my-4 glass max-w-7xl mx-auto">
        <DownloadYugiohCSVButton
          type="button"
          aggregatedData={aggregatedData}
          userCardList={[]}
        />
        <div>
    <button
      onClick={handleUpdatePrices}
      disabled={isUpdatingPrices}
      className={`flex flex-row items-center px-4 py-2 rounded-lg ${
        isUpdatingPrices ? 'bg-gray-500 cursor-not-allowed' : 'bg-primary hover:bg-primary/80'
      }`}
    >
      {isUpdatingPrices ? 'Updating Prices...' : 'Update Prices'}
    </button>

    {isUpdatingPrices && (
      <p className="text-sm text-white-600 mt-2">
        Prices are being updated. This may take a few minutes...
      </p>
    )}
  </div>
        <button
          type="button"
          disabled={true}
          onClick={onDeleteAllCards}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Delete All Cards
        </button>



      </div>
      <div className="flex flex-wrap gap-4 mb-6 glass max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setView('grid')}
            className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${view === 'grid'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary hover:bg-secondary/80'
              }`}
          >
            Grid View
          </button>
          <button
            onClick={() => setView('table')}
            className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${view === 'table'
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
        
      </div>
      {isFilterMenuOpen && <CardFilter updateFilters={handleFilterChange} />}
      <div className="mx-auto text-black w-full max-w-7xl">
        <YugiohSearchBar
          searchTerm={searchTerm}
          onSearch={handleSearch} />
      </div>
      

{!isLoading && view === "grid" ? (
  <>
          
           <div className="w-fit mx-auto mt-12">
              <YugiohPagination
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                totalItems={aggregatedData.length}
                handlePageClick={handlePageClick}
              />
              </div>
              <div className="w-full mx-auto mb-24 min-h-screen">
            <GridView
              aggregatedData={paginatedData}
              onDeleteCard={onDeleteCard}
              onUpdateCard={onUpdateCard}
              setAggregatedData={setAggregatedData}
            />
          </div>
          <div className="w-fit mx-auto mb-12">
              <YugiohPagination
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                totalItems={aggregatedData.length}
                handlePageClick={handlePageClick}
              />
              </div>
</>
      ) : ( 
<div className="w-full max-w-7xl mx-auto">
  <Suspense fallback={<p>Loading...</p>}>
          <TableView
            handleSortChange={handleSortChange}
            onUpdateCard={onUpdateCard}
            aggregatedData={aggregatedData}
            onDeleteCard={onDeleteCard}
          />
  </Suspense>
          </div>
     )}
      <SpeedInsights></SpeedInsights>
    </>
  );
};

export default MyCollectionPage;
