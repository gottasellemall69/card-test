import fs from "fs/promises";
import path from "path";
import { useMemo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";

import Breadcrumb from "@/components/Navigation/Breadcrumb";
import { SpeedInsights } from "@vercel/speed-insights/next";

const CARD_SETS_FILE_PATH = path.join(
  process.cwd(),
  "public",
  "card-data",
  "Yugioh",
  "card_sets.json",
);

let cachedCardSets = null;

async function loadCardSets() {
  if ( cachedCardSets ) {
    return cachedCardSets;
  }

  try {
    const fileContents = await fs.readFile( CARD_SETS_FILE_PATH, "utf8" );
    const parsed = JSON.parse( fileContents );
    cachedCardSets = Array.isArray( parsed ) ? parsed : [];
  } catch ( error ) {
    console.error( "Failed to load Yu-Gi-Oh! card set catalogue:", error );
    cachedCardSets = [];
  }

  return cachedCardSets;
}

const normalizeLetter = ( value ) => {
  if ( !value ) {
    return "";
  }

  const stringValue = value.toString().trim();
  return stringValue ? stringValue.charAt( 0 ).toUpperCase() : "";
};

const SetsByLetterPage = ( { letter = "", sets = [] } ) => {
  const router = useRouter();
  const routerLetter = Array.isArray( router.query.letter )
    ? router.query.letter[ 0 ]
    : router.query.letter;

  if ( router.isFallback ) {
    return (
      <div className="mx-auto flex min-h-screen w-full items-center justify-center bg-cover bg-fixed text-white yugioh-bg">
        Loading sets…
      </div>
    );
  }

  const effectiveLetter = useMemo(
    () => normalizeLetter( letter || routerLetter ),
    [ letter, routerLetter ]
  );

  const memoizedSets = useMemo( () => {
    if ( !Array.isArray( sets ) || sets.length === 0 ) {
      return (
        <p className="p-5 text-white">
          No sets are currently available for { effectiveLetter || "this index" }.
        </p>
      );
    }

    return sets.map( ( set ) => (
      <div
        key={ set.urlName || set.set_name }
        className="w-7xl p-5 font-medium leading-5 text-white"
      >
        <Link
          className="w-fit hover:font-semibold hover:underline"
          href={ {
            pathname: `/yugioh/sets/${ encodeURIComponent(
              effectiveLetter
            ) }/${ encodeURIComponent( set.set_name ) }`,
            query: {
              letter: effectiveLetter,
              set_name: set.set_name,
            },
          } }
        >
          { set.set_name }
        </Link>
      </div>
    ) );
  }, [ sets, effectiveLetter ] );

  const pageLetter = effectiveLetter || "—";

  return (
    <>
      <Head>
        <title>Yu-Gi-Oh! Cards in Set</title>
        <meta name="description" content={ `Sets Starting with ${ pageLetter }` } />
        <meta name="keywords" content="javascript,nextjs,price-tracker,trading-card-game,tailwindcss" />
        <meta charSet="UTF-8" />
      </Head>
      <div className="yugioh-bg mx-auto min-h-screen w-full">
        <Breadcrumb />
        <div>
          <h1 className="my-10 text-xl font-black text-shadow">
            Sets Starting with { pageLetter }
          </h1>
          <div className="mx-5 grid grid-flow-row grid-cols-1 flex-wrap md:grid-cols-2 lg:grid-cols-3">
            { memoizedSets }
          </div>
        </div>
      </div>
      <SpeedInsights />
    </>
  );
};

export async function getStaticPaths() {
  const sets = await loadCardSets();
  const uniqueLetters = new Set();

  sets.forEach( ( set ) => {
    const letter = normalizeLetter( set?.name );
    if ( letter ) {
      uniqueLetters.add( letter );
    }
  } );

  const paths = Array.from( uniqueLetters ).map( ( letter ) => ( {
    params: { letter: [ letter ] },
  } ) );

  return {
    paths,
    fallback: "blocking",
  };
}

export async function getStaticProps( { params } ) {
  const letterParam = Array.isArray( params?.letter )
    ? params.letter[ 0 ]
    : params?.letter;
  const normalizedLetter = normalizeLetter( letterParam );

  if ( !normalizedLetter ) {
    return { notFound: true };
  }

  const sets = await loadCardSets();

  const setsForLetter = sets
    .filter( ( set ) => normalizeLetter( set?.name ) === normalizedLetter )
    .map( ( set ) => ( {
      set_name: set?.name ?? "",
      urlName: set?.urlName ?? null,
      setNameId: set?.setNameId ?? null,
      abbreviation: set?.abbreviation ?? null,
    } ) )
    .sort( ( a, b ) => a.set_name.localeCompare( b.set_name ) );

  return {
    props: {
      letter: normalizedLetter,
      sets: setsForLetter,
    },
    revalidate: 60 * 60,
  };
}

export default SetsByLetterPage;
