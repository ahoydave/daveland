import express from 'express'
import pino from 'pino'

const app = express()
const logger = pino()

app.get('/', (req, res) => {
    res.send('Hello, World')
})

app.listen(3000, () => {
    logger.info('Listener started on port 3000')
})