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

  const onUpdateCard=async (cardId, field, value) => {
    if(!cardId||!['quantity', 'printing', 'condition'].includes(field)) {
      console.error('Invalid cardId or field:', cardId)
      return
    }

    const updateData={
      cardId, // Include cardId in the updateData
      [field]: value,
    }

    try {
      const response=await fetch(`/api/updateCards`, { // Include cardId in the URL
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

      // Update the local state
      setAggregatedData(currentData =>
        currentData.map(currentCard =>
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
    <div className="backdrop w-full">
      <MyCollection aggregatedData={aggregatedData} onDeleteCard={handleDeleteCard} onUpdateCard={onUpdateCard} setAggregatedData={setAggregatedData} />
    </div>
  )
}

export default MyCollectionPage
