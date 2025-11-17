import fs from "fs/promises";
import path from "path";
import { useMemo, useState } from "react";
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

const parseReleaseDate = ( value ) => {
  if ( !value ) {
    return 0;
  }

  const parsed = Date.parse( value );

  return Number.isNaN( parsed ) ? 0 : parsed;
};

const SetsByLetterPage = ( { letter = "", sets = [] } ) => {
  const router = useRouter();
  const routerLetter = Array.isArray( router.query.letter )
    ? router.query.letter[ 0 ]
    : router.query.letter;
  const [ searchTerm, setSearchTerm ] = useState( "" );
  const [ sortOption, setSortOption ] = useState( "name-asc" );
  const [ supplementalFilter, setSupplementalFilter ] = useState( "all" );

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

  const filteredAndSortedSets = useMemo( () => {
    if ( !Array.isArray( sets ) || sets.length === 0 ) {
      return [];
    }

    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = sets.filter( ( set ) => {
      if ( supplementalFilter === "mainline" && set.isSupplemental ) {
        return false;
      }

      if ( supplementalFilter === "supplemental" && !set.isSupplemental ) {
        return false;
      }

      if ( !normalizedSearch ) {
        return true;
      }

      const haystack = `${ set.set_name ?? "" } ${ set.abbreviation ?? "" }`
        .toLowerCase();

      return haystack.includes( normalizedSearch );
    } );

    const compareByName = ( a, b ) =>
      a.set_name.localeCompare( b.set_name, undefined, { sensitivity: "base" } );

    const compareByRelease = ( a, b ) =>
      parseReleaseDate( b.releaseDate ) - parseReleaseDate( a.releaseDate );

    const sorted = [ ...filtered ].sort( ( a, b ) => {
      switch ( sortOption ) {
        case "name-desc":
          return compareByName( b, a );
        case "release-old":
          return compareByRelease( b, a );
        case "release-new":
          return compareByRelease( a, b );
        case "name-asc":
        default:
          return compareByName( a, b );
      }
    } );

    return sorted;
  }, [ sets, searchTerm, sortOption, supplementalFilter ] );

  const memoizedSets = useMemo( () => {
    if ( filteredAndSortedSets.length === 0 ) {
      return (
        <p className="p-5 text-white">
          No sets match your filters for { effectiveLetter || "this index" }.
        </p>
      );
    }

    return filteredAndSortedSets.map( ( set ) => (
      <div
        key={ set.urlName || set.set_name }
        className="w-7xl rounded-lg p-5 font-medium leading-5 text-white transition hover:bg-white/5"
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
        <div className="mt-2 text-sm text-gray-200">
          { set.abbreviation ? <span className="mr-3">Abbr: { set.abbreviation }</span> : null }
          { set.releaseDate ? (
            <span>
              Release: { new Date( set.releaseDate ).toLocaleDateString() }
            </span>
          ) : null }
          { typeof set.isSupplemental === "boolean" ? (
            <span className="ml-3">
              { set.isSupplemental ? "Supplemental" : "Mainline" }
            </span>
          ) : null }
        </div>
      </div>
    ) );
  }, [ filteredAndSortedSets, effectiveLetter ] );

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
          <div className="mx-5 mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className="flex flex-col text-sm font-semibold text-gray-200">
              Search by name or abbreviation
              <input
                type="search"
                value={ searchTerm }
                onChange={ ( event ) => setSearchTerm( event.target.value ) }
                placeholder="e.g. Starter Deck"
                className="mt-2 rounded-md border border-gray-400 bg-gray-900/60 p-2 text-white placeholder:text-gray-400 focus:border-teal-400 focus:outline-none"
              />
            </label>
            <label className="flex flex-col text-sm font-semibold text-gray-200">
              Sort sets
              <select
                value={ sortOption }
                onChange={ ( event ) => setSortOption( event.target.value ) }
                className="mt-2 rounded-md border border-gray-400 bg-gray-900/60 p-2 text-white focus:border-teal-400 focus:outline-none"
              >
                <option value="name-asc">Name (A → Z)</option>
                <option value="name-desc">Name (Z → A)</option>
                <option value="release-new">Release (Newest)</option>
                <option value="release-old">Release (Oldest)</option>
              </select>
            </label>
            <label className="flex flex-col text-sm font-semibold text-gray-200">
              Filter by set type
              <select
                value={ supplementalFilter }
                onChange={ ( event ) => setSupplementalFilter( event.target.value ) }
                className="mt-2 rounded-md border border-gray-400 bg-gray-900/60 p-2 text-white focus:border-teal-400 focus:outline-none"
              >
                <option value="all">All sets</option>
                <option value="mainline">Mainline</option>
                <option value="supplemental">Supplemental</option>
              </select>
            </label>
          </div>
          <div className="mx-5 pb-10 p-3 grid grid-flow-row grid-cols-1 flex-wrap md:grid-cols-2 lg:grid-cols-3">
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
      releaseDate: set?.releaseDate ?? null,
      isSupplemental: set?.isSupplemental ?? null,
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
