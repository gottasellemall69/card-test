"use client";

import Head from "next/head";
import { SpeedInsights } from "@vercel/speed-insights/next";

import AlphabeticalIndex from "@/components/Yugioh/AlphabeticalIndex";

export default function SetsPage() {
  return (
    <>
      <Head>
        <title>Yu-Gi-Oh! Set Index</title>
        <meta name="description" content="Index of Yu-Gi-Oh! sets" />
        <meta name="keywords" content="javascript,nextjs,price-tracker,trading-card-game,tailwindcss" />
        <meta charSet="UTF-8" />
      </Head>
      <div className="yugioh-bg relative mx-auto min-h-screen w-full overflow-hidden p-2">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-black/50" />
        <div className="relative z-10">
          <AlphabeticalIndex />
        </div>
      </div>
      <SpeedInsights />
    </>
  );
}
