import Image from "next/image";
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback } from 'react';

const Card = ( { cardData } ) => {
  const router = useRouter();
  const { cardId, letter, setName, rarity, edition } = router.query;

  const getLocalImagePath = useCallback( ( cardId ) => `/images/yugiohImages/${ String( cardId ) }.jpg`, [] );

  return (
    <div>
      <Link
        as={ `/yugioh/sets/${ encodeURIComponent( letter ) }/cards/card-details?name=${ encodeURIComponent( cardData.name ) }` }
        href={ {
          pathname: "/yugioh/sets/[letter]/cards/card-details",
          query: {
            card: cardData.id,
            set_name: setName || "Unknown",
            rarity: rarity || "Unknown",
            edition: edition || "Unknown",
            letter: letter
          }
        } }
        passHref
      >
        <div className="object-center object-scale-down hover:scale-105 hover:duration-100 transition-transform">
          <Image
            className="object-scale-down object-center w-full h-full max-h-96"
            as={ "image" }
            quality={ 75 }
            priority={ true }
            unoptimized={ true }
            src={ getLocalImagePath( cardData?.id ) }
            alt={ `Card Image - ${ cardData?.name }` }
            width={ 1600 }
            height={ 1600 }
          />
        </div>
      </Link>
    </div>
  );
};

export default Card;
