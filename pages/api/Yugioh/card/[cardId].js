// pages/api/Yugioh/card/[cardId].js
export default async function handler(req, res) {
  const { cardId } = req.query;

  try {
    const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${ cardId }&tcgplayer_data=true`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data || data.data.length === 0) {
      return res.status(404).json({ error: "Card not found" });
    }

    const card = data.data[0]; // Assuming the first item is the desired one
    const formattedCard = {
      id: card.id,
      name: card.name,
      type: card.type,
      desc: card.desc,
      frameType: card.frameType,
      race: card.race,
      archetype: card.archetype,
      ygoprodeck_url: card.ygoprodeck_url,
      card_sets: card.card_sets.map(set => ({
        set_name: set.set_name,
        set_code: set.set_code,
        set_rarity: set.set_rarity,
        set_edition: set.set_edition,
        set_price: set.set_price,
        set_url: set.set_url
      })),
      card_images: card.card_images.map(image => ({
        id: image.id,
        image_url: image.image_url,
        image_url_small: image.image_url_small,
        image_url_cropped: image.image_url_cropped
      })),
      card_prices: {
        cardmarket_price: card.card_prices[0]['cardmarket_price'],
        tcgplayer_price: card.card_prices[0]['tcgplayer_price'],
        ebay_price: card.card_prices[0]['ebay_price'],
        amazon_price: card.card_prices[0]['amazon_price'],
        coolstuffinc_price: card.card_prices[0]['coolstuffinc_price']
      }
    };

    res.status(200).json(formattedCard);
  } catch (error) {
    console.error('Fetching card data failed:', error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
