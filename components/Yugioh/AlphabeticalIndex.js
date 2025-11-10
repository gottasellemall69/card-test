"use client";
import Link from 'next/link';
import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { SpeedInsights } from "@vercel/speed-insights/next";

const ALPHABET = '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const AlphabeticalIndex = () => {
  const router = useRouter();
  const activeLetter = Array.isArray( router.query?.letter )
    ? router.query.letter[ 0 ]
    : router.query?.letter ?? '';

  const letters = useMemo( () => ALPHABET.split( '' ), [] );

  return (
    <>
      <div className="w-full inline-block flex-col sm:flex-row my-10 m-2 mx-auto justify-between">
        <span className="columns-2 p-2 mx-auto max-w-7xl">
          <h1 className="text-2xl text-shadow text-center sm:text-left font-semibold mb-4 sm:text-nowrap sm:block">
            Alphabetical Index
          </h1>
          <p className="text-base text-center sm:text-left text-gray-300 italic text-pretty sm:text-nowrap sm:inline sm:mx-auto">
            Browse Yu-Gi-Oh! sets by letter...
          </p>
        </span>

        <nav
          aria-label="Browse sets by starting letter"
          className="mx-auto mt-5 max-w-7xl text-pretty text-shadow flex flex-wrap gap-2 place-content-center md:text-nowrap"
        >
          { letters.map( ( letter ) => {
            const isActive = letter === activeLetter;
            return (
              <Link
                key={ letter }
                href={ {
                  pathname: '/yugioh/sets/[...letter]',
                  query: { letter },
                } }
                prefetch={ false }
                aria-current={ isActive ? 'page' : undefined }
                className={`mx-auto rounded px-3 py-2 leading-7 text-2xl font-bold transition hover:bg-stone-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${ isActive ? 'bg-white/10 text-white underline' : 'text-white/80 no-underline' }`}
              >
                { letter }
              </Link>
            );
          } ) }
        </nav>
      </div>
      <SpeedInsights />
    </>
  );
};

export default AlphabeticalIndex;
