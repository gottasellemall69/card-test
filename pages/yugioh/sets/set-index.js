"use client";

import Head from "next/head";
import AlphabeticalIndex from '@/components/Yugioh/AlphabeticalIndex';
import { SpeedInsights } from "@vercel/speed-insights/next";
export default function SetsPage() {
  return (
    <>
      <Head>
        <title>Yu-Gi-Oh! Set Index</title>
        <meta name="description" content="Index of Yu-Gi-Oh! sets" />
        <meta name="keywords" content="javascript,nextjs,price-tracker,trading-card-game,tailwindcss" />
        <meta charSet="UTF-8" />
      </Head>
      <div className="p-2 mx-auto w-full yugioh-bg min-h-screen">
        <AlphabeticalIndex />
      </div>
      <SpeedInsights></SpeedInsights>
    </>
  );
};