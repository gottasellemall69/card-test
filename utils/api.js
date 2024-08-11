// @/utils/api.js

// Function to fetch card sets data from the given URL
async function fetchCardSetsData() {
  const url = 'https://mpapi.tcgplayer.com/v2/Catalog/SetNames?categoryId=2&active=true';
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch card sets data');
    }
    const data = await response.json();
    return data.results; // Adjust this if the returned structure is different
  } catch (error) {
    console.error('Error fetching card sets data:', error);
    return [];
  }
};

// Create a mapping between set names and numerical IDs
const setNameIdMap = {};

let cardSets = [];

(async () => {
  cardSets = await fetchCardSetsData();
  cardSets.forEach((set) => {
    setNameIdMap[set.name] = set.setNameId;
  });
})();

// Export the mapping for external use if needed
export { setNameIdMap };

const cardDataCache = {};

export async function getCardData(setName) {
  try {
    // Check if data for the set is already cached
    if (cardDataCache[setName]) {
      console.log('Using cached data for set:', setName);
      return cardDataCache[setName];
    };

    console.log('Fetching card data for set:', setName);
    const setNameId = setNameIdMap[setName];
    if (!setNameId) {
      throw new Error('Set name not found in mapping');
    }
    const response = await fetch(`https://infinite-api.tcgplayer.com/priceguide/set/${ setNameId }/cards/?rows=5000`);
    if (!response.ok) {
      throw new Error('Failed to fetch card data');
    }
    const data = await response.json();
    console.log('Received card data:', data);

    // Store the fetched data in the cache
    cardDataCache[setName] = data;
    return data;
  } catch (error) {
    console.error('Error fetching card data:', error);
    return null;
  }
};

export async function getCardSetsData() {
  try {
    // Fetch the card sets data from the URL
    const parsedData = await fetchCardSetsData();
    // Map setNameId to cleanSetName
    const mappedData = parsedData.reduce((acc, curr) => {
      acc[curr.setNameId] = curr.cleanSetName; // Adjust if necessary
      return acc;
    }, {});
    console.log('Card sets data parsed:', mappedData);
    return mappedData;
  } catch (error) {
    console.error('Error parsing card sets data:', error);
    return null;
  }
};

export const updateCardPrices = async (setName, cardData) => {
  try {
    const response = await fetch('/api/updateCardPrices', {
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
  const url = "https://db.ygoprodeck.com/api/v7/cardinfo.php?tcgplayer_data=true";
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
