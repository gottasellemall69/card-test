import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const Breadcrumb = () => {
  const router = useRouter();
  const { pathname, query, isReady } = router;
  const [ hasMounted, setHasMounted ] = useState( false );
  const [ cardName, setCardName ] = useState( null );

  // Ensure client-only rendering
  useEffect( () => {
    setHasMounted( true );
  }, [] );

  // Fetch the card's human-readable name if we're on a details page
  useEffect( () => {
    if ( query.card ) {
      fetch( `/api/Yugioh/card/${ encodeURIComponent( query.card ) }` )
        .then( ( res ) => res.json() )
        .then( ( data ) => {
          if ( data?.name ) setCardName( data.name );
        } )
        .catch( ( err ) => console.error( 'Breadcrumb: failed to fetch card name', err ) );
    }
  }, [ query.card ] );

  if ( !isReady || !hasMounted ) return null;

  const crumbs = [];

  // 1. Home
  crumbs.push( { label: 'Home', href: '/yugioh' } );

  // 2. Set Index
  crumbs.push( { label: 'Set Index', href: '/yugioh/sets/set-index' } );

  // 3. Sets Starting With: [LETTER]
  if ( query.letter && pathname.includes( '/yugioh/sets' ) ) {
    crumbs.push( {
      label: `Sets Starting With: ${ String( query.letter ).toUpperCase() }`,
      href: `/yugioh/sets/${ encodeURIComponent( query.letter ) }`,
    } );
  }

  // 4. Cards In Set: [SET NAME]

  // 5. Context-specific parent
  if ( pathname.includes( '/card-details' ) ) {
    if ( query.source === 'set' ) {
      crumbs.push( {
        label: `Cards In Set: ${ query.set_name }`,
        href: `/yugioh/sets/${ encodeURIComponent( query.letter ) }/${ encodeURIComponent( query.set_name ) }`
      } );
    } else if ( query.source === 'collection' ) {
      crumbs.push( {
        label: `Cards In Set: ${ query.set_name }`,
        href: `/yugioh/sets/${ encodeURIComponent( query.letter ) }/${ encodeURIComponent( query.set_name ) }`
      } );
      crumbs.push( {
        label: 'My Collection',
        href: '/yugioh/my-collection'
      } );
    }

    // 6. Card Details
    crumbs.push( {
      label: `Card Details: ${ cardName || query.card }`,
      href: null
    } );
  }


  return (
    <nav
      className="flex flex-wrap whitespace-break-spaces bg-transparent backdrop glass text-shadow rounded-sm w-full"
      aria-label="Breadcrumb"
    >
      <ol className="mx-auto sm:mx-0 sm:float-start flex flex-wrap w-fit space-x-4 px-4 sm:px-6 lg:px-8">
        { crumbs.map( ( crumb, idx ) => (
          <li key={ idx } className="flex flex-wrap items-center">
            { idx > 0 && (
              <svg
                className="h-5 w-5 flex-shrink-0 text-white text-shadow backdrop"
                viewBox="0 0 24 44"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M.293 0l22 22-22 22h1.414l22-22-22-22H.293z" />
              </svg>
            ) }
            { crumb.href ? (
              <span className="ml-4 p-2 text-sm font-black text-white text-shadow hover:text-gray-300">
                <Link href={ crumb.href } passHref>
                  { crumb.label }
                </Link>
              </span>
            ) : (
              <span className="ml-4 p-2 text-sm font-black text-white text-shadow">
                { crumb.label }
              </span>
            ) }
          </li>
        ) ) }
      </ol>
    </nav>
  );
};

export default Breadcrumb;