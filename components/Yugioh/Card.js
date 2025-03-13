import Image from "next/image";
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback } from 'react';

const Card = ( { cardData } ) => {
  const router = useRouter();
  const { letter, setName, card } = router.query;
  const getLocalImagePath = useCallback( ( cardId ) => `/images/yugiohImages/${ String( cardId ) }.jpg`, [] );
  return (
    <>
      <div>
        <Link
          as={ `/yugioh/sets/${ letter }/cards/CardDetails?card=${ String( encodeURIComponent( cardData.name ) ) }` }
          href={ {
            pathname: "/yugioh/sets/[letter]/cards/CardDetails",
            query: {
              card: cardData.id,
              set_name: setName,
              letter: letter
            }
          } } passHref
        >
          <div className="object-center object-scale-down hover:transition-transform hover:scale-105 hover:duration-100 hover:ease-in-out hover:will-change-transform hover:transform-gpu">
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

    </>
  );
};

export default Card;