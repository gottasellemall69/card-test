import React, {useEffect, useState, useCallback} from 'react'
import MyCollection from '@/components/MyCollection'
import CardFilter from '@/components/CardFilter'
import {MarketPriceProvider} from '@/context/MarketPriceContext'
import GridView from '@/components/GridView'
import DownloadYugiohCSVButton from '@/components/Buttons/DownloadYugiohCSVButton'

const MyCollectionPage=() => {
  const [aggregatedData, setAggregatedData]=useState([])
  const [filters, setFilters]=useState({
    rarity: [],
    condition: []
  })
  const [sortConfig, setSortConfig]=useState({
    key: '',
    direction: ''
  })
  const [view, setView]=useState('grid') // 'table' or 'grid'
  const [isFilterMenuOpen, setIsFilterMenuOpen]=useState(false)

  const toggleFilterMenu=() => {
    setIsFilterMenuOpen(!isFilterMenuOpen)
  }

  const fetchData=useCallback(async () => {
    try {
      const response=await fetch('/api/my-collection')
      if(!response.ok) {
        throw new Error('Failed to fetch aggregated data')
      }
      const data=await response.json()
      const filteredData=applyFilters(data)
      const sortedData=applySorting(filteredData)
      setAggregatedData(sortedData)
    } catch(error) {
      console.error('Error fetching aggregated data:', error)
    }
  }, [filters, sortConfig])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const applyFilters=(data) => {
    if(filters.rarity.length===0&&filters.condition.length===0) {
      return data
    }
    return data.filter((card) => {
      return (
        (filters.rarity.length===0||filters.rarity.includes(card.rarity))&&
        (filters.condition.length===0||filters.condition.includes(card.condition))
      )
    })
  }

  const applySorting=(data) => {
    if(!sortConfig.key) {
      return data
    }
    const sortedData=[...data].sort((a, b) => {
      if(a[sortConfig.key]<b[sortConfig.key]) {
        return sortConfig.direction==='ascending'? -1:1
      }
      if(a[sortConfig.key]>b[sortConfig.key]) {
        return sortConfig.direction==='ascending'? 1:-1
      }
      return 0
    })
    return sortedData
  }

  const handleFilterChange=(filterName, selectedOptions) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [filterName]: selectedOptions
    }))
  }

  const handleSortChange=(sortKey) => {
    setSortConfig((prevSortConfig) => ({
      key: sortKey,
      direction: prevSortConfig.key===sortKey&&prevSortConfig.direction==='ascending'? 'descending':'ascending'
    }))
  }

  const onUpdateCard=useCallback(async (cardId, field, value) => {
    try {
      if(cardId&&field&&value!==undefined&&value!==null) {
        const updateCard={cardId, field, value}
        const response=await fetch('/api/updateCards', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateCard),
        })
        if(!response.ok) {
          throw new Error('Failed to update card')
        }
        await fetchData()
        const updatedCard=await response.json()
        setAggregatedData(currentData =>
          currentData.map(card =>
            card._id===cardId? {...card, ...updatedCard}:card
          )
        )
      } else {
        throw new Error('Invalid cardId, field, or value')
      }
    } catch(error) {
      console.error('Error updating card:', error)
    }
  }, [fetchData])

  const onDeleteCard=useCallback(async (cardId) => {
    try {
      const response=await fetch(`/api/deleteCards`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({cardId: cardId}),
      })
      if(!response.ok) {
        throw new Error('Failed to delete card')
      }
      await fetchData()
      setAggregatedData(currentData =>
        currentData.filter(card => card._id!==cardId)
      )

      // Fetch updated data after deleting the card
    } catch(error) {
      console.error('Error deleting card:', error)
    }
  }, [fetchData])

  const onDeleteAllCards=async () => {
    try {
      const response=await fetch(`/api/deleteAllCards`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if(!response.ok) {
        throw new Error('Failed to delete all cards')
      }
      await fetchData()
      setAggregatedData([])
    } catch(error) {
      console.error('Error deleting all cards:', error)
    }
  }

  return (
    <div className="w-full mx-auto mt-8">
      <h1 className="text-3xl font-semibold mb-6">My Collection</h1>
      <div className="inline-flex flex-row w-full gap-10 align-baseline">
        <div className='float-left'>
          <button
            onClick={() => setView('grid')}
            className={`px-4 py-2 mr-2 ${ view==='grid'? 'my-2 text-sm border border-white rounded-lg px-2 py-2 mx-auto text-white font-bold hover:text-black hover:bg-white':'relative bg-white text-black font-bold m-1 px-2 py-1 rounded border border-zinc-400 hover:bg-black hover:text-white' }`}
          >
            Grid View
          </button>
          <button
            onClick={() => setView('table')}
            className={`px-4 py-2 ${ view==='table'? 'my-2 text-sm border border-white rounded-lg px-2 py-2 mx-auto text-white font-bold hover:text-black hover:bg-white':'relative bg-white text-black font-bold m-1 px-2 py-1 rounded border border-zinc-400 hover:bg-black hover:text-white' }`}
          >
            Table View
          </button>

        </div>

        <div className='float-right flex-wrap flex-row'>
          <button onClick={toggleFilterMenu} className="text-nowrap bg-white text-black font-bold m-1 px-2 py-1 rounded border border-zinc-400 hover:bg-black hover:text-white">
            {isFilterMenuOpen? 'Close Filter':'Open Filter'}
          </button>

          <DownloadYugiohCSVButton aggregatedData={aggregatedData} userCardList={[]} />

          <button onClick={onDeleteAllCards} className="hidden invisible my-2 text-sm border border-red-500 rounded-lg px-2 py-2 mx-auto text-red-500 font-bold hover:text-white hover:bg-red-500">
            Delete All Cards
          </button>
        </div>
      </div>
      {isFilterMenuOpen&&(
        <CardFilter updateFilters={handleFilterChange} />
      )}
      {view==='grid'? (
        <MarketPriceProvider>
          <GridView
            aggregatedData={aggregatedData}
            onDeleteCard={onDeleteCard}
            onUpdateCard={onUpdateCard}
            setAggregatedData={setAggregatedData}
          />
        </MarketPriceProvider>
      ):(
        <MyCollection aggregatedData={aggregatedData} />
      )}

    </div>
  )
}

export default MyCollectionPage
