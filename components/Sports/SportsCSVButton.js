'use client';
// @/components/Sports/SportsCSVButton.js
import React from 'react';

const SportsCSVButton=({sportsData}) => {
  const downloadCSV=() => {
    const csvHeader="Name,Set,Ungraded,PSA 9,PSA 10";
    const csvData=sportsData.flatMap((item) =>
      item.products.map((product) => {
        const productName=product["productName"]||'';
        const consoleUri=product["consoleUri"]||'';
        const price1=product["price1"]||'';
        const price3=product["price3"]||'';
        const price2=product["price2"]||'';

        return `"${productName}",${consoleUri},"${price1}","${price3}","${price2}"`;
      })
    ).join("\n");

    const csvContent=`${csvHeader}\n${csvData}`;
    const element=document.createElement('a');
    const file=new Blob([csvContent],{type: 'text/csv'});
    element.href=URL.createObjectURL(file);
    element.download='sports_data.csv';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    sportsData&&sportsData.length>0&&(
      <button
        name="SportsCSVButton"
        className="bg-white border border-zinc-500 font-bold px-2 py-1 m-1 mx-auto rounded cursor-pointer text-black hover:bg-black hover:text-white"
        onClick={downloadCSV}
      >
        Download CSV
      </button>
    )
  );
};

export default SportsCSVButton;