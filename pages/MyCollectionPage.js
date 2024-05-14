import React, {useEffect, useState, useCallback} from 'react'
import MyCollection from '@/components/MyCollection'
import CardFilter from '@/components/CardFilter'
import FiltersButton from '@/components/Buttons/FiltersButton'

const MyCollectionPage=() => {
  const [aggregatedData, setAggregatedData]=useState([])
  const [filters, setFilters]=useState({
    rarity: [],
    condition: []
  })
  const [isFilterMenuOpen, setIsFilterMenuOpen]=useState(false)

  useEffect(() => {
    fetchData()
  }, [filters]) // Refetch data when filters change

  const fetchData=useCallback(async () => {
    try {
      const response=await fetch('/api/my-collection')
      if(!response.ok) {
        throw new Error('Failed to fetch aggregated data')
      }
      const data=await response.json()

      // Apply filters to the fetched data
      const filteredData=applyFilters(data)

      setAggregatedData(filteredData)
    } catch(error) {
      console.error('Error fetching aggregated data:', error)
    }
  }, [filters])

  const toggleFilterMenu=() => {
    setIsFilterMenuOpen(!isFilterMenuOpen)
  }

  const applyFilters=(data) => {
    // If no filters are selected, return all data
    if(
      filters.rarity.length===0&&
      filters.condition.length===0
    ) {
      return data
    }

    // Apply filters to the fetched data
    return data.filter((card) => {
      // Check if the card matches all selected filters
      return (
        (filters.rarity.length===0||filters.rarity.includes(card.rarity))&&
        (filters.condition.length===0||filters.condition.includes(card.condition))
      )
    })
  }

  const updateFilters=(filterType, values) => {
    setFilters({...filters, [filterType]: values})
  }

  const onUpdateCard=async (cardId, field, value) => {
    if(!cardId||!['quantity', 'printing', 'condition'].includes(field)) {
      console.error('Invalid cardId or field:', cardId)
      return
    }

    const updateData={
      cardId,
      [field]: value,
    }

    try {
      const response=await fetch(`/api/updateCards`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if(!response.ok) {
        throw new Error('Failed to update card')
      }

      const updatedCard=await response.json()
      setAggregatedData((currentData) =>
        currentData.map((currentCard) =>
          currentCard._id===cardId? {...currentCard, ...updatedCard}:currentCard
        )
      )
    } catch(error) {
      console.error('Error updating card:', error)
    }
  }

  const handleDeleteCard=async (cardId) => {
    try {
      const response=await fetch('/api/deleteCards', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({cardIds: [cardId]}),
      })

      if(!response.ok) {
        throw new Error('Failed to delete card')
      }

      fetchData() // Refresh data after successful deletion
    } catch(error) {
      console.error('Error deleting card:', error)
    }
  }

  return (
    <>

      <CardFilter updateFilters={updateFilters} />
      {isFilterMenuOpen&&(
        <aside>
          <div
            id="filterMenu"
            className="fixed inset-y-0 right-0 z-50 w-72 px-4 py-6 bg-white shadow-lg will-change-transform transform translate-x-full transition-transform duration-300 ease-in-out"
          >
            <div className="flex justify-between items-center px-4 py-3 bg-blue-500 text-shadow text-white">
              <h2 className="text-lg font-bold">Filters</h2>
              <button
                id="closeFilterBtn"
                className="text-white hover:text-gray-200 focus:outline-none"
                onClick={toggleFilterMenu}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div id="filters-container">
              <div className="mb-4">
                <label htmlFor="rarity-filter" className="block font-black text-lg mt-5">
                  Rarity
                </label>
                <select id="rarity-filter" className="form-select w-full rounded-lg border-gray-300 px-4 py-2">
                  {/* Add options here */}
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="condition-filter" className="block font-black text-lg mt-5">
                  Condition
                </label>
                <select id="condition-filter" className="form-select w-full rounded-lg border-gray-300 px-4 py-2">
                  {/* Add options here */}
                </select>
              </div>
            </div>
          </div>
        </aside>
      )}

      <div className="backdrop w-full">
        <MyCollection
          aggregatedData={aggregatedData}
          onDeleteCard={handleDeleteCard}
          onUpdateCard={onUpdateCard}
          setAggregatedData={setAggregatedData}
        />
      </div>
    </>
  )
}

export default MyCollectionPage
