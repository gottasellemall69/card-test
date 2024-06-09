import React, {useEffect, useState, useMemo} from 'react'
import CardSetButtons from '@/components/Sports/CardSetButtons'
import SportsCSVButton from '@/components/Sports/SportsCSVButton'
import SportsPagination from '@/components/Sports/SportsPagination'
import {useRouter} from 'next/router'

const SportsTable=() => {
  const [sportsData, setSportsData]=useState(null)
  const [dataLoaded, setDataLoaded]=useState(false)
  const [selectedCardSet, setSelectedCardSet]=useState(null)
  const [currentPage, setCurrentPage]=useState(1)
  const pageSize=1

  const calculateTotalPages=(totalData, pageSize) => {
    return Math.ceil(totalData/pageSize)
  }

  const fetchSportsData=async (selectedCardSet, currentPage) => {
    try {
      const response=await fetch(
        `/api/Sports/sportsData?cardSet=${ selectedCardSet }&page=${ currentPage }`
      )
      if(response.ok) {
        const data=await response.json()
        setSportsData(data)
      }
    } catch(error) {
      console.error('Error fetching data:', error)
    }
  }

  useEffect(() => {
    if(selectedCardSet) {
      fetchSportsData(selectedCardSet, currentPage)
      setDataLoaded(true)
    }
  }, [selectedCardSet, currentPage])

  const memoizedCardSets=useMemo(() => [
    '1975 NBA Topps',
    '1989 NBA Hoops',
    '1990 NBA Hoops',
    '1990 NBA Skybox',
    '1990 NBA Fleer',
    '1991 NBA Fleer',
    '1990 NFL Pro Set',
    '1991 NFL Pro Set',
    '1991 NFL Proline Portraits',
    '1991 NFL Wild Card',
    '1991 NFL Wild Card College Draft Picks',
    '1989 MLB Topps',
    '1989 MLB Donruss',
    '1991 MLB Fleer',
  ], [])

  const totalData=sportsData?.length
  const totalPages=calculateTotalPages(totalData, pageSize)
  const startIndex=(currentPage-1)*pageSize
  const cardsToRender=sportsData?.slice(startIndex, startIndex+pageSize)

  const onPageChange=(page) => {
    setCurrentPage(page)
  }

  return (
    <>
      <div className="items-center p-2 overflow-x-hidden text-nowrap space-y-5 sm:space-y-0 space-x-0 sm:space-x-10 flex flex-wrap flex-col sm:flex-row sm:flex-nowrap">
        <div className="w-fit my-2 float-left text-black font-black">
          <CardSetButtons cardSets={memoizedCardSets} onSelectCardSet={setSelectedCardSet} />
        </div>
        <div className="w-fit my-2 float-right">
          <SportsCSVButton sportsData={sportsData} />
        </div>
      </div>

      <table className="mx-auto mb-2 w-full " style={{maxHeight: '300px', overflowY: 'auto'}}>
        <thead>
          <tr>
            <th scope="col" className="sticky top-0 p-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white backdrop-blur backdrop-filter whitespace-nowrap">
              Name
            </th>
            <th scope="col" className="hidden sticky top-0 p-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white backdrop-blur backdrop-filter whitespace-nowrap">
              Set
            </th>
            <th scope="col" className="sticky top-0 p-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white backdrop-blur backdrop-filter whitespace-nowrap">
              Ungraded
            </th>
            <th scope="col" className="sticky top-0 p-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white backdrop-blur backdrop-filter whitespace-nowrap table-cell">
              PSA 9
            </th>
            <th scope="col" className="sticky top-0 p-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white backdrop-blur backdrop-filter whitespace-nowrap table-cell">
              PSA 10
            </th>
          </tr>
        </thead>
        <tbody className="mx-auto overflow-x-hidden">
          {cardsToRender?.map((item, index) =>
            item.products.map((product, productIndex) => (
              <tr key={`${ index }-${ productIndex }`}>
                <td scope="row" className="border border-gray-800 p-1 whitespace-wrap text-center sm:text-left text-sm font-medium text-white">
                  {product['productName']}
                </td>
                <td scope="row" className="hidden border border-gray-800 p-1 whitespace-nowrap text-center sm:text-left text-sm text-white">
                  {product['consoleUri']}
                </td>
                <td scope="row" className="border border-gray-800 p-1 whitespace-nowrap text-center sm:text-left text-sm text-white">
                  {product['price1']}
                </td>
                <td scope="row" className="border border-gray-800 p-1 whitespace-nowrap text-center sm:text-left text-sm text-white">
                  {product['price3']}
                </td>
                <td scope="row" className="border border-gray-800 p-1 whitespace-nowrap text-center sm:text-left text-sm font-medium table-cell">
                  {product['price2']}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {dataLoaded&&(
        <div className="mx-auto container w-fit">
          <SportsPagination
            pageSize={pageSize}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            calculateTotalPages={calculateTotalPages}
          />
        </div>
      )}
    </>
  )
}

export default SportsTable
