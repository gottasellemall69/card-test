import Layout from "@/components/Layout";
import { CardProvider } from "@/context/CardContext";
import "@/styles/globals.css";
import "@/styles/gridcards.css";

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Layout>
        <CardProvider>
          <Component {...pageProps} />
        </CardProvider>
      </Layout>
    </>
  );
}
export default MyApp;
