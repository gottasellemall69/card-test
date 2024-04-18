// @/utils/localStorage.js
export const saveCardListToLocalStorage=(cardList) => {
  try {
    localStorage.setItem('cardList',JSON.stringify(cardList));
    console.log('Card list saved to localStorage:',cardList);
  } catch(error) {
    console.error('Error saving card list to localStorage:',error);
  }
};
