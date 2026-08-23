import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Server = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Socket = any;

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/notifications' })
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket): void {
    try {
      const token = client.handshake.auth['token'] as string | undefined;

      if (!token) {
        this.logger.warn(`Cliente sem token — desconectando ${client.id}`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify<JwtPayload>(token);
      const userId = payload.sub;

      void client.join(`user:${userId}`);
      this.logger.log(`Cliente ${client.id} conectado — sala user:${userId}`);
    } catch {
      this.logger.warn(`Token inválido — desconectando ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Cliente ${client.id} desconectado`);
  }

  emitToUser(userId: string, event: string, data: unknown): void {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  @SubscribeMessage('ping')
  handlePing(): { event: string; data: string } {
    return { event: 'pong', data: 'pong' };
  }
}
