// @/components/Sports/Buttons/CardSetButtons.js
function CardSetButtons({ cardSets, onSelectCardSet }) {
  return (
    <select className="rounded px-2 py-2 m-2" onChange={(e) => onSelectCardSet(e.target.value)}>
      {cardSets?.map((cardSet) => (
        <option key={cardSet} value={cardSet} defaultValue={'Choose a set...'}>
          {cardSet}
        </option>
      ))}
    </select>
  );
}

export default CardSetButtons;