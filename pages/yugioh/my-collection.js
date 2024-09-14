'use client';
import DownloadYugiohCSVButton from "@/components/Yugioh/Buttons/DownloadYugiohCSVButton";
import CardFilter from "@/components/Yugioh/CardFilter";
import GridView from "@/components/Yugioh/GridView";
import TableView from "@/components/Yugioh/TableView";
import YugiohPagination from "@/components/Yugioh/YugiohPagination";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Head from "next/head";
import { useCallback, useEffect, useState } from "react";

const MyCollectionPage = () => {
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
  const [subtotalMarketPrice, setSubtotalMarketPrice] = useState([]);
  const [totalCardCount, setTotalCardCount] = useState([]);

  useEffect(() => {
    if (Array.isArray(aggregatedData)) {
      const subtotal = aggregatedData.reduce(
        (sum, card) => sum + card.marketPrice * card.quantity,
        0
      );
      setSubtotalMarketPrice(subtotal.toFixed(2));
    }
  }, [aggregatedData]);

  useEffect(() => {
    const fetchCardData = async () => {
      try {
        const response = await fetch('/api/Yugioh/countCards');
        const data = await response.json();
        setTotalCardCount(data.totalQuantity);
        setSubtotalMarketPrice(data.totalMarketPrice);
      } catch (error) {
        console.error("Error fetching card data:", error);
      }
    };
    fetchCardData();
  }, []); // should run only once on component mount

  const toggleFilterMenu = () => {
    setIsFilterMenuOpen(!isFilterMenuOpen);
  };

  const fetchData = useCallback(async () => {
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
    }
    finally {
      setIsLoading(false);
    }
  }, [filters, sortConfig]);

  useEffect(() => {
    fetchData();
    if (isLoading) {
      return <div>Loading...</div>;
    }

    if (error) {
      return <div>{error}</div>;
    }

    if (!fetchData) {
      return <div>Cards not found</div>;
    }

  }, [fetchData]);

  const applyFilters = (data) => {
    if (filters.rarity.length === 0 && filters.condition.length === 0) {
      return data;
    }
    return data.filter((card) => {
      return (
        (filters.rarity.length === 0 || filters.rarity.includes(card.rarity)) &&
        (filters.condition.length === 0 ||
          filters.condition.includes(card.condition))
      );
    });
  };

  const handleFilterChange = (filterName, selectedOptions) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [filterName]: selectedOptions,
    }));
    setCurrentPage(1);
  };

  const applySorting = (data) => {
    if (!sortConfig.key) {
      return data;
    }
    const sortedData = [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "ascending" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "ascending" ? 1 : -1;
      }
      return 0;
    });
    return sortedData;
  };

  const handleSortChange = (sortKey) => {
    setSortConfig((prevSortConfig) => ({
      key: sortKey,
      direction:
        prevSortConfig.key === sortKey &&
          prevSortConfig.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
  };




  const onUpdateCard = useCallback(
    async (cardId, field, value) => {
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

  const onDeleteCard = useCallback(
    async (cardId) => {
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
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = aggregatedData.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handlePageClick = (page) => {
    setCurrentPage(page);
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

      <div className="w-full mx-auto mt-8">
        <h1 className="text-3xl font-semibold mb-6">My Collection</h1>
        <p className="max-w-prose italic text-sm text-white mb-5">
          You can click on the number of the quantity field below the card image
          to manually update it, and clicking the delete button underneath the
          card will decrease the quantity by 1, or if there is only one card,
          will remove the card from the collection.
          <br />
          Hover over or tap the card image to view the details of the card.
        </p>
        <div className="flex flex-col sm:flex-row w-fit mx-auto sm:mx-0 sm:gap-10 align-baseline">
          <div className="float-left">
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
          <div className="text-xl font-semibold p-2">
            Total Collection Value: ${subtotalMarketPrice}
          </div>
          <div className="text-xl font-semibold p-2">
            Cards in Collection: {totalCardCount}
          </div>
        </div>
        {isFilterMenuOpen && <CardFilter updateFilters={handleFilterChange} />}
        {view === "grid" ? (
          <>
            <GridView
              aggregatedData={paginatedData}
              onDeleteCard={onDeleteCard}
              onUpdateCard={onUpdateCard}
              setAggregatedData={setAggregatedData}
            />
            <YugiohPagination
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              totalItems={aggregatedData.length}
              handlePageClick={handlePageClick}
            />
          </>
        ) : (
          <TableView
            aggregatedData={aggregatedData}
            onDeleteCard={onDeleteCard}
          />
        )}
        <SpeedInsights />
      </div>
    </>
  );
};

export default MyCollectionPage;
