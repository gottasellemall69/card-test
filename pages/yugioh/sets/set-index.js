"use client";
import AlphabeticalIndex from '@/components/Yugioh/AlphabeticalIndex';
import { SpeedInsights } from "@vercel/speed-insights/next";
export default function SetsPage() {
  return (
    <>
      <div className="p-2 mx-auto w-full yugioh-bg h-screen">
        <AlphabeticalIndex />
      </div>
      <SpeedInsights></SpeedInsights>
    </>
  );
};