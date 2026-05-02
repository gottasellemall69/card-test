import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  static async getInitialProps( ctx ) {
    const initialProps = await Document.getInitialProps( ctx );
    const nonceHeader = ctx.req?.headers?.[ "x-nonce" ];
    const nonce = Array.isArray( nonceHeader ) ? nonceHeader[ 0 ] : nonceHeader;

    return {
      ...initialProps,
      nonce,
    };
  }

  render() {
    const { nonce } = this.props;

    return (
      <Html className="h-full" lang="en">
        <Head nonce={ nonce }>
          <meta name="description" content="Enter list of TCG cards, get data back" />
          <meta name="keywords" content="javascript,nextjs,price-tracker,trading-card-game,tailwindcss" />
          <meta charSet="UTF-8" />
          { nonce ? <meta property="csp-nonce" content={ nonce } /> : null }
        </Head>
        <body className="mx-auto min-h-screen h-full max-w-full">
          <Main />
          <NextScript nonce={ nonce } />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
