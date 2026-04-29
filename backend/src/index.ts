import express, { Request, Response, NextFunction } from 'express';
import { createServer, Server as HttpServer } from 'http';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabaseAdmin } from './config/supabase';
import { initializeSocket } from './config/socket';
import authRoutes from './routes/auth.routes';
import childrenRoutes from './routes/children.routes';
import reportsRoutes from './routes/reports.routes';
import messagesRoutes from './routes/messages.routes';
import notificationsRoutes from './routes/notifications.routes';
import { notFoundHandler, errorHandler } from './middleware/error.middleware';

// Load environment variables from .env file
dotenv.config();

// Initialize Express application
const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server for Socket.IO
const httpServer: HttpServer = createServer(app);

// Initialize Socket.IO
initializeSocket(httpServer);

// Middleware Setup

// Security headers middleware - protects against common vulnerabilities
app.use(helmet());

// CORS configuration - allows requests from frontend application
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// JSON body parser middleware - parses incoming JSON requests
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

// API Routes

// Auth routes
app.use('/api/auth', authRoutes);

// Children routes
app.use('/api/children', childrenRoutes);

// Reports routes
app.use('/api/reports', reportsRoutes);

// Messages routes
app.use('/api/messages', messagesRoutes);

// Notifications routes
app.use('/api/notifications', notificationsRoutes);

// Health check endpoint with DB connectivity test
app.get('/api/health', async (req: Request, res: Response) => {
  let databaseStatus = 'disconnected';
  
  try {
    // Test database connectivity with a simple query
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      throw error;
    }
    
    databaseStatus = 'connected';
  } catch (error) {
    console.error('Database connection test failed:', error);
    databaseStatus = 'disconnected';
  }
  
  return res.status(200).json({
    success: true,
    app: 'NeuroCare API',
    version: '1.0.0',
    database: databaseStatus,
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint - API information
app.get('/', (req: Request, res: Response) => {
  return res.status(200).json({
    message: 'Welcome to NeuroCare API',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/*',
      children: '/api/children/*',
      reports: '/api/reports/*',
      messages: '/api/messages/*',
      notifications: '/api/notifications/*',
      sessions: '/api/sessions/*',
      ai: '/api/ai/*',
      games: '/api/games/*',
    },
    socketio: {
      description: 'Real-time chat via Socket.IO',
      events: {
        join_room: 'Join child-specific room',
        send_message: 'Send a new message',
        new_message: 'Receive new message',
        mark_read: 'Mark message as read',
        message_read: 'Message read confirmation',
        disconnect: 'User disconnected',
      },
    },
  });
});

// 404 Handler - catch all undefined routes
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

// Start Server
httpServer.listen(PORT, () => {
  console.log(`🚀 NeuroCare API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 Socket.IO real-time chat ready`);
  console.log(`Health Check: http://localhost:${PORT}/api/health`);
});

export default app;