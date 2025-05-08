"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

import Breadcrumb from "@/components/Navigation/Breadcrumb";
import { fetchCardData } from "@/utils/api";
import { organizeCardSets } from "@/utils/organizeCardSets";
import { SpeedInsights } from "@vercel/speed-insights/next";

const SetsByLetterPage = () => {
  const [ sets, setSets ] = useState( [] );
  const router = useRouter();
  const { letter } = router.query;

  const loadData = useCallback( async () => {
    if ( !letter ) return;
    try {
      const cards = await fetchCardData( letter );
      const setsByLetter = organizeCardSets( cards );
      setSets( setsByLetter[ letter ] || [] );
    } catch ( error ) {
      console.error( "Error fetching card data:", error );
    }
  }, [ letter ] );

  useEffect( () => {
    loadData();
  }, [ loadData ] );

  const memoizedSets = useMemo( () => {
    if ( !sets || sets.length === 0 ) {
      return <p className="text-white">Loading...</p>;
    }

    return sets.map( ( set, index ) => (
      <div key={ index } className="p-5 text-white font-medium leading-5 w-7xl">
        <Link
          className="w-fit hover:underline hover:font-semibold"
          href={ `/yugioh/sets/${ encodeURIComponent( letter ) }/${ encodeURIComponent( set.set_name ) }` }
        >
          { set.set_name }
        </Link>
      </div>
    ) );
  }, [ sets, letter ] );

  return (
    <>
      <Breadcrumb />
      <div>
        <h1 className="my-10 text-xl font-black text-shadow">
          Sets Starting with { letter }
        </h1>
        <div className="mx-5 flex-wrap grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 grid-flow-row">
          { memoizedSets }
        </div>
      </div>
      <SpeedInsights />
    </>
  );
};

export default SetsByLetterPage;
