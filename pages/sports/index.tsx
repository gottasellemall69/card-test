"use client";
import React, { useState } from 'react';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useSportsData } from '@/hooks/useSportsData';
import SportsTable from '@/components/Sports/SportsTable';
import CardSetSelector from '@/components/Sports/CardSetSelector';
import Link from 'next/link';
import Head from 'next/head';
import { CARD_SETS } from '@/constants/cardSets';

export default function Home() {
  const [ selectedCardSet, setSelectedCardSet ] = useState( CARD_SETS[ 0 ] );
  const { isLoading, sportsData, dataLoaded, error } = useSportsData( selectedCardSet );

  const handleCardSetChange = ( cardSet: string ) => {
    setSelectedCardSet( cardSet );
  };

  return (
    <>
      <Head>
        <title>Sports Card Collection</title>
        <meta name="description" content="Browse and collect sports cards" />
      </Head>

      <div className="sports-bg mx-auto min-h-screen w-full text-white">
        <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
          <header className="rounded-3xl border border-white/10 bg-black/45 p-6 shadow-2xl backdrop-blur">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/50">Sports Cards</p>
                <h1 className="mt-4 text-4xl font-bold tracking-tight text-white lg:text-5xl">Sports Card Browser</h1>
                <p className="mt-4 text-base text-white/70">
                  Browse card prices by set, compare raw and graded values, and save the cards you want to track.
                </p>
              </div>
              <Link
                href="/sports/selected-cards"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/15"
              >
                View Collection
              </Link>
            </div>
          </header>

          <section className="mt-8 rounded-3xl border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <label className="block w-full max-w-xl text-sm font-semibold text-white/80">
                <span className="mb-2 block uppercase tracking-wide text-white/55">Card Set</span>
                <CardSetSelector
                  value={selectedCardSet}
                  onChange={handleCardSetChange}
                />
              </label>
              <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
                <span>{ selectedCardSet }</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70">
                  { isLoading ? 'Refreshing' : 'Ready' }
                </span>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            )}
          </section>

          <section className="mt-8">
            <SportsTable
              sportsData={sportsData}
              dataLoaded={dataLoaded}
              setSelectedCardSet={setSelectedCardSet}
              pageSize={50}
              isLoading={isLoading}
            />
          </section>
        </main>
      </div>
      <SpeedInsights></SpeedInsights>
    </>
  );
}
