// @/components/Card.js
import React, {useCallback} from 'react'
import {useRouter} from 'next/router'
import Image from 'next/image'
import Link from 'next/link'

export default function Card({cardData}) {
  const router=useRouter()
  const {letter}=router.query
  const getLocalImagePath=useCallback((cardId) => `/images/yugiohImages/${ String(cardId) }.jpg`, [])
  return (
    <div>
      <Link href={`/sets/${ letter }/cards/CardDetails?card=${ cardData?.id }`}>
        <Image
          unoptimized={true}
          src={getLocalImagePath(cardData?.id)}
          alt={`Card Image - ${ cardData?.name }`}
          width={275}
          height={325}
          className="w-auto h-96 mx-auto object-center object-scale-down hover:transition-transform hover:scale-105 hover:duration-100 hover:ease-in-out hover:will-change-transform hover:transform-gpu"
        />
      </Link>
    </div>
  )
}