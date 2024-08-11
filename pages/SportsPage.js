'use client';
// @/pages/SportsPage.page.js
import dynamic from 'next/dynamic';
import Head from 'next/head';


const SportsTable = dynamic(() => import('@/components/Sports/SportsTable.js'), { ssr: false });

const SportsPage = ({ metaTags }, { nonce }) => {
  return (
    <>
      <Head>
        <title>{metaTags.title}</title>
        <meta name="description" content={metaTags.description} />
        <meta name="charset" content={metaTags.charset} />
        <meta name="keywords" content={metaTags.keywords} />
        <link rel="canonical" href="https://card-price-app-bjp.vercel.app" />
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
      <SportsTable />
    </>
  );
};
export async function getStaticProps() {
  // Fetch data for meta tags
  const metaTags = {
    title: 'Sports Card Prices',
    description: 'Get sports card prices',
    charset: 'UTF-8',
    keywords: 'javascript,nextjs,price-tracker,trading-card-game,tailwindcss'
  };

  return {
    props: {
      metaTags
    },
  };
}
export default SportsPage;
