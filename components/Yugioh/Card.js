import Image from "next/image";
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback } from 'react';

const Card = ( { cardData } ) => {
  const router = useRouter();
  const { letter, setName, rarity } = router.query;    // only these two from URL

  const getLocalImagePath = useCallback(
    ( cardId ) => `/images/yugiohImages/${ String( cardId ) }.jpg`, []
  );

  return (
    <>
      <Link
        href={ {
          pathname: "/yugioh/sets/[letter]/cards/card-details",
          query: {
            card: cardData.id,
            letter: letter,
            set_name: setName,
            set_rarity: rarity,
            source: "set", // flag so card-details knows this came from a set page
          },
        } }
        passHref
      >
        <img
          className="lg:object-cover object-scale-down object-top w-auto mx-auto h-72 aspect-video"
          as="image"
          priority="true"
          unoptimized="true"
          src={ getLocalImagePath( cardData.id ) }
          alt={ `Card Image - ${ cardData.productName }` }
          width={ "100%" }
          height={ "full" }
        />
      </Link>
    </>
  );
};

export default Card;
