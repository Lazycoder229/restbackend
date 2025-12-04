import { IncomingMessage, ServerResponse } from "http";
import { Server as HttpServer } from "http";
import * as crypto from "crypto";

/**
 * WebSocket connection state
 */
enum WebSocketState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}

/**
 * WebSocket frame opcodes
 */
enum OpCode {
  CONTINUATION = 0x0,
  TEXT = 0x1,
  BINARY = 0x2,
  CLOSE = 0x8,
  PING = 0x9,
  PONG = 0xa,
}

/**
 * WebSocket connection
 */
export class WebSocketConnection {
  public readyState: WebSocketState = WebSocketState.CONNECTING;
  private socket: any;

  constructor(socket: any) {
    this.socket = socket;
    this.readyState = WebSocketState.OPEN;
  }

  /**
   * Send text message
   */
  send(data: string | Buffer): void {
    if (this.readyState !== WebSocketState.OPEN) {
      throw new Error("WebSocket is not open");
    }

    const payload = typeof data === "string" ? Buffer.from(data) : data;
    const frame = this.createFrame(OpCode.TEXT, payload);
    this.socket.write(frame);
  }

  /**
   * Send JSON
   */
  sendJson(data: any): void {
    this.send(JSON.stringify(data));
  }

  /**
   * Close connection
   */
  close(code: number = 1000, reason: string = ""): void {
    if (
      this.readyState === WebSocketState.CLOSING ||
      this.readyState === WebSocketState.CLOSED
    ) {
      return;
    }

    this.readyState = WebSocketState.CLOSING;
    const payload = Buffer.alloc(2 + Buffer.byteLength(reason));
    payload.writeUInt16BE(code, 0);
    payload.write(reason, 2);

    const frame = this.createFrame(OpCode.CLOSE, payload);
    this.socket.write(frame);
    this.socket.end();
    this.readyState = WebSocketState.CLOSED;
  }

  /**
   * Ping
   */
  ping(data?: string): void {
    const payload = data ? Buffer.from(data) : Buffer.alloc(0);
    const frame = this.createFrame(OpCode.PING, payload);
    this.socket.write(frame);
  }

  /**
   * Create WebSocket frame
   */
  private createFrame(opcode: OpCode, payload: Buffer): Buffer {
    const length = payload.length;
    let frame: Buffer;
    let offset = 2;

    if (length < 126) {
      frame = Buffer.allocUnsafe(2 + length);
      frame[1] = length;
    } else if (length < 65536) {
      frame = Buffer.allocUnsafe(4 + length);
      frame[1] = 126;
      frame.writeUInt16BE(length, 2);
      offset = 4;
    } else {
      frame = Buffer.allocUnsafe(10 + length);
      frame[1] = 127;
      frame.writeUInt32BE(0, 2);
      frame.writeUInt32BE(length, 6);
      offset = 10;
    }

    frame[0] = 0x80 | opcode; // FIN bit + opcode
    payload.copy(frame, offset);

    return frame;
  }
}

/**
 * WebSocket Gateway metadata
 */
export const WS_GATEWAY_METADATA = Symbol("wsGateway");
export const WS_MESSAGE_METADATA = Symbol("wsMessage");

/**
 * WebSocket gateway decorator
 *
 * @example
 * ```typescript
 * @WebSocketGateway({ namespace: '/chat' })
 * export class ChatGateway {
 *   @SubscribeMessage('message')
 *   handleMessage(client: WebSocketConnection, data: any) {
 *     client.send(JSON.stringify({ echo: data }));
 *   }
 * }
 * ```
 */
export function WebSocketGateway(options: {
  namespace?: string;
  path?: string;
}): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(WS_GATEWAY_METADATA, options, target);
  };
}

/**
 * Subscribe to message decorator
 */
export function SubscribeMessage(event: string): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const messages =
      Reflect.getMetadata(WS_MESSAGE_METADATA, target.constructor) || [];
    messages.push({ event, handler: propertyKey });
    Reflect.defineMetadata(WS_MESSAGE_METADATA, messages, target.constructor);
  };
}

/**
 * WebSocket server
 */
export class WebSocketServer {
  private gateways = new Map<string, any>();
  private clients = new Map<string, WebSocketConnection>();

  /**
   * Register gateway
   */
  registerGateway(gateway: any): void {
    const options = Reflect.getMetadata(
      WS_GATEWAY_METADATA,
      gateway.constructor
    );
    const path = options?.path || options?.namespace || "/ws";
    this.gateways.set(path, gateway);
  }

  /**
   * Handle WebSocket upgrade
   */
  handleUpgrade(req: IncomingMessage, socket: any, _head: Buffer): void {
    const url = req.url || "/ws";
    const gateway = this.gateways.get(url);

    if (!gateway) {
      socket.destroy();
      return;
    }

    // WebSocket handshake
    const key = req.headers["sec-websocket-key"];
    if (!key) {
      socket.destroy();
      return;
    }

    const acceptKey = this.generateAcceptKey(key as string);
    const responseHeaders = [
      "HTTP/1.1 101 Switching Protocols",
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Accept: ${acceptKey}`,
      "",
      "",
    ].join("\r\n");

    socket.write(responseHeaders);

    const connection = new WebSocketConnection(socket);
    const clientId = crypto.randomUUID();
    this.clients.set(clientId, connection);

    // Handle incoming messages
    socket.on("data", (data: Buffer) => {
      try {
        const { opcode, payload } = this.parseFrame(data);

        if (opcode === OpCode.TEXT) {
          const message = JSON.parse(payload.toString());
          this.handleMessage(gateway, connection, message);
        } else if (opcode === OpCode.PING) {
          connection.send(payload); // Send pong
        } else if (opcode === OpCode.CLOSE) {
          connection.close();
        }
      } catch (error) {
        console.error("WebSocket error:", error);
      }
    });

    socket.on("close", () => {
      this.clients.delete(clientId);
      if (gateway.handleDisconnect) {
        gateway.handleDisconnect(connection);
      }
    });

    socket.on("error", (error: Error) => {
      console.error("WebSocket error:", error);
      this.clients.delete(clientId);
    });

    // Call connection handler
    if (gateway.handleConnection) {
      gateway.handleConnection(connection);
    }
  }

  /**
   * Handle message
   */
  private handleMessage(
    gateway: any,
    client: WebSocketConnection,
    message: any
  ): void {
    const messages =
      Reflect.getMetadata(WS_MESSAGE_METADATA, gateway.constructor) || [];
    const handler = messages.find((m: any) => m.event === message.event);

    if (handler && gateway[handler.handler]) {
      gateway[handler.handler](client, message.data);
    }
  }

  /**
   * Generate accept key for handshake
   */
  private generateAcceptKey(key: string): string {
    const GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
    return crypto
      .createHash("sha1")
      .update(key + GUID)
      .digest("base64");
  }

  /**
   * Parse WebSocket frame
   */
  private parseFrame(buffer: Buffer): { opcode: OpCode; payload: Buffer } {
    const firstByte = buffer[0];
    const opcode = firstByte & 0x0f;
    const secondByte = buffer[1];
    const isMasked = (secondByte & 0x80) === 0x80;
    let payloadLength = secondByte & 0x7f;
    let offset = 2;

    if (payloadLength === 126) {
      payloadLength = buffer.readUInt16BE(2);
      offset = 4;
    } else if (payloadLength === 127) {
      payloadLength = buffer.readUInt32BE(6);
      offset = 10;
    }

    let payload: Buffer;

    if (isMasked) {
      const maskingKey = buffer.slice(offset, offset + 4);
      offset += 4;
      const masked = buffer.slice(offset, offset + payloadLength);
      payload = Buffer.alloc(payloadLength);

      for (let i = 0; i < payloadLength; i++) {
        payload[i] = masked[i] ^ maskingKey[i % 4];
      }
    } else {
      payload = buffer.slice(offset, offset + payloadLength);
    }

    return { opcode, payload };
  }

  /**
   * Broadcast to all clients
   */
  broadcast(data: string | Buffer): void {
    for (const client of this.clients.values()) {
      if (client.readyState === WebSocketState.OPEN) {
        client.send(data);
      }
    }
  }

  /**
   * Attach to HTTP server
   */
  attach(server: HttpServer): void {
    server.on("upgrade", (req, socket, head) => {
      this.handleUpgrade(req, socket, head);
    });
  }
}

/**
 * Server-Sent Events (SSE)
 */
export class SSEConnection {
  constructor(private res: ServerResponse) {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
  }

  /**
   * Send event
   */
  send(event: string, data: any): void {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    this.res.write(payload);
  }

  /**
   * Send message
   */
  sendMessage(data: any): void {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    this.res.write(payload);
  }

  /**
   * Close connection
   */
  close(): void {
    this.res.end();
  }
}

/**
 * SSE decorator
 */
export function Sse(): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    Reflect.defineMetadata("http:sse", true, target, propertyKey);
  };
}

/**
 * Create WebSocket server
 */
export function createWebSocketServer(): WebSocketServer {
  return new WebSocketServer();
}
