console.log('🐮🛹 C O W    S K A T E')
const WAITING_FOR_COW_TIME = 30000

// eslint-disable-next-line no-undef
const socket = io()
window.socket = socket

const cowContainer = document.getElementById('cow-container')

function delay (ms) {
  return new Promise(resolve => setTimeout(() => resolve(), ms))
}

function getCowTimeMs (order) {
  const creationDate = new Date(order.creationDate)
  const cowTimeMs = (creationDate.getTime() - Date.now()) + WAITING_FOR_COW_TIME
  return cowTimeMs >= 0 ? cowTimeMs : 0
}

async function createNewOrder (order) {
  let cowTime = getCowTimeMs(order)
  console.log('cowTime', cowTime)

  // Item
  const item = document.createElement('div')
  item.className = 'item'

  // Cow
  const cow = document.createElement('div')
  cow.className = 'cow'
  cow.style.animationDuration = cowTime + 'ms'

  // Countdown
  const countdown = document.createElement('div')
  countdown.className = 'countdown'
  countdown.innerHTML = Math.ceil(cowTime / 1000)

  // Trolley
  const trolley = document.createElement('div')
  trolley.className = 'trolley'
  trolley.innerHTML = `\
<div class="trade">Buy 10 WETH</div>
<div class="price">3,005 DAI per WETH</div>
<div class="wheel1"></div>
<div class="wheel2"/></div>
<div class="towbar"/></div>
`

  // Start the countdown
  const interval = setInterval(() => {
    cowTime = getCowTimeMs(order)
    countdown.innerHTML = Math.ceil(cowTime / 1000)
    console.log('interval', cowTime)

    if (cowTime <= 0) {
      clearInterval(interval)
    }
  }, 500)

  // Add elements
  cow.appendChild(countdown)
  cow.appendChild(trolley)
  item.appendChild(cow)
  cowContainer.insertBefore(item, cowContainer.firstChild)

  // Wait for animations and destroy item
  await delay(cowTime) // wait for skate animation
  item.classList.add('backflip')
  await delay(300) // wait for backflip animation
  item.classList.add('expired')
  await delay(1000)
  item.remove() // destroy item
  clearInterval(interval)
}

// let count = 0
socket.on('NEW_ORDER', function (order) {
  console.log('🤑 New order!', order)
  // if (count === 0) {
  //   createNewOrder(order).catch(console.error)
  //   count++
  // }
  createNewOrder(order).catch(console.error)
})
