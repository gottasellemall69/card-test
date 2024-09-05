// @/pages/SportsPage.page.js
import { fetchSportsData } from '@/pages/api/Sports/sportsData';
import { SpeedInsights } from "@vercel/speed-insights/next";
import dynamic from 'next/dynamic';
import Head from 'next/head';

const SportsTable = dynamic(() => import('@/components/Sports/SportsTable.js'), { ssr: true });
export async function getStaticPaths() {
  const paths = [
    { params: { cardSet: '1975 NBA Topps' } },
    { params: { cardSet: '1989 NBA Hoops' } },
    { params: { cardSet: '1990 NBA Hoops' } },
    { params: { cardSet: '1990 NBA Skybox' } },
    { params: { cardSet: '1990 NBA Fleer' } },
    { params: { cardSet: '1991 NBA Fleer' } },
    { params: { cardSet: '1991 NBA Hoops' } },
    { params: { cardSet: '1991 NBA Upper Deck' } },
    { params: { cardSet: '1991 NFL Fleer' } },
    { params: { cardSet: '1991 NFL Upper Deck' } },
    { params: { cardSet: '1991 NFL Pro Set' } },
    { params: { cardSet: '1991 NFL Proline Portraits' } },
    { params: { cardSet: '1991 NFL Wild Card College Draft Picks' } },
    { params: { cardSet: '1991 NFL Wild Card' } },
    { params: { cardSet: '1989 MLB Topps' } },
    { params: { cardSet: '1989 MLB SCORE' } },
    { params: { cardSet: '1989 MLB Donruss' } },
    { params: { cardSet: '1989 MLB Fleer' } },
    { params: { cardSet: '1991 MLB Donruss' } },
    { params: { cardSet: '1991 MLB SCORE' } },
    { params: { cardSet: '1991 MLB Fleer' } },
  ];
  return { paths, fallback: 'blocking' }; // Set fallback to true or 'blocking' if you intend to produce paths on-demand
}
const SportsPage = ({ sportsData, cardSet }) => {
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
      <SportsTable
        initialData={sportsData}
        initialCardSet={cardSet}
      />
      <SpeedInsights />
    </>
  );
};



export async function getStaticProps({ params }) {
  try {
    const sportsData = await fetchSportsData(params.cardSet);
    return {
      props: {

        sportsData,
        cardSet: params.cardSet,
      },
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      props: {

        sportsData: [],
        cardSet: params.cardSet,

      },
    };
  }
};
export default SportsPage;
