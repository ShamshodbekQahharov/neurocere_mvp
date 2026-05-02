import express, { Request, Response } from 'express'
import { createServer, Server as HttpServer } from 'http'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
dotenv.config()

import { initializeSocket } from './config/socket'
import authRoutes from './routes/auth.routes'
import childrenRoutes from './routes/children.routes'
import reportsRoutes from './routes/reports.routes'
import messagesRoutes from './routes/messages.routes'
import sessionsRoutes from './routes/sessions.routes'
import aiRoutes from './routes/ai.routes'
import notificationsRoutes from './routes/notifications.routes'

const app = express()
const PORT = process.env.PORT || 5000

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL || '',
  'https://neurocere-mvp.vercel.app',
].filter(Boolean)

app.options('*', cors())

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    return callback(new Error('CORS ruxsat yoq'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}))

app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const { supabaseAdmin } = await import('./config/supabase')
    await supabaseAdmin.from('users').select('count').limit(1)
    res.json({
      success: true,
      app: 'NeuroCare API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: 'connected',
      cors_origins: allowedOrigins,
      timestamp: new Date().toISOString()
    })
  } catch {
    res.json({
      success: true,
      app: 'NeuroCare API',
      database: 'disconnected',
      timestamp: new Date().toISOString()
    })
  }
})

// ROUTES
app.use('/api/auth', authRoutes)
app.use('/api/children', childrenRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/messages', messagesRoutes)
app.use('/api/sessions', sessionsRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/notifications', notificationsRoutes)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route topilmadi: ${req.method} ${req.originalUrl}`
  })
})

// HTTP server
const httpServer: HttpServer = createServer(app)
initializeSocket(httpServer)

httpServer.listen(PORT, () => {
  console.log(`NeuroCare API running on port ${PORT}`)
  console.log(`Health: http://localhost:${PORT}/api/health`)
  console.log('Routes:')
  console.log('  POST /api/auth/register')
  console.log('  POST /api/auth/login')
  console.log('  GET  /api/auth/me')
  console.log('  GET  /api/children')
  console.log('  POST /api/reports')
  console.log('  GET  /api/sessions')
})

export default app