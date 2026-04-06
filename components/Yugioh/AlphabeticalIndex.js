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
      <div className="mx-auto my-10 flex w-full max-w-7xl flex-col gap-6 px-2">
        <section className="rounded-3xl border border-white/15 bg-black/65 px-6 py-6 shadow-2xl shadow-black/40 backdrop-blur-md">
          <h1 className="text-center text-3xl font-semibold text-white sm:text-left">
            Alphabetical Index
          </h1>
          <p className="mt-3 max-w-2xl text-center text-base italic text-white/78 sm:text-left">
            Browse Yu-Gi-Oh! sets by opening letter and jump straight into each catalogue section.
          </p>
        </section>

        <nav
          aria-label="Browse sets by starting letter"
          className="flex flex-wrap place-content-center gap-2 rounded-3xl border border-white/15 bg-black/60 p-4 shadow-2xl shadow-black/35 backdrop-blur-sm md:text-nowrap"
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
                className={ `rounded-xl border px-3 py-2 leading-7 text-2xl font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                  isActive
                    ? 'border-white/30 bg-white/16 text-white shadow-lg shadow-black/20 underline'
                    : 'border-white/10 bg-black/35 text-white/85 no-underline hover:border-white/20 hover:bg-black/55'
                }` }
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
