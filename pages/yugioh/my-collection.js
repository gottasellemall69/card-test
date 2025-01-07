'use client'
// pages\yugioh\my-collection.js
import { useCallback, useEffect, useMemo, useState } from "react";
import { Suspense } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import dynamic from "next/dynamic";

import DownloadYugiohCSVButton from "@/components/Yugioh/Buttons/DownloadYugiohCSVButton";
import CardFilter from "@/components/Yugioh/CardFilter";
import YugiohPagination from "@/components/Yugioh/YugiohPagination";
import YugiohSearchBar from "@/components/Yugioh/YugiohSearchBar";
import { SpeedInsights } from "@vercel/speed-insights/next";

const TableView = dynamic(() => import("@/components/Yugioh/TableView"), { ssr: true });
const GridView = dynamic(() => import("@/components/Yugioh/GridView"), {
  ssr: true,
  loading: () => <div className="w-full max-w-7xl mx-auto text-3xl font-black">Loading...</div>,
});


const MyCollectionPage = ({ error }) => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [initialData, setInitialData] = useState([]);
  const [aggregatedData, setAggregatedData] = useState(initialData || []);
  // States for managing data and UI
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

// Effect to check authentication
  useEffect(() => {
    const validateAuth = async () => {
      const storedToken = localStorage.getItem("token");
      if (!storedToken) {
        router.push("/login");
        return;
      }

      // Simulate token validation or call an API if needed
      setToken(storedToken);
      setIsAuthenticated(true);
    };

    validateAuth();
  }, [router]);

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

  

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch("/api/Yugioh/my-collection", {
        headers: {
          method: "GET",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch aggregated data");
      }
      const data = await response.json();
      const filteredData = applyFilters(data);
      const sortedData = applySorting(filteredData);
      setInitialData(data); // Store the unfiltered data
      setAggregatedData(sortedData);
    } catch (error) {
      console.error("Error fetching aggregated data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [applyFilters, applySorting, token]);

  useEffect(() => {
    if (isAuthenticated) {
    fetchData();
    }
  }, [isAuthenticated,fetchData]);

 

  // Handle search functionality
  const handleSearch = useCallback(async(searchTerm) => {
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

  // Handle filter changes
  const handleFilterChange = useCallback(
    async(filterName, selectedOptions) => {
      setFilters((prevFilters) => ({
        ...prevFilters,
        [filterName]: selectedOptions,
      }));
      setCurrentPage(1);
    },
    []
  );

  // Handle sorting change
  const handleSortChange = useCallback(
    async(sortKey) => {
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

  const handlePageClick = useCallback(async(page) => setCurrentPage(page), []);
  const toggleFilterMenu = useCallback(async() => setIsFilterMenuOpen((prev) => !prev), []);

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

  const handleUpdatePrices = useCallback(async () => {
    if (!token) {
      alert("You must be logged in to update prices.");
      return;
    }

    setIsUpdatingPrices(true);
    try {
      const response = await fetch('/api/Yugioh/updateCardPrices', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      });

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
  }, [token]);


  const onUpdateCard = useCallback(async (cardId, field, value) => {
    try {
      if (!token) {
        alert("You must be logged in to update cards.");
        return;
      }
  
      if (cardId && field && value !== undefined && value !== null) {
        const updateCard = { cardId, field, value };
        const response = await fetch("/api/Yugioh/updateCards", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Include the user's token
          },
          body: JSON.stringify(updateCard),
        });
  
        if (!response.ok) {
          throw new Error("Failed to update card");
        }
  
        const updatedCard = await response.json();
        await fetchData(); // Refresh data after the update
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
  }, [fetchData, token]);
  
  const onDeleteCard = useCallback(async (cardId) => {
    try {
      if (!token) {
        alert("You must be logged in to delete cards.");
        return;
      }
  
      const response = await fetch(`/api/Yugioh/deleteCards`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Include the user's token
        },
        body: JSON.stringify({ cardId }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to delete card");
      }
  
      await fetchData(); // Refresh data after deletion
      setAggregatedData((currentData) =>
        currentData.filter((card) => card._id !== cardId)
      );
    } catch (error) {
      console.error("Error deleting card:", error);
    }
  }, [fetchData, token]);
  
  const onDeleteAllCards = useCallback(async () => {
    try {
      if (!token) {
        alert("You must be logged in to delete all cards.");
        return;
      }
  
      const response = await fetch(`/api/Yugioh/deleteAllCards`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Include the user's token
        },
      });
  
      if (!response.ok) {
        throw new Error("Failed to delete all cards");
      }
  
      await fetchData(); // Refresh data after deletion
      setAggregatedData([]);
    } catch (error) {
      console.error("Error deleting all cards:", error);
    }
  }, [fetchData, token]);

 // Paginate the data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return aggregatedData.slice(startIndex, startIndex + itemsPerPage);
  }, [aggregatedData, currentPage, itemsPerPage]);

  // Render a loading state while authentication is being checked
  if (!isAuthenticated || isLoading) {
    return (
      <div className="w-full text-center mt-10 text-xl text-white">
        Verifying authentication...
      </div>
    );
  }

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
       <button
            onClick={handleUpdatePrices}
            disabled={isUpdatingPrices}
            className={` bg-white text-black font-bold m-1 px-2 py-2 text-nowrap rounded-lg border border-zinc-400 hover:bg-black hover:text-white ${isUpdatingPrices ? 'bg-gray-500 cursor-not-allowed' : 'bg-primary hover:bg-primary/80'
              }`}
          >
            {isUpdatingPrices ? 'Updating Prices...' : 'Update Prices'}
          </button>

          {isUpdatingPrices && (
            <p className="text-sm text-white-600 mt-2">
              Prices are being updated. This may take a few minutes...
            </p>
          )}
          <button
          type="button"
          disabled={false}
          onClick={onDeleteAllCards}
          className="float-right inline-flex flex-wrap items-center px-2 py-2 m-1 rounded-lg bg-red-800 text-white hover:text-black hover:bg-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Delete All Cards
        </button>
       


      </div>
      <div className="flex flex-wrap gap-4 mb-6 glass max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setView('grid')}
            className={`inline-flex items-center px-2 py-2 rounded-lg transition-colors ${view === 'grid'
              ? 'bg-black text-white'
              : 'bg-white text-black hover:bg-black/80 hover:text-white/80'
              }`}
          >
            Grid View
          </button>
          <button
            onClick={() => setView('table')}
            className={`inline-flex items-center px-2 py-2 rounded-lg transition-colors ${view === 'table'
              ? 'bg-black text-white'
              : 'bg-white text-black hover:bg-black/80 hover:text-white/80'
              }`}
          >
            Table View
          </button>
        </div>

        <button
          onClick={toggleFilterMenu}
          className="inline-flex items-center px-2 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
        >

          {isFilterMenuOpen ? "Close Filter" : "Open Filter"}

        </button>

        <DownloadYugiohCSVButton
          type="button"
          aggregatedData={aggregatedData}
          userCardList={[]}
        />
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
          <div className="w-full mx-auto mb-24 h-fit">
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
