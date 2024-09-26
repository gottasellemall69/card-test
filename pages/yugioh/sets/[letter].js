// @/pages/sets/[letter].js
import Breadcrumb from '@/components/Navigation/Breadcrumb';
import { fetchCardData } from '@/utils/api';
import { organizeCardSets } from '@/utils/organizeCardSets';
import { SpeedInsights } from "@vercel/speed-insights/next";
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const SetsByLetterPage = () => {
  const [sets, setSets] = useState([]);
  const router = useRouter();
  const { letter } = router.query;

  useEffect(() => {
    const loadData = async () => {
      try {
        const cards = await fetchCardData(letter);
        const setsByLetter = organizeCardSets(cards);
        setSets(setsByLetter[letter] || []);
      } catch (error) {
        console.error('Error fetching card data:', error);
      }
    };

    if (letter) {
      loadData();
    }
  }, [letter]);

  return (
    <>
      <Breadcrumb />
      <div>
        <h1 className="my-10 text-xl font-black">Sets Starting with {letter}</h1>
        <div className="mx-5 flex-wrap grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 grid-flow-row">
          {sets.map((set, index) => (
            <div key={index} className="p-5 text-white font-medium leading-5 w-7xl">
              <Link className="w-fit hover:underline hover:font-semibold" rel="noopener noreferrer" href="/yugioh/sets/[letter]/cards/[setName]" as={`/yugioh/sets/${ letter }/cards/${ set.set_name }`}>{set.set_name}</Link>
            </div>
          ))}
        </div>
      </div>
      <SpeedInsights />
    </>
  );
};
export default SetsByLetterPage;
