console.log('🐮🛹 C O W    S K A T E')

// eslint-disable-next-line no-undef
const socket = io()
window.socket = socket

const cowContainer = document.getElementById('cow-container')

function delay (ms) {
  return new Promise(resolve => setTimeout(() => resolve(), ms))
}

async function createNewOrder (order) {
  const item = document.createElement('div')
  item.className = 'item'
  const cow = document.createElement('cow')
  cow.className = 'cow'
  item.appendChild(cow)
  cowContainer.insertBefore(item, cowContainer.firstChild)

  await delay(5000) // wait for skate animation // TODO: improve? maybe wait for the animation
  item.classList.add('backflip')
  await delay(300) // wait for backflip animation TODO: improve? maybe wait for the animation
  item.classList.add('expired')
  await delay(1000)
  item.remove()
}

socket.on('NEW_ORDER', function (order) {
  console.log('🤑 New order!', order)
  createNewOrder(order).catch(console.error)
})
