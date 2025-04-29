import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const Breadcrumb = () => {
  const router = useRouter();
  const { pathname, isReady, query } = router;
  const [ hasMounted, setHasMounted ] = useState( false );

  useEffect( () => {
    setHasMounted( true );
  }, [] );

  if ( !isReady || !hasMounted || Object.keys( query ).length === 0 ) return null;

  return (
    <nav className="flex flex-wrap whitespace-break-spaces border-2 border-zinc-200 bg-transparent glass text-shadow rounded-sm w-full" aria-label="Breadcrumb">
      <ol role="list" className="mx-auto sm:mx-0 sm:float-start flex flex-wrap text-wrap w-fit space-x-4 px-4 sm:px-6 lg:px-8">

        <li className="flex">
          <div className="flex items-center">
            <Link href="/">
              <span className="sr-only">Home</span>
              <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </li>

        { pathname.startsWith( '/yugioh/sets' ) && (
          <li className="flex">
            <div className="flex items-center">
              <svg className="h-full w-6 flex-shrink-0 text-white text-shadow" viewBox="0 0 24 44" fill="currentColor" aria-hidden="true">
                <path d="M.293 0l22 22-22 22h1.414l22-22-22-22H.293z" />
              </svg>
              <Link href="/yugioh/sets/set-index">
                <span className="ml-4 text-sm font-medium text-white text-shadow hover:text-gray-700">
                  Alphabetical Index
                </span>
              </Link>
            </div>
          </li>
        ) }

        { pathname.startsWith( '/yugioh/sets' ) && query?.letter && (
          <li className="flex">
            <div className="flex items-center">
              <svg className="h-full w-6 flex-shrink-0 text-white text-shadow" viewBox="0 0 24 44" fill="currentColor" aria-hidden="true">
                <path d="M.293 0l22 22-22 22h1.414l22-22-22-22H.293z" />
              </svg>
              <Link
                href={ { pathname: "/yugioh/sets/[...letter]", query: { letter: query.letter } } }
              >
                <span className="ml-4 text-sm font-medium text-white text-shadow hover:text-gray-700">
                  Sets by Letter: { query.letter }
                </span>
              </Link>
            </div>
          </li>
        ) }

        { pathname.startsWith( '/yugioh/sets/[letter]/cards' ) && query?.letter && query?.setName && (
          <li className="flex">
            <div className="flex items-center">
              <svg className="h-full w-6 flex-shrink-0 text-white text-shadow" viewBox="0 0 24 44" fill="currentColor" aria-hidden="true">
                <path d="M.293 0l22 22-22 22h1.414l22-22-22-22H.293z" />
              </svg>
              <Link
                href={ {
                  pathname: '/yugioh/sets/[letter]/[setName]',
                  query: { letter: query.letter, setName: query.setName }
                } }
              >
                <span className="ml-4 text-sm font-medium text-white text-shadow hover:text-gray-700">
                  Cards in Set: { query.setName }
                </span>
              </Link>
            </div>
          </li>
        ) }


        { pathname.startsWith( '/yugioh/sets/[letter]/cards' ) && query?.card && query.setName && query.letter && (
          <li className="flex">
            <div className="flex items-center">
              <svg className="h-full w-6 flex-shrink-0 text-white text-shadow" viewBox="0 0 24 44" fill="currentColor" aria-hidden="true">
                <path d="M.293 0l22 22-22 22h1.414l22-22-22-22H.293z" />
              </svg>
              <Link
                href={ {
                  pathname: '/yugioh/sets/[letter]/cards/card-details',
                  query: {
                    letter: query.letter,
                    setName: query.setName,
                    card: query.card
                  }
                } }
              >
                <span className="ml-4 text-sm font-medium text-white text-shadow hover:text-gray-700">
                  Card Details: { query.card }
                </span>
              </Link>
            </div>
          </li>
        ) }
      </ol>
    </nav>
  );
};

export default Breadcrumb;
