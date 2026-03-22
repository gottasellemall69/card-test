const TRAILING_PAREN_SUFFIX = /\s*\([^)]*\)\s*$/;
const TRAILING_BRACKET_SUFFIX = /\s*\[[^\]]*\]\s*$/;
const TRAILING_RARITY_TOKEN =
  /\s*\b(?:UTR|UR|SR|CR|GR|QCR|PCR|PGR|SP|SE|PR|HR|R|C|SCR|SNR|GCR|GUR|GSR)\b\s*$/i;
const EDITION_TOKENS =
  /\b(?:\d+(?:st|nd|rd|th)\s+edition|1st edition|limited|unlimited)\b/gi;
const QUOTE_TOKENS = /['"]/g;
const DASH_TOKENS = /(?:-|–|â€“)/g;

const normalizeWhitespace = ( value = "" ) =>
  ( value ?? "" ).toString().replace( /\s+/g, " " ).trim();

const CARD_NAME_VARIANT_TRANSFORMS = [
  ( value ) => value.replace( TRAILING_PAREN_SUFFIX, " " ),
  ( value ) => value.replace( TRAILING_BRACKET_SUFFIX, " " ),
  ( value ) => value.replace( TRAILING_RARITY_TOKEN, " " ),
  ( value ) => value.replace( EDITION_TOKENS, " " ),
  ( value ) => value.replace( QUOTE_TOKENS, "" ),
  ( value ) => value.replace( DASH_TOKENS, " " ),
];

export const normalizeCardNameKey = ( value = "" ) =>
  normalizeWhitespace( value ).toLowerCase();

export const normalizeCardNameLooseKey = ( value = "" ) =>
  normalizeCardNameKey( value ).replace( /[^a-z0-9]+/g, "" );

export const buildCardNameCandidates = ( name = "" ) => {
  const seed = normalizeWhitespace( name );
  if ( !seed ) {
    return [];
  }

  const queue = [ seed ];
  const seen = new Set( [ normalizeCardNameKey( seed ) ] );
  const candidates = [ seed ];

  while ( queue.length > 0 ) {
    const current = queue.shift();

    for ( const transform of CARD_NAME_VARIANT_TRANSFORMS ) {
      const next = normalizeWhitespace( transform( current ) );
      const nextKey = normalizeCardNameKey( next );

      if ( !nextKey || seen.has( nextKey ) ) {
        continue;
      }

      seen.add( nextKey );
      candidates.push( next );
      queue.push( next );
    }
  }

  return candidates;
};

export const buildCardNameKeys = ( name = "" ) => {
  const candidates = buildCardNameCandidates( name );
  if ( candidates.length === 0 ) {
    return [];
  }

  const keys = [];
  const seen = new Set();

  candidates.forEach( ( candidate ) => {
    const key = normalizeCardNameKey( candidate );
    if ( key && !seen.has( key ) ) {
      seen.add( key );
      keys.push( key );
    }
  } );

  candidates.forEach( ( candidate ) => {
    const looseKey = normalizeCardNameLooseKey( candidate );
    if ( looseKey && !seen.has( looseKey ) ) {
      seen.add( looseKey );
      keys.push( looseKey );
    }
  } );

  return keys;
};
