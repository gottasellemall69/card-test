// @/utils/organizeCardSets.js
export const organizeCardSets=(cards) => {
  const setsByLetter={};
  cards.forEach((card) => {
    card.card_sets?.forEach((set) => {
      const letter=set.set_name.charAt(0).toUpperCase();
      if(!setsByLetter[letter]) {
        setsByLetter[letter]=[];
      }
      if(!setsByLetter[letter].find(existingSet => existingSet.set_name===set.set_name)) {
        setsByLetter[letter].push(set);
      }
    });
  });
  return setsByLetter;
};

