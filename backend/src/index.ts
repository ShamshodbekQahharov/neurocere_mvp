import express, { Request, Response, NextFunction } from 'express'
import { createServer, Server as HttpServer } from 'http'
import helmet from 'helmet'
import cors from 'cors'
import dotenv from 'dotenv'
import { supabaseAdmin } from './config/supabase'
import { initializeSocket } from './config/socket'
import authRoutes from './routes/auth.routes'
import childrenRoutes from './routes/children.routes'
import reportsRoutes from './routes/reports.routes'
import messagesRoutes from './routes/messages.routes'
import notificationsRoutes from './routes/notifications.routes'
import aiRoutes from './routes/ai.routes'
import sessionsRoutes from './routes/sessions.routes'
import { notFoundHandler, errorHandler } from './middleware/error.middleware'

// Load environment variables from .env file
dotenv.config()

// Initialize Express application
const app = express()
const PORT = process.env.PORT || 5000

// Create HTTP server for Socket.IO
const httpServer: HttpServer = createServer(app)

// Initialize Socket.IO
initializeSocket(httpServer)

// Middleware Setup

// CORS configuration - allows requests from frontend applications
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL || '',
  'https://neurocere-mvp.vercel.app',
].filter(Boolean)

app.options('*', cors())

app.use(
  cors({
    origin: (origin, callback) => {
      // origin yo'q bo'lsa (Postman, server-to-server)
      if (!origin) {
        return callback(null, true)
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      console.log('CORS blocked:', origin)
      console.log('Allowed:', allowedOrigins)
      return callback(new Error('CORS ruxsat yo\'q'))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With'
    ],
    optionsSuccessStatus: 200
  })
)

// Security headers middleware
app.use(helmet())

// JSON body parser middleware
app.use(express.json())
app.use(
  express.urlencoded({
    extended: true,
  })
)

// API Routes

// Auth routes
app.use('/api/auth', authRoutes)

// Children routes
app.use('/api/children', childrenRoutes)

// Reports routes
app.use('/api/reports', reportsRoutes)

// Messages routes
app.use('/api/messages', messagesRoutes)

// Notifications routes
app.use('/api/notifications', notificationsRoutes)

// AI routes
app.use('/api/ai', aiRoutes)

// Sessions routes
app.use('/api/sessions', sessionsRoutes)

// Games routes
// import gamesRoutes from './routes/games.routes'
// app.use('/api/games', gamesRoutes)

// Health check endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  let databaseStatus = 'disconnected'
  
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
    
    if (error) throw error
    
    databaseStatus = 'connected'
  } catch (error) {
    console.error('Database connection test failed:', error)
    databaseStatus = 'disconnected'
  }
  
  res.status(200).json({
    success: true,
    app: 'NeuroCare API',
    cors_origins: allowedOrigins,
    environment: process.env.NODE_ENV || 'development',
    database: databaseStatus,
    timestamp: new Date().toISOString(),
  })
})

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to NeuroCare API',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/*',
      children: '/api/children/*',
      reports: '/api/reports/*',
      messages: '/api/messages/*',
      notifications: '/api/notifications/*',
      ai: '/api/ai/*',
      sessions: '/api/sessions/*',
      games: '/api/games/*',
    },
    ai_endpoints: {
      chatbot: 'POST /api/ai/chatbot (parent)',
      analyses: 'GET /api/ai/analyses (doctor)',
      game_adjust: 'POST /api/ai/game-adjust',
    },
    rate_limits: {
      ai: '10 requests/minute',
      general: '100 requests/minute',
    },
    socketio: {
      description: 'Real-time chat via Socket.IO',
      events: ['join_room', 'send_message', 'new_message', 'mark_read', 'message_read'],
    },
  })
})

// 404 Handler
app.use(notFoundHandler)

// Global Error Handler
app.use(errorHandler)

// Start Server
httpServer.listen(PORT, () => {
  console.log(`🚀 NeuroCare API running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔌 Socket.IO real-time chat ready`)
  console.log(`🧠 Claude AI integration ready`)
  console.log(`CORS origins: ${JSON.stringify(allowedOrigins)}`)
  console.log(`Health Check: http://localhost:${PORT}/api/health`)
})