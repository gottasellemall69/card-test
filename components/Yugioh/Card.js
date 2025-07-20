import Image from "next/image";
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback } from 'react';

const Card = ( { cardData } ) => {
  const router = useRouter();
  const { letter, setName } = router.query;    // only these two from URL

  const getLocalImagePath = useCallback(
    ( cardId ) => `/images/yugiohImages/${ String( cardId ) }.jpg`,
    []
  );

  return (
    <div>
      <Link
        href={ {
          pathname: "/yugioh/sets/[letter]/cards/card-details",
          query: {
            card: cardData.id,                    // the actual card id
            letter,                               // preserved from URL
            setName,                              // preserved from URL
            rarity: cardData.rarity,              // real rarity from data
            edition: cardData.printing,            // real “edition” from data
            source: cardData.setName
          },
        } }
      >
        <div className="object-center object-scale-down hover:scale-105 hover:duration-100 transition-transform">
          <Image
            className="object-scale-down object-center w-full h-full max-h-96"

            as="image"
            quality={ 75 }
            priority={ true }
            unoptimized={ true }
            src={ getLocalImagePath( cardData.id ) }
            alt={ `Card Image - ${ cardData.productName }` }
            width={ 1600 }
            height={ 1600 }
          />
        </div>
      </Link>
    </div>
  );
};

export default Card;
