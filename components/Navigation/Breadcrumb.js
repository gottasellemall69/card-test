import Link from 'next/link';
import { useRouter } from 'next/router';

const Breadcrumb = () => {
  const router = useRouter();
  const { pathname, isReady, query, setName, set_name } = router;

  if ( !isReady ) return null;

  return (
    <nav className="flex flex-wrap whitespace-break-spaces border-2 border-zinc-200 bg-white rounded-sm w-full" aria-label="Breadcrumb">
      <ol role="list" className="mx-auto sm:mx-0 sm:float-start flex flex-wrap text-wrap w-fit space-x-4 px-4 sm:px-6 lg:px-8">

        {/* Home */ }
        <li className="flex">
          <div className="flex items-center">
            <Link href="/" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">Home</span>
              <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </li>

        {/* Alphabetical Index */ }
        { pathname.startsWith( '/yugioh/sets' ) && (
          <li className="flex">
            <div className="flex items-center">
              <svg className="h-full w-6 flex-shrink-0 text-gray-200" viewBox="0 0 24 44" preserveAspectRatio="none" fill="currentColor" aria-hidden="true">
                <path d="M.293 0l22 22-22 22h1.414l22-22-22-22H.293z" />
              </svg>
              <Link href="/yugioh/sets/set-index" className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700">
                Alphabetical Index
              </Link>
            </div>
          </li>
        ) }

        {/* Sets by Letter */ }
        { pathname.startsWith( '/yugioh/sets' ) && query.letter && (
          <li className="flex">
            <div className="flex items-center">
              <svg className="h-full w-6 flex-shrink-0 text-gray-200" viewBox="0 0 24 44" preserveAspectRatio="none" fill="currentColor" aria-hidden="true">
                <path d="M.293 0l22 22-22 22h1.414l22-22-22-22H.293z" />
              </svg>
              <Link
                href={ "/yugioh/sets/[...letter]" }
                as={ `/yugioh/sets/${ encodeURIComponent( query.letter ) }` }
                passHref
                className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <span>Sets by Letter: </span> { query.letter }
              </Link>
            </div>
          </li>
        ) }

        {/* Cards in Set */ }
        { pathname.startsWith( '/yugioh/sets/[letter]/cards' ) && query.letter && query.setName && (
          <li className="flex">
            <div className="flex items-center">
              <svg className="h-full w-6 flex-shrink-0 text-gray-200" viewBox="0 0 24 44" preserveAspectRatio="none" fill="currentColor" aria-hidden="true">
                <path d="M.293 0l22 22-22 22h1.414l22-22-22-22H.293z" />
              </svg>
              <Link
                href={ "/yugioh/sets/[letter]/cards/[setName]" }
                as={ `/yugioh/sets/${ encodeURIComponent( query.letter ) }/cards/${ encodeURIComponent( query.setName ) }` }
                passHref
                className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <span>Cards in Set: </span> { query.setName }
              </Link>
            </div>
          </li>
        ) }

        {/* Card Details */ }
        { pathname.startsWith( '/yugioh/sets/' ) && query.card && query.letter && query.set_name && (
          <div className="flex flex-wrap flex-row">
            <li className="flex">
              <div className="flex items-center">
                <svg className="h-full w-6 flex-shrink-0 text-gray-200" viewBox="0 0 24 44" preserveAspectRatio="none" fill="currentColor" aria-hidden="true">
                  <path d="M.293 0l22 22-22 22h1.414l22-22-22-22H.293z" />
                </svg>
                <Link
                  href={ "/yugioh/sets/[letter]/cards/[setName]" }
                  as={ `/yugioh/sets/${ encodeURIComponent( query.letter ) }/cards/${ encodeURIComponent( query.set_name ) }` }
                  passHref
                  className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  <span>Cards in Set: </span> { query.set_name }
                </Link>
              </div>
            </li>
            <li className="flex">
              <div className="flex items-center">
                <svg className="h-full w-6 flex-shrink-0 text-gray-200" viewBox="0 0 24 44" preserveAspectRatio="none" fill="currentColor" aria-hidden="true">
                  <path d="M.293 0l22 22-22 22h1.414l22-22-22-22H.293z" />
                </svg>
                <span className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700">
                  Card Details: { query.card }
                </span>
              </div>
            </li>
          </div>
        ) }
      </ol>
    </nav>
  );
};
export default Breadcrumb;