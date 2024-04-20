import React,{useEffect,useState} from 'react';
import MyCollection from '@/components/MyCollection';

const MyCollectionPage=() => {
  const [cards,setCards]=useState([]);

  useEffect(() => {
    const fetchData=async () => {
      try {
        const response=await fetch('/api/my-collection');
        if(!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const {cards}=await response.json();
        setCards(cards);
      } catch(error) {
        console.error('Error fetching data:',error);
      }
    };

    fetchData();
  },[]);

  return (
    <div className="bg-grayscale-950 backdrop text-shadow w-full min-h-screen">
      <div className="container mx-auto py-8">
        <MyCollection cards={cards} />
      </div>
    </div>
  );
};

export default MyCollectionPage;
