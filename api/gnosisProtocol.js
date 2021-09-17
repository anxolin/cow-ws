const axios = require('axios').default

const IS_DEV = process.env.NODE_ENV === 'development'
const NETWORK = process.env.NETWORK || 'mainnet'
const BASE_URL = getBaseUrl()

console.log('Using API base Url: ', BASE_URL)

function getBaseUrl () {
  if (IS_DEV) {
    return `https://protocol-rinkeby.${NETWORK}.gnosisdev.com`
  } else {
    return `https://protocol-${NETWORK}.gnosis.io`
  }
}

async function getSolvableOrders () {
  const { data } = await axios.get(BASE_URL + '/api/v1/solvable_orders')
  return data
}

module.exports = {
  getSolvableOrders
}
