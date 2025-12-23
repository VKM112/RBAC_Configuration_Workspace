import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import authRouter from './routes/auth.js'
import { requireAuth } from './middleware/auth.js'
import permissionsRouter from './routes/permissions.js'
import rolesRouter from './routes/roles.js'


const app = express()

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }),
)
app.use(express.json())

// API routes
app.use('/api/auth', authRouter)
app.use('/api/permissions', requireAuth, permissionsRouter)
app.use('/api/roles', requireAuth, rolesRouter)

// Serve Vite build in production
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distPath = path.resolve(__dirname, '../dist')

app.use(express.static(distPath))
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
})
