import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";

import Breadcrumb from "@/components/Navigation/Breadcrumb";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getSetCatalogue } from "@/utils/api";

let cachedCardSets = null;
let cachedCardSetsAt = 0;
const SET_CACHE_TTL_MS = 60 * 60 * 1000;

const normalizeSetEntry = ( entry ) => {
  if ( !entry || !entry.name ) {
    return null;
  }

  return {
    name: entry.name,
    setNameId: entry.setNameId ?? entry.set_name_id ?? null,
    urlName: entry.urlName ?? entry.url_name ?? null,
    abbreviation: entry.abbreviation ?? entry.abbr ?? null,
    releaseDate:
      entry.releaseDate ??
      entry.releasedDate ??
      entry.release_date ??
      entry.release ??
      null,
    isSupplemental:
      typeof entry.isSupplemental === "boolean"
        ? entry.isSupplemental
        : typeof entry.is_supplemental === "boolean"
          ? entry.is_supplemental
          : null,
  };
};

async function loadCardSets() {
  if ( cachedCardSets && Date.now() - cachedCardSetsAt < SET_CACHE_TTL_MS ) {
    return cachedCardSets;
  }

  let catalogue = null;
  try {
    catalogue = await getSetCatalogue();
  } catch ( error ) {
    console.error( "Failed to load live set catalogue:", error );
  }

  cachedCardSets = Array.isArray( catalogue )
    ? catalogue.map( normalizeSetEntry ).filter( Boolean )
    : [];
  cachedCardSetsAt = Date.now();
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
        <div className="rounded-3xl border border-dashed border-white/20 bg-black/30 px-6 py-16 text-center text-white/75 md:col-span-2 xl:col-span-3">
          <p className="text-lg font-semibold text-white">No sets match your current filters.</p>
          <p className="mt-2 text-sm text-white/60">
            Try another search term or switch the set type for { effectiveLetter || "this index" }.
          </p>
        </div>
      );
    }

    return filteredAndSortedSets.map( ( set ) => (
      <Link
        key={ set.urlName || set.set_name }
        href={ {
          pathname: `/yugioh/sets/${ encodeURIComponent( effectiveLetter ) }/${ encodeURIComponent( set.set_name ) }`,
          query: {
            letter: effectiveLetter,
            set_name: set.set_name,
          },
        } }
        className="group flex h-full flex-col rounded-3xl border border-white/10 bg-black/40 p-5 text-white shadow-xl transition hover:border-indigo-400/45 hover:bg-black/55"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold leading-snug text-white transition group-hover:text-indigo-200">
            { set.set_name }
          </h2>
          { typeof set.isSupplemental === "boolean" ? (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-white/70">
              { set.isSupplemental ? "Supplemental" : "Mainline" }
            </span>
          ) : null }
        </div>
        <div className="mt-4 space-y-2 text-sm text-white/70">
          { set.abbreviation ? (
            <p>
              <span className="font-semibold text-white/55">Abbreviation:</span> { set.abbreviation }
            </p>
          ) : null }
          { set.releaseDate ? (
            <p>
              <span className="font-semibold text-white/55">Release:</span>{ " " }
              { new Date( set.releaseDate ).toLocaleDateString() }
            </p>
          ) : null }
        </div>
        <span className="mt-6 inline-flex items-center text-sm font-semibold text-indigo-200">
          Open set
        </span>
      </Link>
    ) );
  }, [ filteredAndSortedSets, effectiveLetter ] );

  const pageLetter = effectiveLetter || "—";

  return (
    <>
      <Head>
        <title>{ `Yu-Gi-Oh! Sets Starting With ${ pageLetter }` }</title>
        <meta name="description" content={ `Sets Starting with ${ pageLetter }` } />
        <meta name="keywords" content="javascript,nextjs,price-tracker,trading-card-game,tailwindcss" />
        <meta charSet="UTF-8" />
      </Head>
      <div className="yugioh-bg mx-auto min-h-screen w-full text-white">
        <div className="justify-start place-content-start place-items-baseline w-[75%]">
          <Breadcrumb />
        </div>
        <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
          <header className="rounded-3xl border border-white/10 bg-black/45 p-6 shadow-2xl backdrop-blur">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/50">Yu-Gi-Oh! Sets</p>
                <h1 className="mt-4 text-4xl font-bold tracking-tight text-white lg:text-5xl">
                  Sets Starting With { pageLetter }
                </h1>
                <p className="mt-4 text-base text-white/70">
                  Browse the catalogue, filter supplemental releases, and jump into any set with a consistent layout.
                </p>
              </div>
              <div className="grid gap-3 text-left sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-white/55">Matches</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{ filteredAndSortedSets.length }</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-white/55">Letter</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{ pageLetter }</p>
                </div>
              </div>
            </div>
          </header>

          <section className="mt-8 rounded-3xl border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="flex flex-col text-sm font-semibold text-white/80">
                <span className="uppercase tracking-wide text-white/55">Search</span>
                <input
                  type="search"
                  value={ searchTerm }
                  onChange={ ( event ) => setSearchTerm( event.target.value ) }
                  placeholder="e.g. Starter Deck"
                  className="mt-2 rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-white placeholder:text-white/45 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                />
              </label>
              <label className="flex flex-col text-sm font-semibold text-white/80">
                <span className="uppercase tracking-wide text-white/55">Sort</span>
                <select
                  value={ sortOption }
                  onChange={ ( event ) => setSortOption( event.target.value ) }
                  className="mt-2 rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                >
                  <option value="name-asc">Name (A to Z)</option>
                  <option value="name-desc">Name (Z to A)</option>
                  <option value="release-new">Release (Newest)</option>
                  <option value="release-old">Release (Oldest)</option>
                </select>
              </label>
              <label className="flex flex-col text-sm font-semibold text-white/80">
                <span className="uppercase tracking-wide text-white/55">Set Type</span>
                <select
                  value={ supplementalFilter }
                  onChange={ ( event ) => setSupplementalFilter( event.target.value ) }
                  className="mt-2 rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                >
                  <option value="all">All sets</option>
                  <option value="mainline">Mainline</option>
                  <option value="supplemental">Supplemental</option>
                </select>
              </label>
            </div>
          </section>

          <section className="mt-8">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              { memoizedSets }
            </div>
          </section>
        </main>
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
