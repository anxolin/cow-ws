require('dotenv').config()

const path = require('path')
const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')
const io = new Server(server)
const { getSolvableOrders, chainId } = require('./api/gnosisProtocol')
const order = require('./data/order')
const Debug = require('debug')
const info = Debug('INFO-ws')
const warn = Debug('WARN-ws')
const debug = Debug('DEBUG-ws')

const IS_MOCK = process.env.MOCK === 'true'
const LOAD_ORDERS_WAIT_MS = process.env.LOAD_ORDERS_WAIT_MS || 2000 // Periodicity for checking new orders (and pushing the new ones to the UI)
const WAITING_FOR_COW_TIME = process.env.WAITING_FOR_COW_TIME || 30000 // Time threshold in which we are still in time to send a CoW order: ;
const TIME_FOR_SIGNING = process.env.TIME_FOR_SIGNING || 1500 // Minimum time needed to sign the tx (if the window for COWs is below this threshold, it won't show that order)

const knownOrders = new Set()

function getCowTimeMs(order) {
  const creationDate = new Date(order.creationDate)
  const cowTimeMs = Date.now() - creationDate.getTime()
  return cowTimeMs >= 0 ? cowTimeMs : 0
}

function emitOrder(order) {
  const cowTimeMs = getCowTimeMs(order)
  // const { uid, kind, creationDate, sellToken, buyToken, sellAmount, buyAmount } = order
  // const orderInfo = { uid, kind, creationDate, sellToken, buyToken, sellAmount, buyAmount }
  const { uid } = order
  if (cowTimeMs < (WAITING_FOR_COW_TIME - TIME_FOR_SIGNING)) { // TODO: We could discard orders very out of market price!
    info('🤑 Push Order', uid)
    debug('Order', JSON.stringify(order))
    io.emit('NEW_ORDER', { order, chainId })
  } else {
    warn(`⏱ Order won't wait for more COWs (${cowTimeMs / 1000}s since creation). Not pushing ${uid}`)
  }
}

let mockOrdersCount = 0
function emitMockOrder() {
  mockOrdersCount++
  if (mockOrdersCount > 2) {
    return
  }

  const isSellOrder = true // Math.random() < 0.5
  const sellAmount = 10 + '0'.repeat(18) // Math.floor(Math.random() * 10) + '0'.repeat(18)
  const buyAmount = 30000 + '0'.repeat(6) // Math.floor(Math.random() * 30000) + '0'.repeat(6)
  const randomTimeSinceCreation = Math.floor(Math.random() * WAITING_FOR_COW_TIME * 0.75)
  const creationDate = new Date(new Date().getTime() - randomTimeSinceCreation).toISOString()
  info('Create a fake CoW order with remaining CoW time for order', randomTimeSinceCreation / 1000, 'seconds. Create time: ', creationDate)

  const newOrder = {
    ...order,
    kind: isSellOrder ? 'sell' : 'buy',
    creationDate,
    sellAmount,
    buyAmount
  }

  emitOrder(newOrder)
}

function emitRandomMockOrder() {
  emitMockOrder()
  const delayMs = Math.floor(Math.random() * WAITING_FOR_COW_TIME * 0.35)
  info('Emit next random CoW order in ', delayMs / 1000, 'seconds')
  setTimeout(() => {
    emitRandomMockOrder()
  }, delayMs)
}

async function pushNewOrders() {
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
        info('⏱ Order Expired: Removing it from UID cache', order.uid)
        knownOrders.delete(order.uid)
      }, timeUntilExpiration)
    }
  }
}

async function watchAndEmit() {
  setTimeout(() => {
    pushNewOrders().catch(console.error).finally(watchAndEmit)
  }, LOAD_ORDERS_WAIT_MS)
}

function init() {
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/web/index.html'))
  })

  app.get('/api/wait-for-cow-time', (_req, res) => {
    res.json(WAITING_FOR_COW_TIME)
  })

  app.use(express.static('web'))

  io.on('connection', (socket) => {
    info('🐮 A user connected')
    socket.on('disconnect', () => {
      info('👋 A user disconnected')
    })
  })

  server.listen(3000, () => {
    info('🐮🛹 Listening on *:3000')

    if (IS_MOCK) {
      info('🥸 Mock')
      emitRandomMockOrder()
    } else {
      info('🐮 Watch for new orders!')
      watchAndEmit()
    }
  })
}

init()
