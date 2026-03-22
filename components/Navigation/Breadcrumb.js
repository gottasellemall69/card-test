import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const Breadcrumb = ( { items = null } ) => {
  const router = useRouter();
  const { pathname, query, isReady } = router;
  const [ hasMounted, setHasMounted ] = useState( false );
  const [ cardName, setCardName ] = useState( null );
  const hasCustomItems = Array.isArray( items ) && items.length > 0;

  // Ensure client-only rendering
  useEffect( () => {
    setHasMounted( true );
  }, [] );

  // Fetch the card's human-readable name if we're on a details page
  useEffect( () => {
    if ( hasCustomItems ) {
      return undefined;
    }

    if ( query.card ) {
      fetch( `/api/Yugioh/card/${ encodeURIComponent( query.card ) }` )
        .then( ( res ) => res.json() )
        .then( ( data ) => {
          if ( data?.name ) setCardName( data.name );
        } )
        .catch( ( err ) => console.error( 'Breadcrumb: failed to fetch card name', err ) );
    }
    return undefined;
  }, [ hasCustomItems, query.card ] );

  // Fall back to the card name passed in the query if no id lookup is available
  useEffect( () => {
    if ( hasCustomItems ) {
      return;
    }

    if ( !query.card && query.card_name ) {
      const nameValue = Array.isArray( query.card_name ) ? query.card_name[ 0 ] : query.card_name;
      setCardName( nameValue || null );
    }
  }, [ hasCustomItems, query.card, query.card_name ] );

  const crumbs = useMemo( () => {
    if ( hasCustomItems ) {
      return items
        .filter( Boolean )
        .map( ( item ) => ( {
          label: item?.label ?? '',
          href: item?.href ?? null,
        } ) )
        .filter( ( item ) => item.label );
    }

    const autoCrumbs = [];

    // 1. Home
    autoCrumbs.push( { label: 'Home', href: '/yugioh' } );

    // 2. Set Index
    autoCrumbs.push( { label: 'Set Index', href: '/yugioh/sets/set-index' } );

    // 3. Sets Starting With: [LETTER]
    if ( query.letter && pathname.includes( '/yugioh/sets' ) ) {
      autoCrumbs.push( {
        label: `Sets Starting With: ${ String( query.letter ).toUpperCase() }`,
        href: `/yugioh/sets/${ encodeURIComponent( query.letter ) }`,
      } );
    }

    // 4. Cards In Set: [SET NAME]

    // 5. Context-specific parent
    if ( pathname.includes( '/card-details' ) ) {
      if ( query.source === 'set' ) {
        autoCrumbs.push( {
          label: `Cards In Set: ${ query.set_name }`,
          href: `/yugioh/sets/${ encodeURIComponent( query.letter ) }/${ encodeURIComponent( query.set_name ) }`,
        } );
      } else if ( query.source === 'collection' ) {
        autoCrumbs.push( {
          label: `Cards In Set: ${ query.set_name }`,
          href: `/yugioh/sets/${ encodeURIComponent( query.letter ) }/${ encodeURIComponent( query.set_name ) }`,
        } );
        autoCrumbs.push( {
          label: 'My Collection',
          href: '/yugioh/my-collection',
        } );
      }

      // 6. Card Details
      const fallbackCardName =
        cardName ||
        ( Array.isArray( query.card_name ) ? query.card_name[ 0 ] : query.card_name ) ||
        ( Array.isArray( query.card ) ? query.card[ 0 ] : query.card );

      autoCrumbs.push( {
        label: `Card Details: ${ fallbackCardName || 'Unknown Card' }`,
        href: null,
      } );
    }

    return autoCrumbs;
  }, [ cardName, hasCustomItems, items, pathname, query.card, query.card_name, query.letter, query.set_name, query.source ] );

  if ( !isReady || !hasMounted ) return null;

  return (
    <nav
      className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 lg:px-8"
      aria-label="Breadcrumb"
    >
      <ol className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white/80 shadow-2xl backdrop-blur">
        { crumbs.map( ( crumb, idx ) => (
          <li key={ `${ crumb.label }-${ idx }` } className="flex min-w-0 items-center gap-2">
            { idx > 0 && (
              <svg
                className="h-4 w-4 flex-shrink-0 text-white/40"
                viewBox="0 0 24 44"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M.293 0l22 22-22 22h1.414l22-22-22-22H.293z" />
              </svg>
            ) }
            { crumb.href ? (
              <span className="min-w-0 text-sm font-semibold text-white transition hover:text-indigo-200">
                <Link href={ crumb.href }>
                  { crumb.label }
                </Link>
              </span>
            ) : (
              <span className="min-w-0 text-sm font-semibold text-white">
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
