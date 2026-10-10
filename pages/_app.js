import NextApp from 'next/app';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Layout from '@/components/Layout';
import { CardProvider } from '@/context/CardContext';
import { MarketPriceProvider } from '@/context/MarketPriceContext';
import '@/styles/globals.css';
export default function App({ Component, pageProps }) {
  const getLayout = Component.getLayout ?? ((page) => <Layout>{page}</Layout>);
  const analytics =
    process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' ||
    process.env.NEXT_PUBLIC_ENABLE_SPEED_INSIGHTS === 'true';
  return (
    <CardProvider>
      <MarketPriceProvider>
        {getLayout(<Component {...pageProps} />)}
        {analytics && <SpeedInsights />}
      </MarketPriceProvider>
    </CardProvider>
  );
}
// Nonces require per-request HTML; static pre-rendered pages cannot share a nonce.
App.getInitialProps = (context) => NextApp.getInitialProps(context);
