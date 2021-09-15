console.log('🐮🛹 C O W    S K A T E')

// eslint-disable-next-line no-undef
const socket = io()
window.socket = socket

const cowContainer = document.getElementById('cow-container')

function createNewOrder (order) {
  const item = document.createElement('div')
  item.className = 'item'
  const cow = document.createElement('cow')
  cow.className = 'cow'
  item.appendChild(cow)
  cowContainer.insertBefore(item, cowContainer.firstChild)
}

socket.on('NEW_ORDER', function (order) {
  console.log('🤑 New order!', order)
  createNewOrder(order)
})
