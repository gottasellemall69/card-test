import Image from "next/image";
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback } from 'react';

const Card = ( { cardData } ) => {
  const router = useRouter();
  const { cardId, letter } = router.query;

  const getLocalImagePath = useCallback( ( cardId ) => `/images/yugiohImages/${ String( cardId ) }.jpg`, [] );

  return (
    <div>
      <Link
        as={ `/yugioh/sets/${ letter }/cards/CardDetails?card=${ encodeURIComponent( cardId ) }&set_name=${ encodeURIComponent( cardData.card_sets.set_name || "Unknown" ) }&rarity=${ encodeURIComponent( cardData.card_sets.rarity || "Unknown" ) }&edition=${ encodeURIComponent( cardData.card_sets.edition || "Unknown" ) }` }
        href={ {
          pathname: "/yugioh/sets/[letter]/cards/CardDetails",
          query: {
            card: cardData.id,
            set_name: cardData.card_sets.set_name || "Unknown",
            rarity: cardData.card_sets.rarity || "Unknown",
            edition: cardData.card_sets.edition || "Unknown",
            letter: letter
          }
        } }
        passHref
      >
        <div className="object-center object-scale-down hover:scale-105 hover:duration-100 transition-transform">
          <Image
            className="object-scale-down object-center w-full h-full max-h-96"
            priority={ true }
            quality={ 75 }
            unoptimized={ true }
            src={ getLocalImagePath( cardData?.id ) }
            alt={ `Card Image - ${ cardData?.name }` }
            width={ 210 }
            height={ 320 }
          />
        </div>
      </Link>
    </div>
  );
};

export default Card;
