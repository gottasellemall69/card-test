"use client";
import AlphabeticalIndex from '@/components/Yugioh/AlphabeticalIndex';
import { SpeedInsights } from "@vercel/speed-insights/next";
export default function SetsPage() {
  return (
    <>
      <div className="mx-auto w-full yugioh-bg min-h-screen">
        <AlphabeticalIndex />
      </div>
      <SpeedInsights></SpeedInsights>
    </>
  );
};