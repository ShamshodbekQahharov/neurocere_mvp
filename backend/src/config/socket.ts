import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { supabaseAdmin } from './supabase';
import { User } from '../types';

const JWT_SECRET = process.env.JWT_SECRET as string;

let io: Server;

/**
 * Initialize Socket.IO server
 */
export function initializeSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Socket middleware - authentication
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token as string;

      if (!token) {
        return next(new Error('Token topilmadi'));
      }

      let decoded: string | JwtPayload;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        return next(new Error('Token yaroqsiz'));
      }

      const payload = decoded as JwtPayload;

      if (payload.exp && payload.exp < Date.now() / 1000) {
        return next(new Error('Token muddati tugagan'));
      }

      // Get user from database
      const { data: userData, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', payload.userId)
        .single();

      if (error || !userData) {
        return next(new Error('Foydalanuvchi topilmadi'));
      }

      // Attach user to socket data
      (socket as any).user = userData as User;

      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as User;
    console.log(`User connected: ${user.full_name} (${user.role}) [${socket.id}]`);

    // Join room for a child
    socket.on('join_room', async (childId: string) => {
      try {
        if (!childId) {
          socket.emit('error', 'child_id kiritilmadi');
          return;
        }

        // Check if user has access to this child
        let hasAccess = false;

        if (user.role === 'doctor') {
          const { data: childData } = await supabaseAdmin
            .from('children')
            .select('id')
            .eq('id', childId)
            .eq('doctor_id', user.id)
            .eq('is_active', true)
            .single();
          hasAccess = !!childData;
        } else if (user.role === 'parent') {
          const { data: parentData } = await supabaseAdmin
            .from('parents')
            .select('child_id')
            .eq('user_id', user.id)
            .eq('child_id', childId)
            .single();
          hasAccess = !!parentData;
        }

        if (!hasAccess) {
          socket.emit('error', 'Ruxsat yo\'q');
          return;
        }

        const roomName = `child_${childId}`;
        socket.join(roomName);
        socket.emit('joined_room', { room: roomName });

        console.log(`User ${user.full_name} joined room: ${roomName}`);
      } catch (error) {
        console.error('Join room error:', error);
        socket.emit('error', 'Xato yuz berdi');
      }
    });

    // Send message
    socket.on('send_message', async (data: {
      childId: string;
      receiverId: string;
      content: string;
    }) => {
      try {
        const { childId, receiverId, content } = data;

        // Validation
        if (!childId || !receiverId || !content) {
          socket.emit('error', 'Barcha maydonlar to\'ldirilishi shart');
          return;
        }

        if (content.length > 2000) {
          socket.emit('error', 'Xabar 2000 belgidan oshmasligi kerak');
          return;
        }

        // Check receiver exists
        const { data: receiverData, error: receiverError } = await supabaseAdmin
          .from('users')
          .select('id, role, full_name')
          .eq('id', receiverId)
          .single();

        if (receiverError || !receiverData) {
          socket.emit('error', 'Qabul qiluvchi topilmadi');
          return;
        }

        // Check if both users have access to this child
        let userHasAccess = false;
        let receiverHasAccess = false;

        if (user.role === 'doctor') {
          const { data: childData } = await supabaseAdmin
            .from('children')
            .select('id')
            .eq('id', childId)
            .eq('doctor_id', user.id)
            .single();
          userHasAccess = !!childData;
        } else if (user.role === 'parent') {
          const { data: parentData } = await supabaseAdmin
            .from('parents')
            .select('child_id')
            .eq('user_id', user.id)
            .eq('child_id', childId)
            .single();
          userHasAccess = !!parentData;
        }

        if (!userHasAccess) {
          socket.emit('error', 'Ruxsat yo\'q');
          return;
        }

        // Check if receiver has access to this child
        if (receiverData.role === 'doctor') {
          const { data: childData } = await supabaseAdmin
            .from('children')
            .select('id')
            .eq('id', childId)
            .eq('doctor_id', receiverId)
            .single();
          receiverHasAccess = !!childData;
        } else if (receiverData.role === 'parent') {
          const { data: parentData } = await supabaseAdmin
            .from('parents')
            .select('child_id')
            .eq('user_id', receiverId)
            .eq('child_id', childId)
            .single();
          receiverHasAccess = !!parentData;
        }

        if (!receiverHasAccess) {
          socket.emit('error', 'Qabul qiluvchi bu bolaga ruxsat yo\'q');
          return;
        }

        // Save message to database
        const { data: messageData, error: messageError } = await supabaseAdmin
          .from('messages')
          .insert({
            sender_id: user.id,
            receiver_id: receiverId,
            child_id: childId,
            content,
            is_read: false,
            is_active: true,
          })
          .select(`
            *,
            sender:sender_id (
              id,
              full_name,
              role
            ),
            receiver:receiver_id (
              id,
              full_name,
              role
            )
          `)
          .single();

        if (messageError) {
          throw messageError;
        }

        // Create notification for receiver
        await supabaseAdmin.from('notifications').insert({
          user_id: receiverId,
          title: 'Yangi xabar',
          body: `${user.full_name} dan yangi xabar`,
          type: 'message',
          is_read: false,
        });

        // Emit to room
        const roomName = `child_${childId}`;
        io.to(roomName).emit('new_message', messageData);

        // Emit notification to specific user
        const receiverSockets = await io.in(roomName).fetchSockets();
        const receiverSocket = receiverSockets.find(
          (s: any) => (s as any).user?.id === receiverId
        );
        if (receiverSocket) {
          receiverSocket.emit('message_notification', {
            message: messageData,
          });
        }

        console.log(`Message sent from ${user.full_name} to ${receiverData.full_name}`);
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', 'Xabar yuborishda xatolik');
      }
    });

    // Mark message as read
    socket.on('mark_read', async (messageId: string) => {
      try {
        if (!messageId) {
          socket.emit('error', 'message_id kiritilmadi');
          return;
        }

        // Get message
        const { data: messageData, error: messageError } = await supabaseAdmin
          .from('messages')
          .select('*')
          .eq('id', messageId)
          .single();

        if (messageError || !messageData) {
          socket.emit('error', 'Xabar topilmadi');
          return;
        }

        // Check if user is the receiver
        if (messageData.receiver_id !== user.id) {
          socket.emit('error', 'Ruxsat yo\'q');
          return;
        }

        // Mark as read
        const { data: updatedData, error: updateError } = await supabaseAdmin
          .from('messages')
          .update({ is_read: true })
          .eq('id', messageId)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        // Emit to sender
        const roomName = `child_${messageData.child_id}`;
        io.to(roomName).emit('message_read', {
          messageId,
          readAt: new Date().toISOString(),
        });

        console.log(`Message ${messageId} marked as read by ${user.full_name}`);
      } catch (error) {
        console.error('Mark read error:', error);
        socket.emit('error', 'Xatolik yuz berdi');
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${user.full_name} [${socket.id}]`);
    });
  });

  return io;
}

/**
 * Get Socket.IO instance
 */
export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

/**
 * Emit to a specific room
 */
export function emitToRoom(room: string, event: string, data: any): void {
  if (io) {
    io.to(room).emit(event, data);
  }
}