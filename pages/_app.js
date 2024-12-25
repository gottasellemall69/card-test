import Layout from "D:/CSVParse/venv/env/card-test/components/Layout";
import { CardProvider } from 'D:/CSVParse/venv/env/card-test/context/CardContext';
import "D:/CSVParse/venv/env/card-test/styles/globals.css";
import "D:/CSVParse/venv/env/card-test/styles/gridcards.css";
import "D:/CSVParse/venv/env/card-test/styles/index.css";

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
