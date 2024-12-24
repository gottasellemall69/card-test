import Layout from "@/components/Layout";
import { UserProvider } from '@auth0/nextjs-auth0/client';
import { CardProvider } from '@/context/CardContext';
import "@/styles/globals.css";
import "@/styles/gridcards.css";
import "@/styles/index.css";

function MyApp({ Component, pageProps }) {
  return (
    <>
    <UserProvider>
      <Layout>
        <CardProvider>
          <Component {...pageProps} />
        </CardProvider>
      </Layout>
    </UserProvider>
    </>
  );
}
export default MyApp;
