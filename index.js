const path = require('path')
const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')
const io = new Server(server)

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

function emitEvents () {
  const order = {
    uuid: '0x3e7b0819ee99a311ab1ad47844057237c80568013065bcc03e972bc1b70eaad7424a46612794dbb8000194937834250dc723ffa56091050b',
    price: '3010',
    side: 'sell',
    sellToken: '0x1',
    buyToken: '0x2'
  }
  console.log('🤑 New order')
  io.emit('NEW_ORDER', order)
}

setInterval(emitEvents, 5000)
