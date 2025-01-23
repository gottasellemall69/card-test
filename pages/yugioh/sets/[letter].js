"use client"
import Breadcrumb from '@/components/Navigation/Breadcrumb';
import { fetchCardData } from '@/utils/api';
import { organizeCardSets } from '@/utils/organizeCardSets';
import { SpeedInsights } from "@vercel/speed-insights/next";
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';

const SetsByLetterPage = () => {
  const [sets, setSets] = useState([]);
  const router = useRouter();
  const { letter } = router.query;

  // Memoize fetch function to avoid re-creating it on each render
  const loadData = useCallback(async () => {
    if (!letter) return;
    try {
      const cards = await fetchCardData(letter);
      const setsByLetter = organizeCardSets(cards);
      setSets(setsByLetter[letter] || []);
    } catch (error) {
      console.error('Error fetching card data:', error);
    }
  }, [letter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Memoize the sets to avoid re-calculating the set components on every render
  const memoizedSets = useMemo(() => {
    if (!sets || sets.length === 0) {
      return <p>Loading...</p>;
    }

    return sets.map((set, index) => (
      <div key={index} className="p-5 text-white font-medium leading-5 w-7xl">
        <Link
          className="w-fit hover:underline hover:font-semibold"
          rel="noopener noreferrer"
          href="/yugioh/sets/[letter]/cards/[setName]" passHref
          as={`/yugioh/sets/${ letter }/cards/${ set.set_name }`}>
          {set.set_name}
        </Link>
      </div>
    ));
  }, [sets, letter]);

  return (
    <>
      <Breadcrumb />
      <div>
        <h1 className="my-10 text-xl font-black">Sets Starting with {letter}</h1>
        <div className="mx-5 flex-wrap grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 grid-flow-row">
          {memoizedSets}
        </div>
      </div>
      <SpeedInsights></SpeedInsights>
    </>
  );
};

export default SetsByLetterPage;
