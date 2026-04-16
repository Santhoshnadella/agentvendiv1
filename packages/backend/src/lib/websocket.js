import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { logAudit } from './audit.js';
import { redis } from './redis.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

class WebSocketManager {
  constructor() {
    this.wss = null;
    this.rooms = new Map(); // room_id -> Set of WebSocket clients
    this.clients = new Map(); // ws -> { id, userId, rooms: Set }
  }

  init(server) {
    redis.init();
    this.wss = new WebSocketServer({ server, path: '/ws' });

    // Listen for cluster-wide broadcasts
    redis.subscribe('agentvendi:ws_broadcast', ({ roomId, event, payload }) => {
        this.broadcastLocal(roomId, event, payload);
    });

    this.wss.on('connection', (ws, req) => {
      // Extract token from query: ?token=...
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');
      
      let user = null;
      if (token) {
        try {
          user = jwt.verify(token, JWT_SECRET);
        } catch (e) {
          ws.close(1008, 'Invalid token');
          return;
        }
      }

      const clientId = Math.random().toString(36).substring(2, 15);
      this.clients.set(ws, { id: clientId, userId: user ? user.id : 'anonymous', rooms: new Set() });

      logAudit(user ? user.id : 'anonymous', 'WS_CONNECT', 'websocket', clientId, { url: req.url });

      // Ping-pong for stale connection detection
      ws.isAlive = true;
      ws.on('pong', () => { ws.isAlive = true; });

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(ws, data);
        } catch (err) {
          // Ignore invalid JSON
        }
      });

      ws.on('close', () => {
        this.leaveAllRooms(ws);
        this.clients.delete(ws);
      });
    });

    // Heartbeat checker
    setInterval(() => {
      this.wss.clients.forEach(ws => {
        if (!ws.isAlive) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }

  handleMessage(ws, data) {
    const { action, room, payload } = data;
    
    if (action === 'subscribe' && room) {
      this.joinRoom(ws, room);
      const clientInfo = this.clients.get(ws);
      logAudit(clientInfo.userId, 'WS_SUBSCRIBE', 'room', room, { clientId: clientInfo.id });
    } else if (action === 'unsubscribe' && room) {
      this.leaveRoom(ws, room);
    } else if (action === 'hitl_response') {
      // Trigger local event bus for HITL
      // Realistically we will emit this via an Event Emitter or directly resolve pending promises
      const clientInfo = this.clients.get(ws);
      if (clientInfo && payload && payload.approval_id) {
          hitlBus.emit(`approval:${payload.approval_id}`, {
              ...payload,
              resolved_by: clientInfo.userId
          });
      }
    }
  }

  joinRoom(ws, roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId).add(ws);
    
    const clientData = this.clients.get(ws);
    if (clientData) {
      clientData.rooms.add(roomId);
    }
  }

  leaveRoom(ws, roomId) {
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).delete(ws);
      if (this.rooms.get(roomId).size === 0) {
        this.rooms.delete(roomId);
      }
    }
    const clientData = this.clients.get(ws);
    if (clientData) {
      clientData.rooms.delete(roomId);
    }
  }

  leaveAllRooms(ws) {
    const clientData = this.clients.get(ws);
    if (clientData) {
      for (const roomId of clientData.rooms) {
        this.leaveRoom(ws, roomId);
      }
    }
  }

  // Broadcast to entire cluster via Redis
  broadcast(roomId, event, payload) {
    redis.publish('agentvendi:ws_broadcast', { roomId, event, payload });
  }

  // Actual local delivery
  broadcastLocal(roomId, event, payload) {
    if (!this.rooms.has(roomId)) return;
    
    const message = JSON.stringify({ event, payload, timestamp: Date.now() });
    for (const ws of this.rooms.get(roomId)) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    }
  }
}

// Simple event bus for HITL WebSocket responses
import { EventEmitter } from 'events';
export const hitlBus = new EventEmitter();

export const wsManager = new WebSocketManager();
