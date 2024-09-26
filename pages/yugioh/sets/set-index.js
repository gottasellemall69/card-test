import AlphabeticalIndex from '@/components/Yugioh/AlphabeticalIndex';
import { SpeedInsights } from "@vercel/speed-insights/next";
export default function SetsPage() {
  return (
    <>
      <AlphabeticalIndex />
      <SpeedInsights />
    </>
  );
};