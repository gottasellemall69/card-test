"use client"
import AlphabeticalIndex from 'D:/CSVParse/venv/env/card-test/components/Yugioh/AlphabeticalIndex';
import { SpeedInsights } from "@vercel/speed-insights/next";
export default function SetsPage() {
  return (
    <>
      <AlphabeticalIndex />
      <SpeedInsights></SpeedInsights>
    </>
  );
};