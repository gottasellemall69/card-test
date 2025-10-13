const SAFE_USER_ID_PATTERN = /^[A-Za-z0-9@._-]{1,128}$/;

export const ensureSafeUserId = ( rawValue, { allowEmpty = false } = {} ) => {
  if ( typeof rawValue !== "string" ) {
    throw new Error( "Invalid user identifier" );
  }

  const trimmed = rawValue.trim();

  if ( trimmed.length === 0 ) {
    if ( allowEmpty ) {
      return "";
    }

    throw new Error( "Invalid user identifier" );
  }

  if ( trimmed.length > 128 ) {
    throw new Error( "User identifier is too long" );
  }

  if ( !SAFE_USER_ID_PATTERN.test( trimmed ) ) {
    throw new Error( "User identifier contains unsupported characters" );
  }

  return trimmed;
};

export const coerceStringField = ( rawValue, { maxLength = 256, allowEmpty = false } = {} ) => {
  if ( rawValue === null || rawValue === undefined ) {
    if ( allowEmpty ) {
      return "";
    }
    throw new Error( "Value is required" );
  }

  const stringValue = String( rawValue ).trim();

  if ( stringValue.length === 0 ) {
    if ( allowEmpty ) {
      return "";
    }
    throw new Error( "Value is required" );
  }

  if ( stringValue.length > maxLength ) {
    throw new Error( "Value exceeds maximum length" );
  }

  return stringValue;
};

export const coerceNumberField = ( rawValue, { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY } = {} ) => {
  const numericValue = Number( rawValue );

  if ( Number.isNaN( numericValue ) || !Number.isFinite( numericValue ) ) {
    throw new Error( "Invalid numeric value" );
  }

  if ( numericValue < min || numericValue > max ) {
    throw new Error( "Numeric value out of range" );
  }

  return numericValue;
};
