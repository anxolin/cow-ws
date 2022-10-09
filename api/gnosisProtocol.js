const axios = require('axios').default

const IS_DEV = process.env.NODE_ENV === 'development'
const NETWORK = process.env.NETWORK || 'mainnet'
const BASE_URL = getBaseUrl()

console.log('Using API base Url: ', BASE_URL)

function getBaseUrl() {
  if (IS_DEV) {
    return `https://barn.api.cow.fi/${NETWORK}`
  } else {
    return `https://api.cow.fi/${NETWORK}`
  }
}

async function getSolvableOrders() {
  const { data } = await axios.get(BASE_URL + '/api/v1/solvable_orders')

  return data
}

function getChainId(network) {
  switch (network) {
    case 'mainnet':
      return 1
    case 'goerli':
      return 5
    case 'xdai':
      return 100

    default:
      throw new Error('Unknown Chain: ' + network)
  }
}

module.exports = {
  getSolvableOrders,
  chainId: getChainId(NETWORK)
}
