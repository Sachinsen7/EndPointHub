import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import 'dotenv/config'
import authRoutes from './routes/authRoutes'
import apiRoutes from './routes/apiRoutes'
import keyRoutes from './routes/keyRoutes'
import proxyRoutes from './routes/proxyRoutes'

const app = express()

app.use(cors())
app.use(express.json())
app.use(morgan('dev'))


app.use('/api/auth', authRoutes)
app.use('/api/apis', apiRoutes)
app.use('/api/keys', keyRoutes)
app.use('/proxy', proxyRoutes)

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
