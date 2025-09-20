export const buildCollectionKey = ( card ) => {
  if ( !card ) return '';
  const productName = card.productName || card.name || '';
  const setName = card.setName || card.set_name || '';
  const number = card.number || card.set_code || '';
  const printing = card.printing || card.set_edition || '';
  return [ productName, setName, number, printing ].map( ( value ) => value?.toString().trim() || '' ).join( '|' );
};

export const buildCollectionMap = ( cards ) => {
  if ( !Array.isArray( cards ) ) return {};
  return cards.reduce( ( map, card ) => {
    const key = buildCollectionKey( card );
    if ( key ) {
      map[ key ] = card;
    }
    return map;
  }, {} );
};
