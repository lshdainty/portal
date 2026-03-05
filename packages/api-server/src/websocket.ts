import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import type { NotifyPayload } from '@agent-kanban/shared';

let io: SocketIOServer | null = null;

export function initWebSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  io.on('connection', (socket) => {
    console.log(`Dashboard connected: ${socket.id}`);

    socket.on('join_project', (projectId: number) => {
      socket.join(`project:${projectId}`);
      console.log(`Socket ${socket.id} joined project:${projectId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Dashboard disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function broadcastEvent(payload: NotifyPayload): void {
  if (!io) return;
  io.to(`project:${payload.project_id}`).emit(payload.event, payload.data);
}
