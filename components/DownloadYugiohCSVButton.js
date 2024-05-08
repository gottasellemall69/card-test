import React from 'react'

const DownloadYugiohCSVButton=({aggregatedData, userCardList}) => {
  const downloadCSV=() => {
    try {
      const csvHeader="Product Name,Set,Number,Printing,Rarity,Condition,Market Price"
      const csvData=aggregatedData?.map((card) => {
        const productName=card?.productName||''
        const userCard=userCardList.find((entry) =>
          entry.toLowerCase().includes(productName.toLowerCase())
        )

        const relevantCard=userCard&&card.card_sets?.find((set) =>
          userCard.toLowerCase().includes(set.set?.toLowerCase())&&
          userCard.toLowerCase().includes(set.number?.toLowerCase())&&
          userCard.toLowerCase().includes(set.printing?.toLowerCase())
        )

        return [
          `"${ productName }"`,
          `"${ relevantCard?.set||'' }"`,
          `"${ relevantCard?.number||'' }"`,
          `"${ relevantCard?.printing||'' }"`,
          `"${ relevantCard?.rarity||'' }"`,
          `"${ card.condition||'' }"`,
          `"${ card.marketPrice||'' }"`
        ].join(',')
      }).join("\n")

      const csvContent=`${ csvHeader }\n${ csvData }`
      const blob=new Blob([csvContent], {type: 'text/csv'})
      const url=URL.createObjectURL(blob)

      const element=document.createElement('a')
      element.href=url
      element.download='card_data.csv'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)

      URL.revokeObjectURL(url) // Clean up the URL object
    } catch(error) {
      console.error('Error generating CSV:', error)
    }
  }

  return (
    <button
      name="DownloadCSVButton"
      className="relative float-right bg-white text-black font-bold m-1 px-2 py-1 rounded border border-zinc-400 hover:bg-black hover:text-white"
      onClick={downloadCSV}
    >
      Download CSV
    </button>
  )
}

export default DownloadYugiohCSVButton
