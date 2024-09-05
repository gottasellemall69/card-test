import {getCardData, setNameIdMap} from '@/utils/api'

export default async function handler(req, res) {
  const {setNameId}=req.query

  try {
    // Retrieve the set name corresponding to the numerical setNameId
    const setName=Object.keys(setNameIdMap).find(
      (name) => setNameIdMap[name]===parseInt(setNameId)
    )

    if(!setName) {
      throw new Error('Set name not found for given setNameId')
    }

    // Fetch card data from external API based on setName
    const cardData=await getCardData(setName)
    res.status(200).json(cardData)
  } catch(error) {
    console.error('Error fetching card data:', error)
    res.status(500).json({message: 'Error fetching card data'})
  }
}
