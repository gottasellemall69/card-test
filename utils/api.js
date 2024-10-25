const API_ENDPOINT = "https://mpapi.tcgplayer.com/v2/Catalog/SetNames?active=true&categoryId=2";

// Cache for set name to ID mapping and card data
let setNameIdCache = null;
const cardDataCache = {};

// Fetches set data dynamically and builds setNameIdMap
async function fetchSetData() {
  if (setNameIdCache) return setNameIdCache;

  try {
    const response = await fetch(API_ENDPOINT);
    const data = await response.json();

    if (data.errors?.length > 0) {
      console.error("Error fetching set data:", data.errors);
      return null;
    }

    // Build the setNameIdMap from fetched data
    setNameIdCache = data.results.reduce((map, set) => {
      map[set.name] = set.setNameId;
      return map;
    }, {});

    return setNameIdCache;
  } catch (error) {
    console.error("Error fetching set data:", error);
    return null;
  }
}

// Export the mapping for external use
export async function getSetNameIdMap() {
  return await fetchSetData();
}

// Fetches card data for a specific set name
export async function getCardData(setName) {
  try {
    // Get the setNameIdMap to retrieve the numerical ID for the set
    const setNameIdMap = await getSetNameIdMap();
    const setNameId = setNameIdMap[setName];

    if (cardDataCache[setName]) {
      console.log("Using cached data for set:", setName);
      return cardDataCache[setName];
    }

    if (!setNameId) {
      throw new Error("Set name not found in mapping");
    }

    console.log("Fetching card data for set:", setName);
    const response = await fetch(
      `https://${process.env.GET_CARD_DATA_API}/priceguide/set/${setNameId}/cards/?rows=5000`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch card data");
    }

    const data = await response.json();
    console.log("Received card data:", data);

    cardDataCache[setName] = data; // Cache the fetched data
    return data;
  } catch (error) {
    console.error("Error fetching card data:", error);
    return null;
  }
}

// Fetches and maps card set data (setNameId to cleanSetName)
export async function getCardSetsData() {
  const setNameIdMap = await getSetNameIdMap();
  if (!setNameIdMap) return null;

  return Object.entries(setNameIdMap).reduce((acc, [name, id]) => {
    acc[id] = name;
    return acc;
  }, {});
}

export const updateCardPrices = async (setName, cardData) => {
  try {
    const response = await fetch('/api/Yugioh/updateCardPrices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ setName, cardData }),
    });

    if (!response.ok) {
      throw new Error('Failed to update card prices');
    }
  } catch (error) {
    console.error('Error updating card prices:', error);
  }
};


export async function fetchCardData() {
  const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?tcgplayer_data=true`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data.data; // The API wraps results in a "data" property.
  } catch (error) {
    console.error("Error fetching card data:", error);
    throw error; // Rethrow to handle it in the calling context.
  }
};
