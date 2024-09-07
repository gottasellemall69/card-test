// @/components/Card.js
import Image from "next/image";
import { useRouter } from 'next/router';
import { useCallback } from 'react';

export default function Card({ cardData }) {
  const router = useRouter();
  const { letter } = router.query;
  const getLocalImagePath = useCallback((cardId) => `/images/yugiohImages/${ String(cardId) }.jpg`, []);
  return (

    <a href={`/yugioh/sets/${ letter }/cards/CardDetails?card=${ cardData?.id }`}>
      <Image
        priority={true}
        loading={"eager"}
        unoptimized={true}
        src={getLocalImagePath(cardData?.id)}
        alt={`Card Image - ${ cardData?.name }`}
        width={275}
        height={325}
        className="w-full h-96 object-center object-scale-down hover:transition-transform hover:scale-105 hover:duration-100 hover:ease-in-out hover:will-change-transform hover:transform-gpu"
      />
    </a>

  );
}