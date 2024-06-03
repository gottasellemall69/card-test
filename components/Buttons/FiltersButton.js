import React, {useState} from 'react'
import CardFilter from '@/components/CardFilter'

const FiltersButton=({updateFilters}) => {
  const [isFilterMenuOpen, setIsFilterMenuOpen]=useState(false)

  const openFilterMenu=() => {
    setIsFilterMenuOpen(true)
  }

  const closeFilterMenu=() => {
    setIsFilterMenuOpen(false)
  }

  return (
    <>
      <button id="filterBtn" onClick={openFilterMenu}>Filter</button>
      {isFilterMenuOpen&&(
        <div id="filterMenu">
          <button id="closeFilterBtn" onClick={closeFilterMenu}>Close</button>
          <CardFilter updateFilters={updateFilters} />
        </div>
      )}
    </>
  )
}

export default FiltersButton
