'use client'
import React, {useEffect, useState, useCallback} from 'react'
import MyCollection from '@/components/MyCollection'
import CardFilter from '@/components/CardFilter'
import GridView from '@/components/GridView'
import DownloadYugiohCSVButton from '@/components/Buttons/DownloadYugiohCSVButton'


const MyCollectionPage=() => {
  const [aggregatedData, setAggregatedData]=useState([])
  const [filters, setFilters]=useState({
    rarity: [],
    condition: []
  })

  const [sortConfig, setSortConfig]=useState({
    key: [''],
    direction: ['']
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
      // Apply filters to the fetched data
      const filteredData=applyFilters(data)
      const sortedData=applySorting(filteredData)
      setAggregatedData(sortedData)
    }
    catch(error) {
      console.error('Error fetching aggregated data:', error)
    }
  }, [filters, sortConfig])

  useEffect(() => {
    fetchData()
  }, [fetchData]) // Refetch data when filters change

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

  const updateFilters=(filterType, values) => {
    setFilters({...filters, [filterType]: values})
  }

  const onSort=(key) => {
    let direction='ascending'
    if(sortConfig.key===key&&sortConfig.direction==='ascending') {
      direction='descending'
    }
    setSortConfig({key, direction})
  }

  const onUpdateCard=useCallback(async (cardId, field, value) => {
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
        method: 'PATCH',
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
          currentCard._id===cardId? {...currentCard, ...updatedCard, quantity: value}:currentCard
        ))
    }
    catch(error) {
      console.error('Error updating card:', error)
    }
  }, [])

  const handleDeleteCard=useCallback(async (cardId) => {
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
  }, [fetchData])

  const toggleView=() => {
    setView(view==='table'? 'grid':'table')
  }

  return (
    <>
      <CardFilter updateFilters={updateFilters} />
      <div className="p-6">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-transparent rounded-md border border-gray-100 p-6 shadow-md shadow-black/5">
            <div className="flex justify-between mb-6">
              <div>
                <div className="flex items-center mb-1">
                  <div className="text-2xl font-semibold">2</div>
                </div>
                <div className="text-sm font-medium text-gray-400">Users</div>
              </div>
            </div>
          </div>
          <div className="bg-transparent rounded-md border border-gray-100 p-6 shadow-md shadow-black/5">
            <div className="flex justify-between mb-4">
              <div>
                <div className="flex items-center mb-1">
                  <div className="text-2xl font-semibold">100</div>
                  <div className="p-1 rounded bg-emerald-500/10 text-emerald-500 text-[12px] font-semibold leading-none ml-2">
                    +30%
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-400">Companies</div>
              </div>
            </div>
          </div>
          <div className="bg-transparent rounded-md border border-gray-100 p-6 shadow-md shadow-black/5">
            <div className="flex justify-between mb-6">
              <div>
                <div className="text-2xl font-semibold mb-1">100</div>
                <div className="text-sm font-medium text-gray-400">Blogs</div>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="p-6 relative flex flex-col min-w-0 mb-4 lg:mb-0 break-words bg-transparent dark:bg-gray-800 w-full shadow-lg rounded">
            <div className="rounded-t mb-0 px-0 border-0">
              <div className="flex flex-wrap items-center px-4 py-2">
                <div className="relative w-full max-w-full flex-grow flex-1">
                  <h3 className="font-semibold text-base text-gray-900 dark:text-gray-50">
                    Users
                  </h3>
                </div>
              </div>
              <div className="block w-full overflow-x-auto">
                <table className="items-center w-full bg-transparent border-collapse">
                  <thead>
                    <tr>
                      <th className="px-4 bg-transparent dark:bg-gray-600 text-gray-500 dark:text-gray-100 align-middle border border-solid border-gray-200 dark:border-gray-500 py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                        Role
                      </th>
                      <th className="px-4 bg-transparent dark:bg-gray-600 text-gray-500 dark:text-gray-100 align-middle border border-solid border-gray-200 dark:border-gray-500 py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                        Amount
                      </th>
                      <th className="px-4 bg-transparent dark:bg-gray-600 text-gray-500 dark:text-gray-100 align-middle border border-solid border-gray-200 dark:border-gray-500 py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left min-w-140-px">
                        Completion
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="text-gray-700 dark:text-gray-100">
                      <th className="border-t-0 px-4 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 text-left">
                        Administrator
                      </th>
                      <td className="border-t-0 px-4 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                        1
                      </td>
                      <td className="border-t-0 px-4 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                        <div className="flex items-center">
                          <span className="mr-2">70%</span>
                          <div className="relative w-full">
                            <div className="overflow-hidden h-2 text-xs flex rounded bg-blue-200">
                              <div
                                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600"
                                style={{width: "70%"}} />
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr className="text-gray-700 dark:text-gray-100">
                      <th className="border-t-0 px-4 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 text-left">
                        User
                      </th>
                      <td className="border-t-0 px-4 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                        6
                      </td>
                      <td className="border-t-0 px-4 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                        <div className="flex items-center">
                          <span className="mr-2">40%</span>
                          <div className="relative w-full">
                            <div className="overflow-hidden h-2 text-xs flex rounded bg-blue-200">
                              <div
                                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                                style={{width: "40%"}} />
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr className="text-gray-700 dark:text-gray-100">
                      <th className="border-t-0 px-4 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 text-left">
                        User
                      </th>
                      <td className="border-t-0 px-4 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                        5
                      </td>
                      <td className="border-t-0 px-4 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                        <div className="flex items-center">
                          <span className="mr-2">45%</span>
                          <div className="relative w-full">
                            <div className="overflow-hidden h-2 text-xs flex rounded bg-pink-200">
                              <div
                                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-pink-500"
                                style={{width: "45%"}} />
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr className="text-gray-700 dark:text-gray-100">
                      <th className="border-t-0 px-4 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 text-left">
                        User
                      </th>
                      <td className="border-t-0 px-4 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                        4
                      </td>
                      <td className="border-t-0 px-4 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                        <div className="flex items-center">
                          <span className="mr-2">60%</span>
                          <div className="relative w-full">
                            <div className="overflow-hidden h-2 text-xs flex rounded bg-red-200">
                              <div
                                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-500"
                                style={{width: "60%"}} />
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="bg-transparent border border-gray-100 shadow-md shadow-black/5 p-6 rounded-md">
            <div className="flex justify-between mb-4 items-start">
              <div className="font-medium">Activities</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-fit min-w-[540px]">
                <tbody>
                  <tr>
                    <td className="py-2 px-4 border-b border-b-gray-50">
                      <div className="flex items-center">
                        <a
                          className="text-gray-600 text-sm font-medium hover:text-blue-500 ml-2 truncate"
                          href="#"
                        >
                          Lorem Ipsum
                        </a>
                      </div>
                    </td>
                    <td className="py-2 px-4 border-b border-b-gray-50">
                      <span className="text-[13px] font-medium text-gray-400">
                        02-02-2024
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b border-b-gray-50">
                      <span className="text-[13px] font-medium text-gray-400">
                        17.45
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b border-b-gray-50">
                      <div className="dropdown">
                        <button
                          className="dropdown-toggle text-gray-400 hover:text-gray-600 text-sm w-6 h-6 rounded flex items-center justify-center bg-gray-50"
                          type="button"
                        >
                          <i className="ri-more-2-fill" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 border-b border-b-gray-50">
                      <div className="flex items-center">
                        <a
                          className="text-gray-600 text-sm font-medium hover:text-blue-500 ml-2 truncate"
                          href="#"
                        >
                          Lorem Ipsum
                        </a>
                      </div>
                    </td>
                    <td className="py-2 px-4 border-b border-b-gray-50">
                      <span className="text-[13px] font-medium text-gray-400">
                        02-02-2024
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b border-b-gray-50">
                      <span className="text-[13px] font-medium text-gray-400">
                        17.45
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b border-b-gray-50">
                      <div className="dropdown">
                        <button
                          className="dropdown-toggle text-gray-400 hover:text-gray-600 text-sm w-6 h-6 rounded flex items-center justify-center bg-gray-50"
                          type="button"
                        >
                          <i className="ri-more-2-fill" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="mx-auto w-full grid grid-cols-1 gap-6 mb-6">
          <div className="bg-transparent w-full border border-gray-100 shadow-md shadow-black/5 rounded-md">
            <div className="inline-flex mx-auto mb-4">
              <h3 className="font-black p-6 text-xl">Collection</h3>
              <button
                onClick={toggleView}
                className="relative float-start bg-white text-black font-bold m-1 px-2 py-1 rounded border border-zinc-400 hover:bg-black hover:text-white"
              >
                {view==='grid'? 'Switch to Table View':'Switch to Grid View'}
              </button>
              <DownloadYugiohCSVButton
                aggregatedData={aggregatedData}
                userCardList={[]}
              />
            </div>

            <div className="overflow-x-hidden mx-auto">
              {view==='grid'? (
                <GridView
                  aggregatedData={aggregatedData}
                  onDeleteCard={handleDeleteCard}
                  onUpdateCard={onUpdateCard}
                  setAggregatedData={setAggregatedData} />
              ):(
                <MyCollection
                  aggregatedData={aggregatedData}
                  onDeleteCard={handleDeleteCard}
                  onUpdateCard={onUpdateCard}
                  onSort={onSort}
                  sortConfig={sortConfig}
                  setAggregatedData={setAggregatedData} />
              )}</div>
          </div>
        </div>
      </div>
    </>
  )
}

export default MyCollectionPage
