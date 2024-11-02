'use client';
// @/pages/sports/[...cardSet].js
import { fetchSportsData } from '@/pages/api/Sports/sportsData';
import { SpeedInsights } from "@vercel/speed-insights/next";
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useCallback, useMemo, useState } from 'react';

const SportsTable = dynamic(() => import('@/components/Sports/SportsTable.js'), { ssr: false });
export async function getStaticPaths() {
  const paths = [
    { params: { cardSet: ['1975 NBA Topps'] } },
    { params: { cardSet: ['1989 NBA Hoops'] } },
    { params: { cardSet: ['1990 NBA Hoops'] } },
    { params: { cardSet: ['1990 NBA Skybox'] } },
    { params: { cardSet: ['1990 NBA Fleer'] } },
    { params: { cardSet: ['1991 NBA Fleer'] } },
    { params: { cardSet: ['1991 NBA Hoops'] } },
    { params: { cardSet: ['1991 NBA Upper Deck'] } },
    { params: { cardSet: ['1991 NFL Fleer'] } },
    { params: { cardSet: ['1991 NFL Upper Deck'] } },
    { params: { cardSet: ['1991 NFL Pro Set'] } },
    { params: { cardSet: ['1991 NFL Proline Portraits'] } },
    { params: { cardSet: ['1991 NFL Wild Card College Draft Picks'] } },
    { params: { cardSet: ['1991 NFL Wild Card'] } },
    { params: { cardSet: ['1989 MLB Topps'] } },
    { params: { cardSet: ['1989 MLB SCORE'] } },
    { params: { cardSet: ['1989 MLB Donruss'] } },
    { params: { cardSet: ['1989 MLB Fleer'] } },
    { params: { cardSet: ['1991 MLB Donruss'] } },
    { params: { cardSet: ['1991 MLB SCORE'] } },
    { params: { cardSet: ['1991 MLB Fleer'] } },
  ];
  return { paths, fallback: true }; // Set fallback to true or 'blocking' if you intend to produce paths on-demand
}

export async function getStaticProps({ params }) {
  if (params.cardSet) {
    try {
      const sportsData = await fetchSportsData(params.cardSet);
      return {
        props: {
          sportsData,
        },
      };
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }
  return {
    props: {
      sportsData,
    },
  };
}

const SportsPage = () => {
  const [sportsData, setSportsData] = useState([{}]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [selectedCardSet, setSelectedCardSet] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 1;

  const fetchSportsData = useCallback(async (selectedCardSet, currentPage) => {
    try {
      const response = await fetch(
        `/api/Sports/sportsData?cardSet=${ selectedCardSet }&page=${ currentPage }`
      );
      if (response.ok) {
        const data = await response.json();
        setSportsData(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, []);

  useMemo(async () => {
    if (selectedCardSet.length > 0) { // Change condition to check for valid set
      await fetchSportsData(selectedCardSet, currentPage);
      setDataLoaded(true);
    }
  }, [selectedCardSet, currentPage]);

  return (
    <>
      <Head>
        <title>Sports Card Prices</title>
        <meta name="description" content="Enter list of TCG cards, get data back" />
        <meta name="keywords" content="javascript,nextjs,price-tracker,trading-card-game,tailwindcss" />
        <meta name="charset" content="UTF-8" />
      </Head>
      <h1 className="text-4xl font-bold mb-4 p-2 text-center md:text-left">Sports Card Prices</h1>
      <p className='text-center md:text-left text-base text-white p-2'>Select from the list of sets found in the dropdown below to view current prices for a card:</p>
      <p className='text-center md:text-left text-sm italic text-white p-2'>
        All prices are supplied by:
        <a
          href="https://www.sportscardspro.com"
          title='https://www.sportscardspro.com'
          className='underline hover:cursor-pointer'>
          https://www.sportscardspro.com
        </a>
      </p>
      <div className="mx-auto container content-center place-items-center w-full max-w-7xl">
        <SportsTable
          sportsData={sportsData}
          dataLoaded={dataLoaded}
          selectedCardSet={selectedCardSet}
          setSelectedCardSet={(set) => {
            setSelectedCardSet(set);
            setCurrentPage(1); // Reset to first page when set changes
          }}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          pageSize={pageSize}
        />
      </div>
      <SpeedInsights></SpeedInsights>
    </>
  );
};
export default SportsPage;
