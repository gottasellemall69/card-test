type SportsProductLike = {
  id?: string | number | null;
  consoleUri?: string | null;
  productName?: string | null;
};

type SportsDataPage<TProduct extends SportsProductLike = SportsProductLike> = {
  products?: TProduct[];
};

const normalizeKeyPart = ( value: unknown ) => String( value ?? '' ).trim().toLowerCase();

export const buildSportsProductKey = ( product: SportsProductLike | null | undefined ) => {
  const id = normalizeKeyPart( product?.id );
  if ( id ) {
    return `id:${ id }`;
  }

  const consoleUri = normalizeKeyPart( product?.consoleUri );
  if ( consoleUri ) {
    return `uri:${ consoleUri }`;
  }

  const productName = normalizeKeyPart( product?.productName );
  return productName ? `name:${ productName }` : '';
};

export const dedupeSportsData = <TPage extends SportsDataPage>(
  data: TPage[] | null | undefined
): TPage[] => {
  if ( !Array.isArray( data ) ) {
    return [];
  }

  const seen = new Set<string>();

  return data.map( ( page ) => {
    if ( !page || !Array.isArray( page.products ) ) {
      return page;
    }

    const products = page.products.filter( ( product ) => {
      const key = buildSportsProductKey( product );
      if ( !key ) {
        return true;
      }

      if ( seen.has( key ) ) {
        return false;
      }

      seen.add( key );
      return true;
    } );

    return { ...page, products };
  } );
};

export const flattenSportsProducts = <TProduct extends SportsProductLike>(
  data: SportsDataPage<TProduct>[] | null | undefined
): TProduct[] =>
  dedupeSportsData( data ).flatMap( ( page ) =>
    Array.isArray( page?.products ) ? page.products : []
  );
