// @/utils/localStorage.js
export const saveCardListToLocalStorage = ( cardList ) => {
  try {
    localStorage.setItem( 'cardList', JSON.stringify( cardList ) );
  } catch ( error ) {
    console.error( 'Error saving card list to localStorage:', error );
  }
};