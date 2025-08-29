import Image from "next/image";
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback } from 'react';

const Card = ( { cardData } ) => {
  const router = useRouter();
  const { letter, setName, productName } = router.query;    // only these two from URL

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
            set_name: setName, // only set name passed
          },
        } }
      >


        <div className="hover:scale-95 hover:duration-100 transition-transform">
          <img
            className="object-scale-down object-center w-full h-full max-h-96"
            as="image"
            priority="true"
            unoptimized="true"
            src={ getLocalImagePath( cardData.id ) }
            alt={ `Card Image - ${ cardData.productName }` }
            width="auto"
            height="auto"
          />
        </div>
      </Link>
    </>
  );
};

export default Card;
