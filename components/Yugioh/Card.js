"use client";
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const Card = ( { cardData } ) => {
  const router = useRouter();
  const { letter, setName } = router.query; // only these two from URL

  const cardNameParam = cardData?.productName || cardData?.name || null;

  const derivePrimaryImageId = useCallback( () => {
    if ( cardData?.id ) return cardData.id;
    if ( cardData?.fallbackId ) return cardData.fallbackId;
    if ( cardData?.detailId ) return cardData.detailId;
    return null;
  }, [ cardData?.detailId, cardData?.fallbackId, cardData?.id ] );

  const primaryImageId = derivePrimaryImageId();

  const getLocalImagePath = useCallback(
    ( cardId ) => ( cardId ? `/images/yugiohImages/${ String( cardId ) }.jpg` : null ),
    []
  );

  const [ sourceIndex, setSourceIndex ] = useState( 0 );
  const [ remoteLookupSources, setRemoteLookupSources ] = useState( [] );
  const hasAttemptedLookupRef = useRef( false );

  useEffect( () => {
    setSourceIndex( 0 );
    setRemoteLookupSources( [] );
    hasAttemptedLookupRef.current = false;
  }, [ primaryImageId, cardData?.fallbackId, cardData?.detailId, cardNameParam ] );

  const imageCandidates = useMemo( () => {
    const sources = [];
    const seen = new Set();

    const pushSource = ( value ) => {
      if ( value && !seen.has( value ) ) {
        seen.add( value );
        sources.push( value );
      }
    };

    const pushLocal = ( id ) => {
      const path = getLocalImagePath( id );
      if ( path ) pushSource( path );
    };

    pushLocal( primaryImageId );
    pushLocal( cardData?.fallbackId );
    pushLocal( cardData?.detailId );
    pushSource( cardData?.remoteUrl );
    pushSource( cardData?.fallbackRemoteUrl );
    pushSource( cardData?.detailRemoteUrl );
    remoteLookupSources.forEach( pushSource );

    return sources;
  }, [ cardData?.detailId, cardData?.detailRemoteUrl, cardData?.fallbackId, cardData?.fallbackRemoteUrl, cardData?.remoteUrl, getLocalImagePath, primaryImageId, remoteLookupSources ] );

  useEffect( () => {
    if ( imageCandidates.length === 0 ) {
      setSourceIndex( 0 );
      return;
    }

    if ( sourceIndex >= imageCandidates.length ) {
      setSourceIndex( imageCandidates.length - 1 );
    }
  }, [ imageCandidates.length, sourceIndex ] );

  useEffect( () => {
    if ( remoteLookupSources.length === 0 ) return;

    const remoteStartIndex = Math.max( imageCandidates.length - remoteLookupSources.length, 0 );
    setSourceIndex( ( current ) => ( current < remoteStartIndex ? remoteStartIndex : current ) );
  }, [ imageCandidates.length, remoteLookupSources.length ] );

  const tryRemoteLookup = useCallback( async () => {
    if ( hasAttemptedLookupRef.current ) return;
    if ( !cardNameParam ) return;

    hasAttemptedLookupRef.current = true;

    try {
      const response = await fetch(
        `/api/Yugioh/card/lookup?name=${ encodeURIComponent( cardNameParam ) }`
      );
      if ( !response.ok ) return;
      const data = await response.json();
      const remoteImages = Array.isArray( data?.card_images )
        ? data.card_images.map( ( image ) => image?.image_url ).filter( Boolean )
        : [];
      if ( remoteImages.length > 0 ) {
        setRemoteLookupSources( remoteImages );
      }
    } catch ( error ) {
      console.warn( 'Card image lookup failed', error );
    }
  }, [ cardNameParam ] );

  useEffect( () => {
    if ( imageCandidates.length === 0 ) {
      tryRemoteLookup();
    }
  }, [ imageCandidates.length, tryRemoteLookup ] );

  const imageSource = imageCandidates[ sourceIndex ] || '';

  const handleImageError = useCallback( () => {
    setSourceIndex( ( current ) => {
      const nextIndex = current + 1;
      if ( nextIndex < imageCandidates.length ) {
        return nextIndex;
      }
      tryRemoteLookup();
      return current;
    } );
  }, [ imageCandidates.length, tryRemoteLookup ] );

  const detailCardId = cardData?.detailId ?? cardData?.id ?? primaryImageId ?? null;
  const resolvedCardId = detailCardId ?? 'lookup';

  const linkQuery = {
    card: resolvedCardId,
    source: 'set', // flag so card-details knows this came from a set page
  };

  if ( letter ) {
    linkQuery.letter = letter;
  }

  if ( setName ) {
    linkQuery.set_name = setName;
  }

  if ( cardNameParam ) {
    linkQuery.card_name = cardNameParam;
  }

  return (
    <>
      <div className="hover:scale-95 hover:duration-100 transition-transform -p-5 h-72 w-full object-scale-down object-center">
        <Link
          href={ {
            pathname: '/yugioh/sets/[letter]/cards/card-details',
            query: linkQuery,
          } }
          passHref
        >
          <img
            className=" max-w-full w-full h-96 max-h-96"
            src={ imageSource }
            onError={ handleImageError }
            alt={ `Card Image - ${ cardData.productName || cardData.name || 'Unknown' }` }
            loading="lazy"
          />
        </Link>
      </div>
    </>
  );
};

export default Card;



