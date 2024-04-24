// MyCollectionPage.js
import React,{useEffect,useState} from 'react';
import MyCollection from '@/components/MyCollection';

const MyCollectionPage=() => {
  const [aggregatedData,setAggregatedData]=useState([]);

  useEffect(() => {
    const fetchData=async () => {
      try {
        const response=await fetch('/api/aggregation');
        if(!response.ok) {
          throw new Error('Failed to fetch aggregated data');
        }
        const data=await response.json();
        setAggregatedData(data);
      } catch(error) {
        console.error('Error fetching aggregated data:',error);
      }
    };

    fetchData();
  },[]);

  return (
    <div className="backdrop w-full">
      <MyCollection aggregatedData={aggregatedData} />
    </div>
  );
};

export default MyCollectionPage;
