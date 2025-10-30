const crypto = require("crypto");

class WebSocketServer {
  constructor(options = {}) {
    this.clients = new Set();
    this.options = options;
  }

  handleUpgrade(req, socket, head) {
    const key = req.headers["sec-websocket-key"];

    if (!key) {
      socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
      return;
    }

    const acceptKey = this.generateAcceptKey(key);

    const headers = [
      "HTTP/1.1 101 Switching Protocols",
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Accept: ${acceptKey}`,
      "\r\n",
    ].join("\r\n");

    socket.write(headers);

    const client = new WebSocketClient(socket);
    this.clients.add(client);

    client.on("close", () => {
      this.clients.delete(client);
    });

    if (this.options.onConnection) {
      this.options.onConnection(client);
    }
  }

  generateAcceptKey(key) {
    const magic = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
    const hash = crypto.createHash("sha1");
    hash.update(key + magic);
    return hash.digest("base64");
  }

  broadcast(message, exclude = null) {
    this.clients.forEach((client) => {
      if (client !== exclude && client.readyState === 1) {
        client.send(message);
      }
    });
  }
}

class WebSocketClient {
  constructor(socket) {
    this.socket = socket;
    this.readyState = 1; // OPEN
    this.listeners = {};

    this.socket.on("data", (data) => this.handleData(data));
    this.socket.on("close", () => this.handleClose());
    this.socket.on("error", (err) => this.emit("error", err));
  }

  handleData(buffer) {
    const frame = this.parseFrame(buffer);

    if (!frame) return;

    switch (frame.opcode) {
      case 0x1: // Text frame
        this.emit("message", frame.payload.toString("utf8"));
        break;
      case 0x2: // Binary frame
        this.emit("message", frame.payload);
        break;
      case 0x8: // Close frame
        this.close();
        break;
      case 0x9: // Ping frame
        this.sendFrame(0xa, frame.payload); // Pong
        break;
      case 0xa: // Pong frame
        this.emit("pong", frame.payload);
        break;
    }
  }

  parseFrame(buffer) {
    if (buffer.length < 2) return null;

    const firstByte = buffer[0];
    const secondByte = buffer[1];

    const fin = (firstByte & 0x80) !== 0;
    const opcode = firstByte & 0x0f;
    const masked = (secondByte & 0x80) !== 0;
    let payloadLength = secondByte & 0x7f;

    let offset = 2;

    if (payloadLength === 126) {
      payloadLength = buffer.readUInt16BE(offset);
      offset += 2;
    } else if (payloadLength === 127) {
      payloadLength = buffer.readBigUInt64BE(offset);
      offset += 8;
    }

    let maskKey = null;
    if (masked) {
      maskKey = buffer.slice(offset, offset + 4);
      offset += 4;
    }

    const payload = buffer.slice(offset, offset + Number(payloadLength));

    if (masked && maskKey) {
      for (let i = 0; i < payload.length; i++) {
        payload[i] ^= maskKey[i % 4];
      }
    }

    return { fin, opcode, payload };
  }

  send(data) {
    const opcode = typeof data === "string" ? 0x1 : 0x2;
    const payload = Buffer.from(data);
    this.sendFrame(opcode, payload);
  }

  sendFrame(opcode, payload) {
    const length = payload.length;
    let frame;

    if (length < 126) {
      frame = Buffer.allocUnsafe(2 + length);
      frame[0] = 0x80 | opcode;
      frame[1] = length;
      payload.copy(frame, 2);
    } else if (length < 65536) {
      frame = Buffer.allocUnsafe(4 + length);
      frame[0] = 0x80 | opcode;
      frame[1] = 126;
      frame.writeUInt16BE(length, 2);
      payload.copy(frame, 4);
    } else {
      frame = Buffer.allocUnsafe(10 + length);
      frame[0] = 0x80 | opcode;
      frame[1] = 127;
      frame.writeBigUInt64BE(BigInt(length), 2);
      payload.copy(frame, 10);
    }

    this.socket.write(frame);
  }

  close(code = 1000, reason = "") {
    if (this.readyState !== 1) return;

    this.readyState = 2; // CLOSING

    const payload = Buffer.allocUnsafe(2 + reason.length);
    payload.writeUInt16BE(code, 0);
    payload.write(reason, 2);

    this.sendFrame(0x8, payload);
    this.socket.end();
  }

  handleClose() {
    this.readyState = 3; // CLOSED
    this.emit("close");
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  emit(event, ...args) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => callback(...args));
    }
  }

  ping(data = "") {
    this.sendFrame(0x9, Buffer.from(data));
  }
}

module.exports = WebSocketServer;
module.exports.WebSocketClient = WebSocketClient;
