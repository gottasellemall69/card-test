"use client";

import Image from "next/image";
import Link from 'next/link';
import { useRouter } from 'next/router';

const LOCAL_IMAGE_BASE_PATH = "/images/yugiohImages";
const FALLBACK_IMAGE = "/images/backgrounds/yugioh/background.svg";

const buildImagePath = ( cardId ) => `${ LOCAL_IMAGE_BASE_PATH }/${ String( cardId ) }.jpg`;

const Card = ( { cardData } ) => {
  const router = useRouter();
  const { letter, setName, rarity } = router.query;

  const cardId = cardData?.id;
  const productName = cardData?.productName ?? "Yu-Gi-Oh! Card";
  const imageSrc = cardId ? buildImagePath( cardId ) : FALLBACK_IMAGE;

  return (
    <Link
      href={ {
        pathname: "/yugioh/sets/[letter]/cards/card-details",
        query: {
          card: cardId,
          letter: letter ?? "",
          set_name: setName ?? "",
          set_rarity: rarity ?? "",
          source: "set",
        },
      } }
      prefetch={ false }
      aria-label={ `View details for ${ productName }` }
    >
      <Image
        as="image"
        unoptimized="true"
        className="lg:object-cover object-scale-down object-center w-full mx-auto h-96 aspect-1"
        src={ imageSrc }
        alt={ `Card Image - ${ productName }` }
        width={ 1600 }
        height={ 450 }
        priority={ true }
        draggable={ false }
      />
    </Link>
  );
};

export default Card;
