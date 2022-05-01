import pino from 'pino'
import config from './config'
import express from 'express'
import { Server, Socket } from 'socket.io'
import http from 'http'
import { randomUUID } from 'crypto'

const app = express()
const server = http.createServer(app)
const sock = new Server(server)

const logger = pino()

app.use(express.static('public'))

app.get('/api', (req, res) => {
    res.send('Hello, World!')
})

const playerSockets: Map<string, Socket> = new Map()

sock.on('connection', (socket) => {
    logger.info('A user is connected')
    const key = randomUUID()
    let playerName = key
    // playerSockets.set(key, socket)
    socket.emit('your key', key)
    socket.on('disconnect', (reason) => {
        logger.info('User disconnected: ' + reason)
        // playerSockets.delete(key)
        sock.sockets.emit('remove player', key)
    })
    socket.on('set name', (name) => {
        playerName = name
    })
    socket.on('chat message', (msg) => {
        logger.info('Socket received message: ' + msg)
        socket.broadcast.emit('player message', {
            message: msg,
            key: key,
            name: playerName
        })
    })
    socket.on('player position', ({ x, y }: { x: number, y: number }) => {
        // console.log(`Position for player ${playerName}: ${x}, ${y}`)
        socket.broadcast.emit('player position', {
            x: x,
            y: y,
            key: key,
            name: playerName
        })
    })
})

server.listen(config.port, () => {
    logger.info('Listener started on port ' + config.port)
})