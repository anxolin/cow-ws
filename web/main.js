console.log('🐮🛹 C O W')

const BASE_URL = 'http://localhost:3000'

// eslint-disable-next-line no-undef
const socket = io()
window.socket = socket

// State
let WAIT_FOR_COW_TIME // constant, loaded from API
let numOrders = 0

// References
const widgetDiv = document.getElementById('cowWidget')

function delay (ms) {
  return new Promise(resolve => setTimeout(() => resolve(), ms))
}

async function getWaitForCowTime () {
  const response = await fetch(BASE_URL + '/api/wait-for-cow-time')
  return response.json()
}

function getRemainingCowTimeMs (order) {
  const creationDate = new Date(order.creationDate)
  const timeSinceCreation = new Date() - creationDate
  const cowTimeMs = WAIT_FOR_COW_TIME - timeSinceCreation
  return cowTimeMs >= 0 ? cowTimeMs : 0
}

function showNoOrdersText () {
  if (numOrders === 0) {
    widgetDiv.innerHTML = '<div class="noOrdersText">No CoW orders right now.</div>'
  }
}

function resetIfNoOrders () {
  if (numOrders === 0) {
    widgetDiv.innerHTML = ''
  }
}

function createRowDiv (order, remainingCowTime) {
  const { uid, kind, sellToken, buyToken, sellAmount, buyAmount } = order
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
  const isCounterOrderSell = kind !== 'sell'
  const counterOrder = {
    kind: isCounterOrderSell ? 'sell' : 'buy',
    // TODO: add slippage!
    sellAmount: buyAmount,
    buyAmount: sellAmount,
    sellToken,
    buyToken,
    // TODO: Get the token name!
    buyTokenLabel: 'WETH',
    sellTokenLabel: 'DAI'
  }
  const orderAmount = isCounterOrderSell ? counterOrder.sellAmount : counterOrder.buyAmount
  const orderToken = isCounterOrderSell ? counterOrder.sellTokenLabel : counterOrder.buyTokenLabel
  const price = parseInt(sellAmount) / parseInt(buyAmount)
  const trolley = document.createElement('div')
  trolley.className = 'trolley'
  trolley.innerHTML = `\
<div class="trade">${counterOrder.kind} ${orderAmount.toFixed(4)} ${orderToken}</div>
<div class="price"><strong>${price.toFixed(4)}</strong> ${counterOrder.buyTokenLabel} per ${counterOrder.sellTokenLabel}</div>
<div class="wheel1"></div>
<div class="wheel2"/></div>
<div class="towbar"/></div>`

  // Trolley
  const tradeButton = document.createElement('button')
  tradeButton.className = 'tradeButton'
  tradeButton.innerText = 'Trade NOW!'
  tradeButton.addEventListener('click', () => {
    console.log('Trade order ', uid, order)

    const { kind, buyToken, sellToken, buyAmount, sellAmount } = order

    window.signAndPostOrder({
      signingScheme: 'eip712',
      kind,
      buyToken,
      sellToken,
      buyAmount,
      sellAmount,
      // receiver,
      appData: '', // TODO: Creage one for Cow
      // feeAmount,
      partiallyFillable: false
      // sellTokenBalance, // TODO:
      // buyTokenBalance // TODO:
    })

    // 'kind',
    // 'signingScheme',

    // 'feeAmount',
    // 'partiallyFillable',
    // 'sellTokenBalance',
    // 'buyTokenBalance'
  })

  // Add elements
  cowDiv.appendChild(countdown)
  cowDiv.appendChild(trolley)
  skateableDiv.appendChild(cowDiv)
  rowDiv.appendChild(skateableDiv)
  rowDiv.appendChild(tradeButton)

  return [rowDiv, countdown]
}

async function createNewOrder (order) {
  // If theres no orders. Empty message
  resetIfNoOrders()
  numOrders++

  let remainingCowTime = getRemainingCowTimeMs(order)
  console.log('Add new CoW order, with remaining time ', remainingCowTime / 1000, 'seconds')

  const [rowDiv, countdown] = createRowDiv(order, remainingCowTime)
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
  rowDiv.remove() // destroy item
  clearInterval(interval)

  // If there's no more orders left, we show a message
  numOrders--
  showNoOrdersText()
}

async function init () {
  WAIT_FOR_COW_TIME = await getWaitForCowTime()
  console.log('Using CoW API base Url: ', BASE_URL)
  console.log(`Orders will work ${WAIT_FOR_COW_TIME} for a CoW`)

  showNoOrdersText()

  // let count = 0
  console.log('Watch for new orders!')
  socket.on('NEW_ORDER', function (order) {
    console.log('🤑 New order!', order)
    // if (count === 0) {
    //   createNewOrder(order).catch(console.error)
    //   count++
    // }
    createNewOrder(order).catch(console.error)
  })
}

init().catch(console.error)
