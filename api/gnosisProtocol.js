const axios = require('axios').default
const BASE_URL = 'https://protocol-rinkeby.gnosis.io'

async function getSolvableOrders () {
  const { data } = await axios.get(BASE_URL + '/api/v1/solvable_orders')
  return data
}

module.exports = {
  getSolvableOrders
}

// loadOrders().catch(console.error)
