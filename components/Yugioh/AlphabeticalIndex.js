import Link from 'next/link';
import { SpeedInsights } from "@vercel/speed-insights/next";

const AlphabeticalIndex = () => {

  const alphabet = '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  return (
    <>
      <div className="w-full inline-block flex-col sm:flex-row my-10 m-2 mx-auto justify-between">
        <span className="columns-2 p-2 mx-auto">
          <h1 className="text-2xl font-semibold mb-4 sm:text-nowrap sm:block">Alphabetical Index</h1>
          <p className="text-base text-gray-300 italic text-pretty sm:text-nowrap sm:inline sm:mx-auto">Browse Yu-Gi-Oh! sets by letter...</p>
        </span>

        <div className="mt-5 flex flex-wrap gap-2 place-content-center md:text-nowrap">

          { alphabet.split( '' ).map( ( letter ) => (
            <Link
              href={ encodeURI( `/yugioh/sets/[...letter]` ) }
              as={ `/yugioh/sets/${ encodeURIComponent( letter ) }` }
              key={ letter }
              passHref
            >
              <div className="mx-auto p-2 leading-7 text-3xl font-bold no-underline hover:underline hover:bg-stone-600">{ letter }</div>
            </Link>
          ) ) }
        </div>
      </div >
      <SpeedInsights></SpeedInsights>
    </>
  );
};

export default AlphabeticalIndex;
