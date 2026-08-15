import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

const LOCAL_IMAGE_BASE_PATH = '/images/yugiohImages';
const FALLBACK_IMAGE = '/images/backgrounds/yugioh/background.svg';

const buildImagePath = ( cardId ) => LOCAL_IMAGE_BASE_PATH + '/' + String( cardId ) + '.jpg';

const getPrimaryCardImage = ( card ) =>
  Array.isArray( card?.card_images )
    ? card.card_images.find( ( image ) => image?.id || image?.image_url || image?.image_url_cropped || image?.image_url_small )
    : null;

const getCardImageSrc = ( card ) => {
  const primaryCardImage = getPrimaryCardImage( card );
  const localImageId =
    card?.cardImageId ??
    card?.cardDetailId ??
    card?.cardId ??
    card?.id ??
    primaryCardImage?.id ??
    null;

  const localImageSrc = localImageId ? buildImagePath( localImageId ) : null;
  const remoteImageSrc =
    card?.remoteImageUrl ||
    card?.image_url ||
    primaryCardImage?.image_url ||
    primaryCardImage?.image_url_cropped ||
    primaryCardImage?.image_url_small ||
    null;

  return localImageSrc || remoteImageSrc || FALLBACK_IMAGE;
};

const Card = ( { cardData } ) => {
  const router = useRouter();
  const { letter, setName, rarity } = router.query;

  const primaryCardImage = getPrimaryCardImage( cardData );
  const cardIdentity =
    cardData?.cardId ??
    cardData?.cardImageId ??
    cardData?.cardDetailId ??
    cardData?.id ??
    primaryCardImage?.id ??
    null;
  const cardName = cardData?.productName ?? cardData?.name ?? 'Yu-Gi-Oh! Card';
  const setNameValue = cardData?.setName ?? cardData?.set ?? setName ?? '';
  const setCode = cardData?.number ?? cardData?.set_code ?? '';
  const edition = cardData?.printing ?? cardData?.edition ?? '';
  const cardRarity = cardData?.rarity ?? rarity ?? '';
  const imageSrc = getCardImageSrc( cardData );
  const detailQuery = {
    letter: letter ?? '',
    source: 'set',
  };

  if ( cardIdentity ) {
    detailQuery.card = String( cardIdentity );
  }

  if ( cardName ) {
    detailQuery.card_name = cardName;
  }

  if ( setNameValue ) {
    detailQuery.set_name = setNameValue;
  }

  if ( setCode ) {
    detailQuery.set_code = setCode;
  }

  if ( cardRarity ) {
    detailQuery.rarity = cardRarity;
    detailQuery.set_rarity = cardRarity;
  }

  if ( edition ) {
    detailQuery.edition = edition;
  }

  return (
    <Link
      className='group/card block w-full [perspective:1500px]'
      href={ {
        pathname: '/yugioh/sets/[letter]/cards/card-details',
        query: detailQuery,
      } }
      prefetch={ false }
      aria-label={ 'View details for ' + cardName }
    >
      <div className='relative mx-auto aspect-[260/360] w-full max-w-[16rem] overflow-hidden rounded-[6px] border border-white/10 bg-black/40 shadow-lg transition duration-300 [transform-style:preserve-3d] [contain:layout_paint_style] group-hover/card:border-indigo-400/60'>
        <Image
          as='image'
          unoptimized={ true }
          className='h-full w-full object-cover object-top lg:object-scale-down'
          src={ imageSrc }
          alt={ 'Card Image - ' + cardName }
          width={ 1600 }
          height={ 500 }
          priority={ true }
          draggable={ false }
        />
        <div
          aria-hidden='true'
          className='absolute -inset-px rounded-[6px] bg-[linear-gradient(180deg,rgba(2,6,23,0.42),rgba(2,6,23,0.56)),linear-gradient(40deg,rgba(99,102,241,0.28),rgba(2,6,23,0.18))] opacity-95 transition-opacity duration-300 group-hover/card:opacity-100'
        />
        <span className='absolute bottom-4 right-4 z-10 flex min-h-11 min-w-11 items-center justify-center rounded-[4px] border border-white/30 bg-black/75 px-4 py-2 text-center text-sm font-semibold uppercase leading-tight tracking-[0.08em] text-white shadow-lg transition duration-300 group-hover/card:border-indigo-400 group-hover/card:bg-indigo-500/20 group-hover/card:text-indigo-100'>
          Details
        </span>
      </div>
    </Link>
  );
};

export default Card;
