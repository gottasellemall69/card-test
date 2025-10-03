export const buildCollectionKey = ( card ) => {
  if ( !card ) return '';
  const productName = card.productName || card.name || '';
  const setName = card.setName || card?.card_sets[ 'set_name' ] || '';
  const number = card.number || card?.card_sets[ 'set_code' ] || '';
  const printing = card.printing || card?.card_sets[ 'set_edition' ] || '';
  const rarity = card.rarity || '';
  return [ productName, setName, number, printing, rarity ].map( ( value ) => value?.toString().trim() || '' ).join( '|' );
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
