import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const Breadcrumb = () => {
  const router = useRouter();
  const { asPath, isReady, query } = router;
  const [ hasMounted, setHasMounted ] = useState( false );

  useEffect( () => {
    setHasMounted( true );
  }, [] );

  if ( !isReady || !hasMounted ) return null;

  const pathWithoutQuery = asPath.split( '?' )[ 0 ];
  const segments = pathWithoutQuery.split( '/' ).filter( Boolean );

  const generateHref = ( index ) => {
    return '/' + segments.slice( 0, index + 1 ).join( '/' );
  };

  const formatLabel = ( segment, index ) => {
    if ( segment === 'set-index' ) return 'Alphabetical Index';
    if ( segment.length === 1 && /^[a-zA-Z]$/.test( segment ) ) return `Letter: ${ segment.toUpperCase() }`;
    if ( query.set_name && index === segments.length - 2 ) return `Set: ${ encodeURIComponent( query.set_name ) }`;
    if ( query.card && index === segments.length - 1 ) return `Card: ${ query.card }`;
    if ( segment === 'my-collection' ) return 'My Collection';
    return segment.replace( /[-_]/g, ' ' ).replace( /\b\w/g, ( char ) => char.toUpperCase() );
  };

  const shouldDisplaySegment = ( segment, index ) => {
    if ( segment === 'cards' ) return false; // Hide "/cards"
    return true;
  };

  return (
    <nav className="flex flex-wrap whitespace-break-spaces border-2 border-zinc-200 bg-transparent glass text-shadow rounded-sm w-full" aria-label="Breadcrumb">
      <ol className="mx-auto sm:mx-0 sm:float-start flex flex-wrap text-wrap w-fit space-x-4 px-4 sm:px-6 lg:px-8">

        {/* Home icon */ }
        <li className="flex items-center">
          <Link href="/">
            <span className="sr-only">Home</span>
            <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd" />
            </svg>
          </Link>
        </li>

        {/* Dynamically Rendered Segments */ }
        { segments.map( ( segment, index ) => {
          if ( !shouldDisplaySegment( segment, index ) ) return null;

          const href = generateHref( index );
          const label = formatLabel( segment, index );

          return (
            <li key={ index } className="flex items-center">
              <svg className="h-full w-6 flex-shrink-0 text-white text-shadow" viewBox="0 0 24 44" fill="currentColor" aria-hidden="true">
                <path d="M.293 0l22 22-22 22h1.414l22-22-22-22H.293z" />
              </svg>
              <Link href={ href }>
                <span className="ml-4 text-sm font-medium text-white text-shadow hover:text-gray-300">
                  { label }
                </span>
              </Link>
            </li>
          );
        } ) }
      </ol>
    </nav>
  );
};

export default Breadcrumb;
