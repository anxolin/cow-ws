/* eslint-disable no-undef */
console.log('🐮🛹 C O W')

const BASE_URL = 'http://localhost:3000'
const COUNTER_ORDER_APP_DATA = '0x0000000000000000000000000000000000000000000000000000000000000000'
const COUNTER_ORDER_DURATION_SECONDS = 1200 // 20min

const BigNumber = ethers.BigNumber
const TEN_THOUSANDS = BigNumber.from(10_000) // 0.15%  (15/10000)
const COUNTER_ORDER_SLIPPAGE_BIPS = BigNumber.from(15) // 0.15%  (15/10000)
const TEN_BN = new BN('10')

const INFURA_KEY = 'ac472d3645b649dfb21a602a0fb4a372'
const infuraProviders = {}

const ERC20_ABI = [
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [
      {
        name: '',
        type: 'string'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        name: '_spender',
        type: 'address'
      },
      {
        name: '_value',
        type: 'uint256'
      }
    ],
    name: 'approve',
    outputs: [
      {
        name: '',
        type: 'bool'
      }
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'totalSupply',
    outputs: [
      {
        name: '',
        type: 'uint256'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        name: '_from',
        type: 'address'
      },
      {
        name: '_to',
        type: 'address'
      },
      {
        name: '_value',
        type: 'uint256'
      }
    ],
    name: 'transferFrom',
    outputs: [
      {
        name: '',
        type: 'bool'
      }
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [
      {
        name: '',
        type: 'uint8'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [
      {
        name: '_owner',
        type: 'address'
      }
    ],
    name: 'balanceOf',
    outputs: [
      {
        name: 'balance',
        type: 'uint256'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [
      {
        name: '',
        type: 'string'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        name: '_to',
        type: 'address'
      },
      {
        name: '_value',
        type: 'uint256'
      }
    ],
    name: 'transfer',
    outputs: [
      {
        name: '',
        type: 'bool'
      }
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [
      {
        name: '_owner',
        type: 'address'
      },
      {
        name: '_spender',
        type: 'address'
      }
    ],
    name: 'allowance',
    outputs: [
      {
        name: '',
        type: 'uint256'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    payable: true,
    stateMutability: 'payable',
    type: 'fallback'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'owner',
        type: 'address'
      },
      {
        indexed: true,
        name: 'spender',
        type: 'address'
      },
      {
        indexed: false,
        name: 'value',
        type: 'uint256'
      }
    ],
    name: 'Approval',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'from',
        type: 'address'
      },
      {
        indexed: true,
        name: 'to',
        type: 'address'
      },
      {
        indexed: false,
        name: 'value',
        type: 'uint256'
      }
    ],
    name: 'Transfer',
    type: 'event'
  }
]

// eslint-disable-next-line no-undef
const socket = io()
window.socket = socket

// State
let WAIT_FOR_COW_TIME // constant, loaded from API
let numOrders = 0

// References
const widgetDiv = document.getElementById('cowWidget')

function getInfuraProvider(chainId) {
  let provider = infuraProviders[chainId]

  if (!provider) {
    provider = new ethers.providers.InfuraProvider(chainId, INFURA_KEY)
    infuraProviders[chainId] = provider
  }

  return provider
}

async function getToken(address, networkId) {
  const provider = getInfuraProvider(networkId)

  // TODO: Cache contract
  const tokenContract = new ethers.Contract(address, ERC20_ABI, provider)

  const [symbol, decimals] = await Promise.all([
    tokenContract.symbol(),
    tokenContract.decimals()
  ])

  return { address, symbol, decimals }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(() => resolve(), ms))
}

async function getWaitForCowTime() {
  const response = await fetch(BASE_URL + '/api/wait-for-cow-time')
  return response.json()
}

function getRemainingCowTimeMs(order) {
  const creationDate = new Date(order.creationDate)
  const timeSinceCreation = new Date() - creationDate
  const cowTimeMs = WAIT_FOR_COW_TIME - timeSinceCreation
  return cowTimeMs >= 0 ? cowTimeMs : 0
}

function showNoOrdersText() {
  if (numOrders === 0) {
    widgetDiv.innerHTML = '<div class="noOrdersText">No CoW orders right now.</div>'
  }
}

function resetIfNoOrders() {
  if (numOrders === 0) {
    widgetDiv.innerHTML = ''
  }
}

async function connectAndPostOrder(order) {
  const { rawOrder } = order

  const [account, chainId] = await Promise.all([
    window.connectWallet(),
    window.getChainId()
  ])
  return window.signAndPostOrder({
    account,
    rawOrder: {
      ...rawOrder,
      receiver: account
    },
    chainId
  })
}

async function getCounterOrder(order, account, chainId) {
  const { kind: kindOriginal, sellToken, buyToken, sellAmount: sellAmountOriginal, buyAmount: buyAmountOriginal, feeAmount } = order

  let sellAmount, buyAmount, kind, amountParameter
  if (kindOriginal === 'sell') {
    // If Sell X for at least Y
    //    - Buy X for at most Y * (1+slippage)
    kind = 'buy'
    buyAmount = sellAmountOriginal
    sellAmount = BigNumber.from(buyAmountOriginal)
      .mul(TEN_THOUSANDS + COUNTER_ORDER_SLIPPAGE_BIPS)
      .div(TEN_THOUSANDS)
      .toString()
    amountParameter = {
      buyAmountAfterFee: buyAmount
    }
  } else {
    // If Buy X for at most Y
    //    - sell X for at least Y * (1-slippage)
    kind = 'sell'
    sellAmount = buyAmountOriginal
    buyAmount = BigNumber.from(sellAmountOriginal)
      .mul(TEN_THOUSANDS - COUNTER_ORDER_SLIPPAGE_BIPS)
      .div(TEN_THOUSANDS)
      .toString()
    amountParameter = {
      sellAmountAfterFee: sellAmount
    }
  }

  console.log({ kindOriginal, kind })

  const rawOrder = {
    signingScheme: 'eip712',
    kind,
    sellToken: buyToken,
    buyToken: sellToken,
    validTo: Math.ceil(Date.now() / 1000 + COUNTER_ORDER_DURATION_SECONDS),
    appData: COUNTER_ORDER_APP_DATA, // TODO: Create one for Cow
    partiallyFillable: false,
    sellTokenBalance: 'erc20',
    buyTokenBalance: 'erc20',
    receiver: null // will be added later when connected
  }

  const quoteParams = {
    ...rawOrder,
    from: account,
    sellAmountBeforeFee: sellAmount,
    priceQuality: 'optimal',
    ...amountParameter
  }
  console.log('Get quote with Params', quoteParams)
  const { quote } = await window.getQuote(quoteParams, chainId)

  return {
    rawOrder: quote,
    buyToken: await getToken(buyToken, chainId),
    sellToken: await getToken(sellToken, chainId)
  }
}

function formatAmount(amountAtoms, token) {
  const amount = new BN(amountAtoms)
    .div(TEN_BN.pow(new BN(token.decimals || 18)))

  // return amount.toFixed(4)
  return amount.toString()
}

function formatPrice(sellAmountAtoms, sellToken, buyAmountAtoms, buyToken) {
  const { decimals: sellTokenDecimals = 18 } = sellToken
  const { decimals: buyTokenDecimals = 18 } = buyToken
  // 3000 USDC / 1 WETH
  // 6  18
  // 3000 / 100000000
  // (6-18)
  const amount = new BN(sellAmountAtoms)
    .mul(TEN_BN.pow(new BN(sellTokenDecimals - buyTokenDecimals)))
    .div(new BN(buyAmountAtoms))

  // return amount.toFixed(4)
  return amount.toString()
}

function createTrolleyDiv(counterOrder) {
  const { rawOrder, sellToken, buyToken } = counterOrder
  const { uid, kind, sellAmount, buyAmount } = rawOrder

  const isSell = kind !== 'sell'
  const orderAmount = isSell ? sellAmount : buyAmount
  const orderToken = isSell ? sellToken : buyToken
  const priceFormatted = formatPrice(sellAmount, sellToken, buyAmount, buyToken)

  const trolley = document.createElement('div')
  trolley.setAttribute('data-uid', uid)
  trolley.className = 'trolley'
  trolley.innerHTML = `\
<div class="trade">${kind} ${formatAmount(orderAmount, orderToken)} ${orderToken.symbol}</div>
<div class="price"><strong>${priceFormatted}</strong> ${buyToken.symbol} per ${sellToken.symbol}</div>
<div class="wheel1"></div>
<div class="wheel2"/></div>
<div class="towbar"/></div>`

  return trolley
}

async function createRowDiv(order, remainingCowTime, chainId) {
  console.log('Create row for order', order)
  const { uid } = order
  const account = await window.connectWallet()
  const counterOrder = await getCounterOrder(order, account, chainId)
  console.log('Order', order)
  console.log('Counter order', counterOrder)

  const rowDiv = document.createElement('div')
  rowDiv.className = 'row'

  // Skateable div
  const skateableDiv = document.createElement('div')
  skateableDiv.className = 'skateable'

  // Cow
  const cowDiv = document.createElement('div')
  cowDiv.className = 'cow'
  cowDiv.style.animationDuration = remainingCowTime + 'ms'

  // Countdown
  const countdown = document.createElement('div')
  countdown.className = 'countdown'
  countdown.innerText = Math.ceil(remainingCowTime / 1000)

  // Trolley
  const trolley = createTrolleyDiv(counterOrder)

  // TradeButton
  const tradeButton = document.createElement('button')
  tradeButton.className = 'tradeButton'
  tradeButton.innerText = 'Trade NOW!'
  tradeButton.addEventListener('click', () => {
    console.log('Trade order ', uid, counterOrder)
    connectAndPostOrder(counterOrder).catch(console.error)
  })

  // Add elements
  cowDiv.appendChild(countdown)
  cowDiv.appendChild(trolley)
  skateableDiv.appendChild(cowDiv)
  rowDiv.appendChild(skateableDiv)
  rowDiv.appendChild(tradeButton)

  return [rowDiv, countdown]
}

async function createNewOrder(order, chainId) {
  // If theres no orders. Empty message
  resetIfNoOrders()
  numOrders++

  let remainingCowTime = getRemainingCowTimeMs(order)
  console.log('Add new CoW order, with remaining time ', remainingCowTime / 1000, 'seconds')

  const [rowDiv, countdown] = await createRowDiv(order, remainingCowTime, chainId)
  widgetDiv.appendChild(rowDiv)

  // Start the countdown
  const interval = setInterval(() => {
    remainingCowTime = getRemainingCowTimeMs(order)
    countdown.innerText = Math.ceil(remainingCowTime / 1000)

    if (remainingCowTime <= 0) {
      clearInterval(interval)
    }
  }, 500)

  // Wait for animations and destroy item
  await delay(remainingCowTime) // wait for skate animation
  rowDiv.classList.add('backflip')
  await delay(300) // wait for backflip animation
  rowDiv.classList.add('expired')
  await delay(1000)
  rowDiv.classList.add('disappear')
  await delay(500)
  rowDiv.remove() // destroy item
  clearInterval(interval)

  // If there's no more orders left, we show a message
  numOrders--
  showNoOrdersText()
}

async function init() {
  WAIT_FOR_COW_TIME = await getWaitForCowTime()
  console.log('Using CoW API base Url: ', BASE_URL)
  console.log(`Solvers will wait ${WAIT_FOR_COW_TIME / 1000}s for a CoW`)

  showNoOrdersText()

  // let count = 0
  console.log('Watch for new orders!')
  socket.on('NEW_ORDER', function (newOrderParams) {
    const { order, chainId } = newOrderParams
    console.log('🤑 New order!', order)
    // if (count === 0) {
    //   createNewOrder(order).catch(console.error)
    //   count++
    // }
    createNewOrder(order, chainId).catch(console.error)
  })
}

init().catch(console.error)

window.getCounterOrder = getCounterOrder

// {
//   "creationDate": "2022-10-09T01:48:23.773931Z",
//   "owner": "0x46535cbc3fa574c32ea392d4f89c518290597072",
//   "uid": "0xb53a425a9da900502c28aa3ffde82d628aa31dc3680a69fb2e61d6cb0c85aa3746535cbc3fa574c32ea392d4f89c518290597072634228dd",
//   "availableBalance": "79200000000000000000000",
//   "executedBuyAmount": "0",
//   "executedSellAmount": "0",
//   "executedSellAmountBeforeFees": "0",
//   "executedFeeAmount": "0",
//   "invalidated": false,
//   "status": "open",
//   "settlementContract": "0x9008d19f58aabd9ed0d60971565aa8510560ab41",
//   "fullFeeAmount": "39793590281598345216",
//   "isLiquidityOrder": false,
//   "sellToken": "0x6b175474e89094c44da98b954eedeac495271d0f",
//   "buyToken": "0x64aa3364f17a4d01c6f1751fd97c2bd3d7e7f1d5",
//   "receiver": "0x46535cbc3fa574c32ea392d4f89c518290597072",
//   "sellAmount": "39962828515381334482944",
//   "buyAmount": "3869285390646",
//   "validTo": 1665280221,
//   "appData": "0x75e6b5423002bdd19d00acdb46727e4ccb8514b4c13375c8abdac4b7c6e585bf",
//   "feeAmount": "37171484618665517056",
//   "kind": "sell",
//   "partiallyFillable": false,
//   "sellTokenBalance": "erc20",
//   "buyTokenBalance": "erc20",
//   "signingScheme": "eip712",
//   "signature": "0x935b15555d6c1132592b19fd1c1fe4b749f43baf935066aad5bc2d74cfb801445d5b125e048963c338ee29352cba82bbb6c0bee121d2afee9126b11456ce76251c"
// }
