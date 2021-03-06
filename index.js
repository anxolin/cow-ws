const path = require('path')
const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')
const io = new Server(server)
const { getSolvableOrders } = require('./api/gnosisProtocol')
const order = require('./data/order.json')

const IS_MOCK = process.env.MOCK === 'true'
const LOAD_ORDERS_WAIT_MS = 2000
const WAITING_FOR_COW_TIME = 30000
// const WAITING_FOR_COW_TIME = 5000

const knownOrders = new Set()

function getCowTimeMs (order) {
  const creationDate = new Date(order.creationDate)
  const cowTimeMs = (creationDate.getTime() - Date.now()) + WAITING_FOR_COW_TIME
  return cowTimeMs >= 0 ? cowTimeMs : 0
}

function emitOrder (order) {
  const cowTimeMs = getCowTimeMs(order)
  // const { uid, kind, creationDate, sellToken, buyToken, sellAmount, buyAmount } = order
  // const orderInfo = { uid, kind, creationDate, sellToken, buyToken, sellAmount, buyAmount }
  const orderInfo = order.uid
  if (cowTimeMs > 0) {
    console.log('🤑 Push Order', orderInfo)
    io.emit('NEW_ORDER', order)
  } else {
    console.warn('⏱ Order is too old. Not pushing', orderInfo)
  }
}

// let mockOrdersCount = 0
function emitMockOrder () {
  // mockOrdersCount++
  // if (mockOrdersCount > 2) {
  //   return
  // }

  const isSellOrder = Math.random() < 0.5
  const sellAmount = Math.random() * 5000
  const buyAmount = Math.random() * 10
  const randomTimeSinceCreation = Math.floor(Math.random() * WAITING_FOR_COW_TIME * 0.75)
  const creationDate = new Date(new Date().getTime() - randomTimeSinceCreation).toISOString()
  console.log('Create a fake CoW order with remaining CoW time for order', randomTimeSinceCreation / 1000, 'seconds. Create time: ', creationDate)

  const newOrder = {
    ...order,
    kind: isSellOrder ? 'sell' : 'buy',
    creationDate,
    sellAmount,
    buyAmount
  }
  emitOrder(newOrder)
}

function emitRandomMockOrder () {
  emitMockOrder()
  const delayMs = Math.floor(Math.random() * WAITING_FOR_COW_TIME * 0.2)
  console.log('Emit next random CoW order in ', delayMs / 1000, 'seconds')
  console.log()
  setTimeout(() => {
    emitRandomMockOrder()
  }, delayMs)
}

async function pushNewOrders () {
  const orders = await getSolvableOrders()
  for (const order of orders) {
    const { uid } = order
    if (!knownOrders.has(uid)) {
      knownOrders.add(uid)
      emitOrder(order)

      // No need to keep the orders linger than their expiration date
      const expirationDate = new Date(order.validTo * 1000)
      const timeUntilExpiration = expirationDate.getTime() - Date.now()
      setTimeout(() => {
        // Remove expired orders from UID cache
        console.log('⏱ Order Expired: Removing it from UID cache', order.uid)
        knownOrders.delete(order.uid)
      }, timeUntilExpiration)
    }
  }
}

async function watchAndEmit () {
  setTimeout(() => {
    pushNewOrders().catch(console.error).finally(watchAndEmit)
  }, LOAD_ORDERS_WAIT_MS)
}

function init () {
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/web/index.html'))
  })

  app.get('/api/wait-for-cow-time', (_req, res) => {
    res.json(WAITING_FOR_COW_TIME)
  })

  app.use(express.static('web'))

  io.on('connection', (socket) => {
    console.log('🐮 A user connected')
    socket.on('disconnect', () => {
      console.log('👋 A user disconnected')
    })
  })

  server.listen(3000, () => {
    console.log('🐮🛹 Listening on *:3000')

    if (IS_MOCK) {
      console.log('🥸 Mock')
      emitRandomMockOrder()
    } else {
      console.log('🐮 Watch for new orders!')
      watchAndEmit()
    }
  })
}

init()
