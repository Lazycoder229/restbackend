# WebSocket Service Documentation

## Overview

The WebSocketService provides WebSocket server functionality for real-time, bidirectional communication between clients and server in Fynix applications.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Basic Usage](#basic-usage)
- [WebSocket Gateway](#websocket-gateway)
- [API Reference](#api-reference)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketConnection,
} from "./builtin/websocket.service";
```

---

## Basic Usage

### Create WebSocket Gateway

```typescript
@WebSocketGateway({ namespace: "/chat" })
export class ChatGateway {
  @SubscribeMessage("message")
  handleMessage(client: WebSocketConnection, data: any) {
    console.log("Received:", data);
    client.send(JSON.stringify({ echo: data }));
  }

  @SubscribeMessage("join")
  handleJoin(client: WebSocketConnection, data: any) {
    client.sendJson({ joined: data.room });
  }
}
```

---

## WebSocket Gateway

### @WebSocketGateway Decorator

```typescript
@WebSocketGateway({
  namespace: "/events",
  path: "/ws",
})
export class EventsGateway {
  // Handle connections
}
```

### @SubscribeMessage Decorator

```typescript
@SubscribeMessage('chat')
handleChat(client: WebSocketConnection, message: string) {
  // Broadcast to all clients
  this.broadcast(message);
}
```

---

## API Reference

### WebSocketConnection

#### `send(data: string | Buffer): void`

Send message to client.

```typescript
client.send("Hello, client!");
```

#### `sendJson(data: any): void`

Send JSON message.

```typescript
client.sendJson({ type: "notification", message: "New update" });
```

#### `close(code?: number, reason?: string): void`

Close connection.

```typescript
client.close(1000, "Normal closure");
```

#### `ping(data?: string): void`

Send ping.

```typescript
client.ping("heartbeat");
```

---

## Examples

### Chat Application

```typescript
@WebSocketGateway({ namespace: "/chat" })
export class ChatGateway {
  private clients = new Set<WebSocketConnection>();

  @SubscribeMessage("join")
  handleJoin(client: WebSocketConnection, data: { username: string }) {
    this.clients.add(client);
    this.broadcast({ type: "join", username: data.username });
  }

  @SubscribeMessage("message")
  handleMessage(client: WebSocketConnection, data: { message: string }) {
    this.broadcast({ type: "message", message: data.message });
  }

  private broadcast(data: any) {
    const message = JSON.stringify(data);
    for (const client of this.clients) {
      client.send(message);
    }
  }
}
```

### Real-Time Notifications

```typescript
@WebSocketGateway({ namespace: "/notifications" })
export class NotificationGateway {
  private userConnections = new Map<number, WebSocketConnection>();

  @SubscribeMessage("auth")
  handleAuth(client: WebSocketConnection, data: { userId: number }) {
    this.userConnections.set(data.userId, client);
  }

  sendToUser(userId: number, notification: any) {
    const client = this.userConnections.get(userId);
    if (client) {
      client.sendJson(notification);
    }
  }
}
```

---

## Related Documentation

- [Controllers](./CONTROLLER_DECORATOR.md)
- [Guards](./GUARDS_DECORATOR.md)
- [Interceptors](./INTERCEPTORS_DECORATOR.md)

---

**Last Updated**: December 4, 2025
