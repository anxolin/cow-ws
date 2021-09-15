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
  console.log('a user connected')
})

server.listen(3000, () => {
  console.log('🐮🛹 Listening on *:3000')
})
