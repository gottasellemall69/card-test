"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import useSWR from "swr";
import Breadcrumb from '@/components/Navigation/Breadcrumb';
import PriceHistoryChart from "@/components/Yugioh/PriceHistoryChart";

const fetcher = async ( url ) => {
  const res = await fetch( url );
  if ( !res.ok ) throw new Error( "Failed to fetch data" );
  return res.json();
};

const CardDetails = () => {
  const router = useRouter();
  const { card, letter, setName } = router.query;
  const [ selectedSet, setSelectedSet ] = useState( "" );

  // Fetch card details
  const { data: cardData, error: cardError } = useSWR(
    card ? `/api/Yugioh/card/${ encodeURIComponent( card ) }` : null,
    fetcher
  );

  // Fetch price history for selected set
  const { data: priceHistoryData, error: priceError } = useSWR(
    card && selectedSet
      ? `/api/Yugioh/card/${ encodeURIComponent( card ) }/price-history?set=${ encodeURIComponent( selectedSet ) }`
      : null,
    fetcher
  );

  useEffect( () => {
    if ( cardData?.card_sets?.length > 0 ) {
      setSelectedSet( cardData.card_sets[ 0 ]?.set_code );
    }
  }, [ cardData ] );

  if ( cardError ) return <div>Error loading card data.</div>;
  if ( !cardData ) return <div>Loading...</div>;

  return (
    <div>
      <div>
        <Breadcrumb>
          <Link href="/yugioh">Alphabetical Index</Link>
          <Link href={ `/yugioh/${ letter }/sets` }>Sets by Letter: { letter }</Link>
          <Link href={ `/yugioh/sets/${ letter }/cards/${ setName }` }>Cards in Set: { setName }</Link>
          <div><p><span className="text-black">Card Details: { cardData.name }</span></p></div>
        </Breadcrumb>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
        <div className="p-6 text-white rounded-md shadow-md glass text-shadow">
          <h1 className="text-2xl font-bold mb-4">{ cardData.name }</h1>
          <p><strong>Type:</strong> { cardData.type }</p>
          <p><strong>Description:</strong> { cardData.desc }</p>
          <p><strong>Race:</strong> { cardData.race }</p>
          <p><strong>Archetype:</strong> { cardData.archetype || "N/A" }</p>

          {/* 🔹 Display All Sets and Prices */ }
          <div className="mt-4 hidden">
            <h2 className="text-lg font-bold">Available Sets</h2>
            <ul className="list-disc pl-5">
              { cardData.card_sets?.map( ( set ) => (
                <li key={ `${ set.set_code }-${ set.set_edition }` }>
                  <span className="font-semibold">{ set.set_name }</span> ({ set.set_code } - { set.set_edition }) -:
                  <span className="ml-2 text-green-400">${ set.set_price || "N/A" }</span>
                </li>
              ) ) }
            </ul>
          </div>

          {/* 🔹 Set Selector */ }
          <div className="mt-4">
            <label className="font-bold">Select Set:</label>
            <select
              className="ml-2 p-2 bg-gray-800 text-white border rounded w-full max-w-fit"
              value={ selectedSet }
              onChange={ ( e ) => setSelectedSet( e.target.value ) }
            >
              { cardData.card_sets.map( ( set ) => (
                <option key={ `${ set.set_code }-${ set.set_edition }` } value={ set.set_code }>
                  { set.set_name } ({ set.set_code } - { set.set_edition })
                </option>
              ) ) }
            </select>
          </div>


        </div>
        {/* 🔹 Display the Price History Chart */ }
        <PriceHistoryChart className="place-content-center align-middle justify-stretch h-[55%]" priceHistory={ priceHistoryData?.priceHistory || [] } />
      </div>

    </div>

  );
};

export default CardDetails;
