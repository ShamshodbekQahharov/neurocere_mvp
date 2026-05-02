import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const connectSocket = (token: string): Socket => {
  if (socket?.connected) return socket

  socket = io(
    import.meta.env.VITE_API_URL || 'http://localhost:5000',
    {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling']
    }
  )

  socket.on('connect', () => {
    console.log('Socket ulandi:', socket?.id)
  })

  socket.on('disconnect', (reason) => {
    console.log('Socket uzildi:', reason)
  })

  socket.on('connect_error', (error) => {
    console.error('Socket xato:', error.message)
  })

  return socket
}

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export const getSocket = (): Socket | null => socket

export const joinChildRoom = (childId: string): void => {
  socket?.emit('join_room', childId)
}

export const sendSocketMessage = (data: {
  childId: string
  content: string
  receiverId: string
}): void => {
  socket?.emit('send_message', data)
}

export const onNewMessage = (
  callback: (message: any) => void
): void => {
  socket?.on('new_message', callback)
}

export const onMessageRead = (
  callback: (messageId: string) => void
): void => {
  socket?.on('message_read', callback)
}

export const offNewMessage = (): void => {
  socket?.off('new_message')
}

export const offMessageRead = (): void => {
  socket?.off('message_read')
}

export const offAllMessages = (): void => {
  socket?.off('new_message')
  socket?.off('message_read')
}