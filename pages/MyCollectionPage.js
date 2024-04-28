import React, {useEffect, useState} from 'react'
import MyCollection from '@/components/MyCollection'

const MyCollectionPage=() => {
  const [aggregatedData, setAggregatedData]=useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData=async () => {
    try {
      const response=await fetch('/api/my-collection')
      if(!response.ok) {
        throw new Error('Failed to fetch aggregated data')
      }
      const data=await response.json()
      setAggregatedData(data)
    } catch(error) {
      console.error('Error fetching aggregated data:', error)
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
    <div className="backdrop w-full">
      <MyCollection aggregatedData={aggregatedData} onDeleteCard={handleDeleteCard} />
    </div>
  )
}

export default MyCollectionPage
