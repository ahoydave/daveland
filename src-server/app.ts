import pino from 'pino'
import config from './config'
import express from 'express'
import { Server } from 'socket.io'
import http from 'http'

const app = express()
const server = http.createServer(app)
const sock = new Server(server)

const logger = pino()

app.use(express.static('public'))

app.get('/api', (req, res) => {
    res.send('Hello, World!')
})

sock.on('connection', (socket) => {
    logger.info('A user is connected')
    socket.on('disconnect', (reason) => {
        logger.info('User disconnected: ' + reason)
    })
    socket.on('chat message', (msg) => {
        logger.info('Socket received message: ' + msg)
        sock.sockets.emit('chat message', 'Dave: ' + msg)
    })
})

server.listen(config.port, () => {
    logger.info('Listener started on port ' + config.port)
})