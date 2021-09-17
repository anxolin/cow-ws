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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/web/index.html'))
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
})

function emitMockOrder () {
  const newOrder = {
    ...order,
    creationDate: new Date().toISOString()
  }
  const { uid, kind, creationDate, sellToken, buyToken, sellAmount, buyAmount } = newOrder
  console.log('🤑 Push Order', { uid, kind, creationDate, sellToken, buyToken, sellAmount, buyAmount })
  io.emit('NEW_ORDER', newOrder)
}

function emitRandomMockOrder () {
  const delayMs = Math.floor(Math.random() * 3000)
  setTimeout(() => {
    emitMockOrder()
    emitRandomMockOrder()
  }, delayMs)
}

async function pushNewOrders () {
  const orders = await getSolvableOrders()
  console.log('Orders: ', orders)
}

async function watchAndEmit () {
  setTimeout(() => {
    pushNewOrders().catch(console.error).finally(watchAndEmit)
  }, LOAD_ORDERS_WAIT_MS)
}

if (IS_MOCK) {
  emitMockOrder()
  emitRandomMockOrder()
} else {
  watchAndEmit()
}
