const EXPLORER_URL = 'https://explorer.cow.fi/orders'

// Globals
// eslint-disable-next-line no-undef
const ethers = window.ethers
const ethereum = window.ethereum

const SIGNING_SCHEMAS = ['eip712', 'ethsign', 'eip1271', 'presign']

const ORDER_TYPE = [
  { name: 'sellToken', type: 'address' },
  { name: 'buyToken', type: 'address' },
  { name: 'receiver', type: 'address' },
  { name: 'sellAmount', type: 'uint256' },
  { name: 'buyAmount', type: 'uint256' },
  { name: 'validTo', type: 'uint32' },
  { name: 'appData', type: 'bytes32' },
  { name: 'feeAmount', type: 'uint256' },
  { name: 'kind', type: 'string' },
  { name: 'partiallyFillable', type: 'bool' },
  { name: 'sellTokenBalance', type: 'string' },
  { name: 'buyTokenBalance', type: 'string' }
]

const NETWORKS = {
  1: 'mainnet',
  4: 'rinkeby',
  100: 'xdai'
}

const MANDATORY_ORDER_FIELDS = [
  'kind',
  // 'signingScheme',
  'sellToken',
  'sellAmount',
  'buyToken',
  'buyAmount',
  'receiver',
  'validTo',
  'appData',
  'feeAmount',
  'partiallyFillable',
  'sellTokenBalance',
  'buyTokenBalance'
]

const provider = getProvider()
const signer = provider.getSigner()
const settlement = getSettlementContract(signer)

function getProvider () {
  return new ethers.providers.Web3Provider(window.ethereum)
}

function parseQuery (q) {
  const pairs = (q[0] === '?' ? q.substr(1) : q).split('&')
  const query = {}
  for (const pair of pairs) {
    const [key, value] = pair.split('=')
    query[decodeURIComponent(key)] = decodeURIComponent(value || '')
  }
  return query
}

function orderbookUrl (network) {
  const { orderbook } = parseQuery(window.location.search)
  const baseUrl = orderbook || `https://api.cow.fi/${network}`
  return `${baseUrl}/api/v1/orders`
}

function getSettlementContract (signer) {
  return new ethers.Contract(
    '0x9008D19f58AAbD9eD0D60971565AA8510560ab41',
    [
      'function setPreSignature(bytes orderUid, bool signed)'
    ],
    signer
  )
}
function getDomain (chainId) {
  return {
    name: 'Gnosis Protocol',
    version: 'v2',
    chainId,
    verifyingContract: '0x9008D19f58AAbD9eD0D60971565AA8510560ab41'
  }
}

function getSigningSchemaByName (signingSchemaApiName) {
  const signingSchema = SIGNING_SCHEMAS.indexOf(signingSchemaApiName)

  if (signingSchema === -1) {
    throw new Error('Unknown signing schema: ' + signingSchemaApiName)
  }

  return signingSchema
}

function validateOrder (order) {
  console.log('validateOrder', order)
  MANDATORY_ORDER_FIELDS.forEach(field => {
    if (order[field] === undefined) {
      throw new Error(`The order must specify the "${field}"`)
    }
  })
}

async function signOrder ({ chainId, rawOrder, account, signingScheme = 0 }) {
  // const { signingScheme } = rawOrder

  const domain = getDomain(chainId)

  let signature
  switch (signingScheme) {
    case 0: // eip712
      signature = await signer._signTypedData(
        domain,
        { Order: ORDER_TYPE },
        rawOrder
      )
      break
    case 1: // 'ethsign'
      signature = await signer.signMessage(
        ethers.utils.arrayify(
          ethers.utils._TypedDataEncoder.hash(
            domain,
            { Order: ORDER_TYPE },
            rawOrder
          )
        )
      )
      break
    case 2: // 'presign'
      signature = account.toLowerCase()
      break
    default:
      throw new Error('Unknown signing scheme: ' + signingScheme)
  }

  return signature
}

async function connectWallet () {
  const addresses = await ethereum.request({ method: 'eth_requestAccounts' })

  if (addresses.length === 0) {
    throw new Error('No account addresses has been returned by the wallet')
  }

  return addresses[0]
}

async function getChainId () {
  const { chainId } = await provider.getNetwork()
  const network = NETWORKS[chainId]
  if (network === undefined) {
    throw new Error(`unsupported network ${chainId}`)
  }

  return chainId
}

async function postSignedOrder ({ rawOrder, signature, account, chainId }) {
  const { signingScheme } = rawOrder
  const response = await fetch(
    orderbookUrl(network),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...rawOrder,
        signature,
        signingScheme,
        from: account
      })
    }
  )
  const body = await response.json()
  if (!response.ok) {
    throw new Error(body.description)
  }
  const orderUid = body

  if (signingScheme === 'presign') {
    await settlement.setPreSignature(orderUid, true)
  }

  return orderUid
}

async function signAndPostOrder ({ account, rawOrder, chainId }) {
  validateOrder(rawOrder)

  // Sign raw order
  console.log('Sign', rawOrder)
  const signature = await signOrder({ chainId, rawOrder, account })

  // Post order API
  const orderUid = await postSignedOrder({ rawOrder, signature, account, chainId })

  const explorerUrl = `${EXPLORER_URL}/orders/${orderUid}`
  alert(explorerUrl)
  console.log('explorerUrl', explorerUrl)
}

window.signAndPostOrder = signAndPostOrder
window.connectWallet = connectWallet
window.getChainId = getChainId
window.getSigningSchemaByName = getSigningSchemaByName
