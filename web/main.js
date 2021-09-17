console.log('🐮🛹 C O W')
// const WAITING_FOR_COW_TIME = 30000
const WAITING_FOR_COW_TIME = 5000

// eslint-disable-next-line no-undef
const socket = io()
window.socket = socket

let numOrders = 0

const widgetDiv = document.getElementById('cowWidget')

function delay (ms) {
  return new Promise(resolve => setTimeout(() => resolve(), ms))
}

function getRemainingCowTimeMs (order) {
  const creationDate = new Date(order.creationDate)
  const cowTimeMs = (creationDate.getTime() - Date.now()) + WAITING_FOR_COW_TIME
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
  const trolley = document.createElement('div')
  trolley.className = 'trolley'
  trolley.innerHTML = `\
<div class="trade">Buy 10 WETH</div>
<div class="price">3,005 DAI per WETH</div>
<div class="wheel1"></div>
<div class="wheel2"/></div>
<div class="towbar"/></div>`

  // Trolley
  const tradeButton = document.createElement('button')
  tradeButton.className = 'tradeButton'
  tradeButton.innerText = 'Trade NOW!'
  tradeButton.addEventListener('click', () => {
    alert('Trade order ' + JSON.stringify(order.uid))
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

showNoOrdersText()

// let count = 0
socket.on('NEW_ORDER', function (order) {
  console.log('🤑 New order!', order)
  // if (count === 0) {
  //   createNewOrder(order).catch(console.error)
  //   count++
  // }
  createNewOrder(order).catch(console.error)
})
