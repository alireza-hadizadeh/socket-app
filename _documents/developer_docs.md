# Socket.IO Real-Time Communication Platform - Developer Documentation

**Server URL:** `https://apg-socket.com`  
**WebSocket Port:** `3001`  
**API Documentation:** This guide

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Connection Guidelines](#connection-guidelines)
3. [Socket Events Reference](#socket-events-reference)
4. [Laravel Integration](#laravel-integration)
5. [Flutter Integration](#flutter-integration)
6. [Web/JavaScript Integration](#webjavascript-integration)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## 🚀 Getting Started

### Overview

The APG Socket platform is a real-time communication server that allows your applications to send and receive messages in real-time across multiple platforms:
- **Laravel** backend applications
- **Flutter** mobile applications
- **Web** applications (JavaScript/TypeScript)

### Key Features

✅ Real-time bidirectional communication  
✅ Support for multiple platforms simultaneously  
✅ Persistent message logging with SQLite database  
✅ Connection tracking and statistics  
✅ Automatic reconnection handling  
✅ CORS-enabled for cross-origin requests  
✅ WebSocket + polling fallback support  

### Server Information

```
Production Server: https://apg-socket.com
WebSocket Endpoint: wss://apg-socket.com:3001
Fallback (HTTP Polling): http://apg-socket.com:3001

Protocol: Socket.IO v4.7.2
Transports: WebSocket, HTTP Long-Polling
```

---

## 🔌 Connection Guidelines

### Connection Flow

```
1. Client initiates connection to server
2. Socket.IO establishes WebSocket connection
3. Client emits 'identify' event with user details
4. Server confirms with 'identified' event
5. Client can now send/receive messages
```

### Connection Configuration

All clients should use these recommended settings:

```
Reconnection: enabled
Reconnection Delay: 1000ms
Max Reconnection Delay: 5000ms
Reconnection Attempts: 5
Transports: ['websocket', 'polling']
```

### Headers & Authentication

Currently, the platform uses **socket-based identification**. Send your client details when connecting:

```json
{
  "userId": "unique-user-identifier",
  "platform": "laravel|flutter|web",
  "appVersion": "1.0.0"
}
```

---

## 📡 Socket Events Reference

### Client → Server Events

#### 1. `identify` - Register Client
Sent when client connects to identify itself to the server.

**Emit:**
```json
{
  "userId": "user-123",
  "platform": "laravel|flutter|web",
  "appVersion": "1.0.0"
}
```

**Response:** `identified` event

**Example:**
```typescript
socket.emit('identify', {
  userId: 'laravel-app-1',
  platform: 'laravel',
  appVersion: '1.0.0'
});
```

---

#### 2. `send-message` - Broadcast Message
Send a message to all connected clients.

**Emit:**
```json
{
  "sender": "John Doe",
  "text": "Hello everyone!",
  "platform": "laravel|flutter|web"
}
```

**Response:** `receive-message` event (to all clients)

**Example:**
```typescript
socket.emit('send-message', {
  sender: 'Laravel App',
  text: 'Database backup completed',
  platform: 'laravel'
});
```

---

#### 3. `custom-event` - Send Custom Event
For extensibility and custom use cases.

**Emit:**
```json
{
  "eventType": "notification|alert|action|custom",
  "data": {
    "any": "custom data"
  }
}
```

**Response:** `custom-event` event (to all clients)

**Example:**
```typescript
socket.emit('custom-event', {
  eventType: 'notification',
  data: {
    title: 'Alert',
    message: 'Critical issue detected',
    priority: 'high'
  }
});
```

---

#### 4. `ping` - Heartbeat
Keep the connection alive and check server status.

**Emit:** (no data required)

**Response:** `pong` event

**Example:**
```typescript
socket.emit('ping');
```

---

### Server → Client Events

#### 1. `user-connected` - New Client Connected
Emitted when a new client successfully connects.

**Receive:**
```json
{
  "socketId": "socket-id-abc123",
  "connectedAt": 1699000000000,
  "totalConnected": 5,
  "timestamp": "2024-11-08T12:00:00Z"
}
```

**Use Case:** Update online user count, show connection notifications

**Example:**
```typescript
socket.on('user-connected', (data) => {
  console.log(`User connected. Total online: ${data.totalConnected}`);
});
```

---

#### 2. `receive-message` - Incoming Message
Emitted when any client sends a message via `send-message` event.

**Receive:**
```json
{
  "socketId": "socket-id-xyz789",
  "sender": "John Doe",
  "text": "Hello everyone!",
  "platform": "laravel|flutter|web",
  "timestamp": "2024-11-08T12:00:00Z"
}
```

**Use Case:** Display messages in chat UI, log activity, trigger notifications

**Example:**
```typescript
socket.on('receive-message', (data) => {
  console.log(`${data.sender} (${data.platform}): ${data.text}`);
});
```

---

#### 3. `user-disconnected` - Client Disconnected
Emitted when a client disconnects or loses connection.

**Receive:**
```json
{
  "socketId": "socket-id-abc123",
  "platform": "laravel",
  "connectedDuration": 3600000,
  "totalConnected": 4,
  "timestamp": "2024-11-08T12:05:00Z"
}
```

**Use Case:** Update online user count, log disconnections, cleanup

**Example:**
```typescript
socket.on('user-disconnected', (data) => {
  console.log(`User disconnected. Connected for: ${data.connectedDuration}ms`);
});
```

---

#### 4. `identified` - Registration Confirmed
Response after client sends `identify` event.

**Receive:**
```json
{
  "socketId": "socket-id-123",
  "message": "Client identified successfully",
  "timestamp": "2024-11-08T12:00:00Z"
}
```

**Example:**
```typescript
socket.on('identified', (data) => {
  console.log(`Successfully identified as: ${data.socketId}`);
});
```

---

#### 5. `pong` - Heartbeat Response
Response to `ping` event.

**Receive:**
```json
{
  "timestamp": "2024-11-08T12:00:00Z"
}
```

**Example:**
```typescript
socket.on('pong', (data) => {
  console.log('Server is alive');
});
```

---

#### 6. `custom-event` - Custom Event Response
Response to `custom-event` emission.

**Receive:**
```json
{
  "from": "socket-id-123",
  "data": {
    "eventType": "notification",
    "customData": "..."
  },
  "timestamp": "2024-11-08T12:00:00Z"
}
```

**Example:**
```typescript
socket.on('custom-event', (data) => {
  console.log('Custom event from:', data.from, data.data);
});
```

---

#### 7. `server-shutting-down` - Server Maintenance
Emitted when server is shutting down gracefully.

**Receive:**
```json
{
  "timestamp": "2024-11-08T12:00:00Z"
}
```

**Use Case:** Save data, show warning message, gracefully disconnect

**Example:**
```typescript
socket.on('server-shutting-down', (data) => {
  console.warn('Server is shutting down. Reconnecting in 5 minutes.');
});
```

---

## 🔗 Laravel Integration

### Installation

```bash
composer require wisembly/elephant.io
```

Or alternative package:
```bash
composer require elephantio/socket.io-php-client
```

### Basic Setup

Create a service class `app/Services/SocketIOService.php`:

```php
<?php

namespace App\Services;

use ElephantIO\Client;
use ElephantIO\Engine\SocketIO\Version2X;
use Illuminate\Support\Facades\Log;
use Exception;

class SocketIOService
{
    private $client;
    private $url = 'https://apg-socket.com:3001';

    /**
     * Connect to Socket.IO server
     */
    public function connect($userId = null, $appVersion = '1.0.0')
    {
        try {
            $this->client = new Client(new Version2X($this->url));
            $this->client->initialize();

            $userId = $userId ?? 'laravel-app-' . time();

            // Identify client
            $this->client->emit('identify', [
                'userId' => $userId,
                'platform' => 'laravel',
                'appVersion' => $appVersion,
            ]);

            Log::info('Socket.IO connected', ['userId' => $userId]);
            return true;
        } catch (Exception $e) {
            Log::error('Socket.IO connection failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Send message to all connected clients
     */
    public function sendMessage($sender, $text, $platform = 'laravel')
    {
        try {
            $this->client->emit('send-message', [
                'sender' => $sender,
                'text' => $text,
                'platform' => $platform,
            ]);

            Log::info('Message sent', [
                'sender' => $sender,
                'text' => $text,
            ]);

            return true;
        } catch (Exception $e) {
            Log::error('Send message failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Send custom event
     */
    public function sendCustomEvent($eventType, $data = [])
    {
        try {
            $this->client->emit('custom-event', [
                'eventType' => $eventType,
                'data' => $data,
            ]);

            return true;
        } catch (Exception $e) {
            Log::error('Custom event failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Send heartbeat
     */
    public function ping()
    {
        try {
            $this->client->emit('ping');
            return true;
        } catch (Exception $e) {
            Log::error('Ping failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Disconnect from server
     */
    public function disconnect()
    {
        try {
            if ($this->client) {
                $this->client->close();
                Log::info('Socket.IO disconnected');
            }
            return true;
        } catch (Exception $e) {
            Log::error('Disconnect failed: ' . $e->getMessage());
            return false;
        }
    }
}
```

### Service Provider

Register in `app/Providers/AppServiceProvider.php`:

```php
public function register()
{
    $this->app->singleton(SocketIOService::class, function ($app) {
        return new SocketIOService();
    });
}
```

### Usage in Controller

```php
<?php

namespace App\Http\Controllers;

use App\Services\SocketIOService;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(private SocketIOService $socketIO) {}

    /**
     * Send notification to all clients
     */
    public function broadcast(Request $request)
    {
        $this->socketIO->connect('laravel-app');

        $this->socketIO->sendMessage(
            $request->input('sender', 'System'),
            $request->input('message')
        );

        $this->socketIO->disconnect();

        return response()->json(['status' => 'sent']);
    }

    /**
     * Send alert event
     */
    public function alert(Request $request)
    {
        $this->socketIO->connect('laravel-app');

        $this->socketIO->sendCustomEvent('alert', [
            'title' => $request->input('title'),
            'message' => $request->input('message'),
            'type' => $request->input('type', 'info'),
            'priority' => $request->input('priority', 'normal'),
        ]);

        $this->socketIO->disconnect();

        return response()->json(['status' => 'sent']);
    }
}
```

### Usage in Job/Queue

```php
<?php

namespace App\Jobs;

use App\Services\SocketIOService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendSocketNotification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private string $sender,
        private string $message
    ) {}

    public function handle(SocketIOService $socketIO)
    {
        $socketIO->connect('laravel-background-job');
        $socketIO->sendMessage($this->sender, $this->message);
        $socketIO->disconnect();
    }
}
```

Dispatch job:
```php
SendSocketNotification::dispatch('System', 'Backup completed successfully');
```

### Usage in Artisan Command

```php
<?php

namespace App\Console\Commands;

use App\Services\SocketIOService;
use Illuminate\Console\Command;

class BroadcastMessage extends Command
{
    protected $signature = 'socket:broadcast {sender} {message}';
    protected $description = 'Broadcast a message to all connected clients';

    public function handle(SocketIOService $socketIO)
    {
        $sender = $this->argument('sender');
        $message = $this->argument('message');

        $socketIO->connect('laravel-cli');
        $socketIO->sendMessage($sender, $message);
        $socketIO->disconnect();

        $this->info('Message broadcasted successfully');
    }
}
```

Run command:
```bash
php artisan socket:broadcast "System" "Important update"
```

### Configuration

Create `config/socketio.php`:

```php
<?php

return [
    'url' => env('SOCKETIO_URL', 'https://apg-socket.com:3001'),
    'enabled' => env('SOCKETIO_ENABLED', true),
    'app_id' => env('SOCKETIO_APP_ID', 'laravel-app'),
];
```

Add to `.env`:
```
SOCKETIO_URL=https://apg-socket.com:3001
SOCKETIO_ENABLED=true
SOCKETIO_APP_ID=laravel-app
```

---

## 📱 Flutter Integration

### Installation

Add to `pubspec.yaml`:

```yaml
dependencies:
  socket_io_client: ^2.0.0
  flutter: sdk: flutter
```

Run:
```bash
flutter pub get
```

### Basic Setup

Create a socket service `lib/services/socket_io_service.dart`:

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:flutter/foundation.dart';

class SocketIOService {
  static final SocketIOService _instance = SocketIOService._internal();
  late IO.Socket socket;

  factory SocketIOService() {
    return _instance;
  }

  SocketIOService._internal();

  /// Initialize connection
  Future<void> connect({
    required String url,
    required String userId,
    String platform = 'flutter',
    String appVersion = '1.0.0',
    VoidCallback? onConnected,
    VoidCallback? onDisconnected,
    Function(Map<String, dynamic>)? onMessageReceived,
    Function(Map<String, dynamic>)? onUserConnected,
    Function(Map<String, dynamic>)? onUserDisconnected,
  }) async {
    socket = IO.io(
      url,
      IO.OptionBuilder()
        .setTransports(['websocket', 'polling'])
        .disableAutoConnect()
        .build(),
    );

    // Connected
    socket.onConnect((_) {
      debugPrint('✅ Socket connected: ${socket.id}');

      // Identify client
      socket.emit('identify', {
        'userId': userId,
        'platform': platform,
        'appVersion': appVersion,
      });

      onConnected?.call();
    });

    // User connected
    socket.on('user-connected', (data) {
      debugPrint('👤 User connected: $data');
      onUserConnected?.call(data);
    });

    // Message received
    socket.on('receive-message', (data) {
      debugPrint('📨 Message received: $data');
      onMessageReceived?.call(data);
    });

    // User disconnected
    socket.on('user-disconnected', (data) {
      debugPrint('👤 User disconnected: $data');
      onUserDisconnected?.call(data);
    });

    // Identified
    socket.on('identified', (data) {
      debugPrint('✅ Identified: $data');
    });

    // Pong
    socket.on('pong', (data) {
      debugPrint('🏓 Pong: $data');
    });

    // Custom event
    socket.on('custom-event', (data) {
      debugPrint('🎯 Custom event: $data');
    });

    // Error
    socket.onConnectError((error) {
      debugPrint('❌ Connection error: $error');
    });

    // Disconnect
    socket.onDisconnect((_) {
      debugPrint('❌ Disconnected');
      onDisconnected?.call();
    });

    socket.connect();
  }

  /// Send message
  void sendMessage({
    required String sender,
    required String text,
    String platform = 'flutter',
  }) {
    socket.emit('send-message', {
      'sender': sender,
      'text': text,
      'platform': platform,
    });
    debugPrint('📤 Message sent: $text');
  }

  /// Send custom event
  void sendCustomEvent(String eventType, Map<String, dynamic> data) {
    socket.emit('custom-event', {
      'eventType': eventType,
      'data': data,
    });
  }

  /// Send ping
  void ping() {
    socket.emit('ping');
  }

  /// Disconnect
  void disconnect() {
    socket.disconnect();
  }

  /// Check connection status
  bool get isConnected => socket.connected;
}
```

### Usage in Widget

```dart
import 'package:flutter/material.dart';
import 'package:your_app/services/socket_io_service.dart';

class ChatScreen extends StatefulWidget {
  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final SocketIOService _socketService = SocketIOService();
  final TextEditingController _messageController = TextEditingController();
  final List<String> _messages = [];
  bool _isConnected = false;
  int _connectedUsers = 0;

  @override
  void initState() {
    super.initState();
    _connectSocket();
  }

  void _connectSocket() {
    _socketService.connect(
      url: 'https://apg-socket.com:3001',
      userId: 'flutter-user-${DateTime.now().millisecondsSinceEpoch}',
      platform: 'flutter',
      appVersion: '1.0.0',
      onConnected: () {
        setState(() => _isConnected = true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('✅ Connected to server')),
        );
      },
      onDisconnected: () {
        setState(() => _isConnected = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('❌ Disconnected')),
        );
      },
      onMessageReceived: (data) {
        setState(() {
          _messages.add(
            '${data['sender']}: ${data['text']}',
          );
        });
      },
      onUserConnected: (data) {
        setState(() => _connectedUsers = data['totalConnected'] ?? 0);
      },
      onUserDisconnected: (data) {
        setState(() => _connectedUsers = data['totalConnected'] ?? 0);
      },
    );
  }

  void _sendMessage() {
    if (_messageController.text.isEmpty) return;

    _socketService.sendMessage(
      sender: 'Flutter User',
      text: _messageController.text,
      platform: 'flutter',
    );

    setState(() {
      _messages.add('You: ${_messageController.text}');
      _messageController.clear();
    });
  }

  @override
  void dispose() {
    _messageController.dispose();
    _socketService.disconnect();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Real-Time Chat'),
        subtitle: Text(
          _isConnected
              ? '✅ Connected (Users: $_connectedUsers)'
              : '❌ Disconnected',
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                return Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(12.0),
                      child: Text(_messages[index]),
                    ),
                  ),
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: InputDecoration(
                      hintText: 'Enter message...',
                      border: OutlineInputBorder(),
                      enabled: _isConnected,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                FloatingActionButton(
                  onPressed: _isConnected ? _sendMessage : null,
                  child: const Icon(Icons.send),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
```

### Handling Connection States

```dart
// Listen for connection changes
if (_socketService.isConnected) {
  print('Connected and ready');
} else {
  print('Disconnected');
}

// Auto-reconnect on app resume
@override
void didChangeAppLifecycleState(AppLifecycleState state) {
  if (state == AppLifecycleState.resumed && !_socketService.isConnected) {
    _connectSocket();
  }
}
```

---

## 🌐 Web/JavaScript Integration

### Installation

#### Using NPM

```bash
npm install socket.io-client
```

#### Using CDN

```html
<script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
```

### Basic Setup

```javascript
import { io } from 'socket.io-client';

const socket = io('https://apg-socket.com:3001', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  transports: ['websocket', 'polling'],
});

// Connection events
socket.on('connect', () => {
  console.log('✅ Connected:', socket.id);

  // Identify client
  socket.emit('identify', {
    userId: 'web-user-' + Date.now(),
    platform: 'web',
    appVersion: '1.0.0',
  });
});

socket.on('identified', (data) => {
  console.log('✅ Identified:', data);
});

// Message events
socket.on('receive-message', (data) => {
  console.log('📨 Message:', data);
  displayMessage(data);
});

socket.on('user-connected', (data) => {
  console.log('👤 User connected. Total:', data.totalConnected);
  updateUserCount(data.totalConnected);
});

socket.on('user-disconnected', (data) => {
  console.log('👤 User disconnected. Total:', data.totalConnected);
  updateUserCount(data.totalConnected);
});

// Error handling
socket.on('error', (error) => {
  console.error('❌ Error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});

// Send message
function sendMessage(sender, text) {
  socket.emit('send-message', {
    sender,
    text,
    platform: 'web',
  });
}

// Send custom event
function sendCustomEvent(eventType, data) {
  socket.emit('custom-event', {
    eventType,
    data,
  });
}

// Disconnect
function disconnectSocket() {
  socket.disconnect();
}
```

### React Example

```jsx
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

function ChatApp() {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io('https://apg-socket.com:3001', {
      reconnection: true,
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('identify', {
        userId: 'react-user-' + Date.now(),
        platform: 'web',
        appVersion: '1.0.0',
      });
    });

    newSocket.on('receive-message', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleSendMessage = (text) => {
    socket?.emit('send-message', {
      sender: 'React User',
      text,
      platform: 'web',
    });
  };

  return (
    <div>
      <h1>Chat App</h1>
      <p>Status: {isConnected ? '✅ Connected' : '❌ Disconnected'}</p>
      <div>
        {messages.map((msg, i) => (
          <div key={i}>
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <input
        type="text"
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            handleSendMessage(e.target.value);
            e.target.value = '';
          }
        }}
        placeholder="Type message..."
      />
    </div>
  );
}

export default ChatApp;
```

---

## ⚠️ Error Handling

### Common Connection Errors

```javascript
socket.on('connect_error', (error) => {
  console.error('Connection Error:');
  console.error('- Message:', error.message);
  console.error('- Data:', error.data);
  
  // Handle specific errors
  if (error.message === 'CORS policy') {
    console.error('CORS configuration issue');
  }
});

socket.on('error', (error) => {
  console.error('Socket Error:', error);
  // Attempt to reconnect
  socket.connect();
});

socket.on('disconnect', (reason) => {
  console.warn('Disconnection reason:', reason);
  
  if (reason === 'io server disconnect') {
    // Server disconnected, reconnect manually
    setTimeout(() => socket.connect(), 5000);
  } else if (reason === 'io client disconnect') {
    // Client disconnect triggered
  } else {
    // Network error
  }
});
```

### Timeout Handling

```javascript
// Set connection timeout
const connectionTimeout = setTimeout(() => {
  if (!socket.connected) {
    console.error('Connection timeout');
    socket.disconnect();
  }
}, 10000);

socket.on('connect', () => {
  clearTimeout(connectionTimeout);
});
```

---

## ✅ Best Practices

### 1. Connection Management

```javascript
// Always check connection before emitting
if (socket.connected) {
  socket.emit('send-message', data);
} else {
  console.warn('Not connected, queuing message');
  messageQueue.push(data);
}

// Queue messages when disconnected
const messageQueue = [];

socket.on('connect', () => {
  while (messageQueue.length > 0) {
    const msg = messageQueue.shift();
    socket.emit('send-message', msg);
  }
});
```

### 2. Error Recovery

```dart
// Flutter example
Future<void> _connectWithRetry({int maxRetries = 3}) async {
  for (int i = 0; i < maxRetries; i++) {
    try {
      await _socketService.connect(
        url: 'https://apg-socket.com:3001',
        userId: _userId,
      );
      return;
    } catch (e) {
      debugPrint('Connection attempt ${i + 1} failed: $e');
      if (i < maxRetries - 1) {
        await Future.delayed(Duration(seconds: pow(2, i).toInt()));
      }
    }
  }
  throw Exception('Failed to connect after $maxRetries attempts');
}
```

### 3. Data Validation

```php
// Laravel example
public function sendMessage($sender, $text)
{
    // Validate input
    if (empty($sender) || strlen($sender) > 100) {
        throw new Exception('Invalid sender');
    }
    
    if (empty($text) || strlen($text) > 5000) {
        throw new Exception('Invalid message');
    }
    
    // Sanitize
    $sender = htmlspecialchars($sender);
    $text = htmlspecialchars($text);
    
    $this->socketIO->sendMessage($sender, $text);
}
```

### 4. Heartbeat/Keep-Alive

```javascript
// Send periodic ping to keep connection alive
setInterval(() => {
  if (socket.connected) {
    socket.emit('ping');
  }
}, 30000); // Every 30 seconds

socket.on('pong', (data) => {
  console.log('Server is alive at:', data.timestamp);
});
```

### 5. Logging & Monitoring

```php
// Laravel example - Log all socket events
public function logSocketActivity($event, $data)
{
    \Log::channel('socket')->info('Socket Event', [
        'event' => $event,
        'data' => $data,
        'timestamp' => now(),
        'ip' => request()->ip(),
    ]);
}

// Check connection stats
public function getConnectionStats()
{
    // This would typically query your database
    $totalConnections = Connection::count();
    $activeConnections = Connection::where('status', 'active')->count();
    
    return [
        'total' => $totalConnections,
        'active' => $activeConnections,
        'inactive' => $totalConnections - $activeConnections,
    ];
}
```

### 6. Message Queuing

```php
// Laravel Job for processing messages
namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;

class ProcessSocketMessage implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private string $sender,
        private string $message,
        private string $platform
    ) {}

    public function handle()
    {
        // Store in database
        Message::create([
            'sender' => $this->sender,
            'text' => $this->message,
            'platform' => $this->platform,
        ]);

        // Send notifications
        Notification::send(
            User::all(),
            new MessageNotification($this->message)
        );
    }
}
```

### 7. Rate Limiting

```javascript
// JavaScript example - Limit messages per user
class MessageLimiter {
    constructor(maxMessages = 10, timeWindow = 60000) {
        this.maxMessages = maxMessages;
        this.timeWindow = timeWindow;
        this.userMessages = new Map();
    }

    canSendMessage(userId) {
        const now = Date.now();
        const userMessages = this.userMessages.get(userId) || [];
        
        // Remove old messages outside time window
        const recentMessages = userMessages.filter(
            time => now - time < this.timeWindow
        );
        
        if (recentMessages.length >= this.maxMessages) {
            return false;
        }
        
        recentMessages.push(now);
        this.userMessages.set(userId, recentMessages);
        return true;
    }
}

const limiter = new MessageLimiter(10, 60000); // 10 messages per minute

socket.on('send-message', (data) => {
    if (!limiter.canSendMessage(data.sender)) {
        socket.emit('error', {
            message: 'Rate limit exceeded',
        });
        return;
    }
    
    socket.broadcast.emit('receive-message', data);
});
```

---

## 🔧 Troubleshooting

### Issue: Connection Immediately Disconnects

**Symptoms:**
- Client connects briefly then disconnects
- No error messages visible

**Solutions:**

1. **Check CORS Configuration**
   ```
   Ensure your client URL is in the allowed origins:
   - http://localhost:3000
   - http://localhost:3001
   - http://127.0.0.1:5500
   - https://your-domain.com
   ```

2. **Verify Firewall Rules**
   ```bash
   # Test connection from terminal
   telnet apg-socket.com 3001
   
   # Or use curl for WebSocket
   curl -i -N \
     -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     https://apg-socket.com:3001
   ```

3. **Check Socket Version**
   ```javascript
   console.log('Socket.IO Client Version:', io.protocol);
   ```

---

### Issue: Messages Not Being Received

**Symptoms:**
- Can connect but no messages come through
- Other clients don't receive messages

**Solutions:**

1. **Verify identify Event**
   ```javascript
   socket.on('identify', (data) => {
     console.log('Identify response:', data);
   });
   ```

2. **Check Event Names**
   - Client sends: `send-message`
   - Client receives: `receive-message`
   - Not: `message`, `chat`, etc.

3. **Verify Message Format**
   ```javascript
   // ✅ Correct
   socket.emit('send-message', {
     sender: 'John',
     text: 'Hello',
     platform: 'web'
   });
   
   // ❌ Wrong
   socket.emit('send-message', 'Hello'); // String instead of object
   ```

---

### Issue: High Memory Usage or Connection Leaks

**Symptoms:**
- Memory increases over time
- Old sockets not being cleaned up
- Server becomes slow

**Solutions:**

1. **Always Disconnect**
   ```javascript
   // ✅ Good
   window.addEventListener('beforeunload', () => {
     socket.disconnect();
   });
   
   // ✅ Good - React
   useEffect(() => {
     return () => socket.disconnect();
   }, []);
   ```

2. **Limit Reconnection Attempts**
   ```javascript
   const socket = io('https://apg-socket.com:3001', {
     reconnection: true,
     reconnectionAttempts: 5,        // Default is infinity
     reconnectionDelay: 1000,
     reconnectionDelayMax: 5000,
   });
   ```

3. **Monitor Event Listeners**
   ```javascript
   // Remove old listeners before adding new ones
   socket.removeAllListeners('receive-message');
   socket.on('receive-message', handleMessage);
   ```

---

### Issue: SSL/TLS Certificate Errors

**Symptoms:**
- `ERR_CERT_AUTHORITY_INVALID`
- `certificate verify failed`

**Solutions:**

1. **For Production (apg-socket.com)**
   - Platform uses valid SSL certificates
   - Ensure client uses `wss://` (WebSocket Secure)
   - No certificate verification should be needed

2. **For Development**
   ```javascript
   // Only for development - DO NOT USE IN PRODUCTION
   const socket = io('https://localhost:3001', {
     rejectUnauthorized: false, // Dangerous!
   });
   ```

---

### Issue: Flutter App Crashes on Connection

**Symptoms:**
- App crashes when trying to connect
- No error logs visible

**Solutions:**

1. **Add Error Boundary**
   ```dart
   try {
     await _socketService.connect(
       url: 'https://apg-socket.com:3001',
       userId: userId,
     );
   } catch (e) {
     debugPrint('Connection error: $e');
     _showErrorDialog('Failed to connect: $e');
   }
   ```

2. **Check Manifest Permissions**
   ```xml
   <!-- android/app/src/main/AndroidManifest.xml -->
   <uses-permission android:name="android.permission.INTERNET" />
   ```

3. **Allow Cleartext Traffic**
   ```xml
   <!-- For http:// connections (not recommended) -->
   <!-- android/app/src/main/res/network_security_config.xml -->
   <domain-config cleartextTrafficPermitted="true">
     <domain includeSubdomains="true">apg-socket.com</domain>
   </domain-config>
   ```

---

### Issue: Laravel Connection Timeout

**Symptoms:**
- `Connection timed out` errors
- `Failed to connect to 127.0.0.1`

**Solutions:**

1. **Check Server URL**
   ```php
   // Make sure you're using the correct URL
   $socketIO = new SocketIOService();
   $socketIO->connect('laravel-app');
   
   // Should be
   // https://apg-socket.com:3001
   // NOT localhost:3001
   ```

2. **Increase Timeout**
   ```php
   // In ElephantIO configuration
   $client = new Client(new Version2X($this->url));
   // Set stream context options
   ```

3. **Check Firewall/Proxy**
   ```bash
   # From your Laravel server, test connection
   php -r "var_dump(gethostbyname('apg-socket.com'));"
   ```

---

## 📊 Performance Optimization

### Client-Side

```javascript
// Batch message sending
class MessageBatcher {
    constructor(socket, batchSize = 10, flushInterval = 1000) {
        this.socket = socket;
        this.batchSize = batchSize;
        this.flushInterval = flushInterval;
        this.batch = [];
        this.timer = null;
    }

    addMessage(message) {
        this.batch.push(message);

        if (this.batch.length >= this.batchSize) {
            this.flush();
        } else if (!this.timer) {
            this.timer = setTimeout(() => this.flush(), this.flushInterval);
        }
    }

    flush() {
        if (this.batch.length === 0) return;

        this.socket.emit('send-batch', {
            messages: this.batch,
        });

        this.batch = [];
        clearTimeout(this.timer);
        this.timer = null;
    }
}

const batcher = new MessageBatcher(socket);
batcher.addMessage({ text: 'Hello' });
```

### Server-Side (Laravel)

```php
// Cache socket service instance
class SocketIOCache
{
    private static $instance;

    public static function service()
    {
        if (!self::$instance) {
            self::$instance = new SocketIOService();
        }
        return self::$instance;
    }
}

// Reuse connection
$service = SocketIOCache::service();
$service->sendMessage('System', 'Message 1');
$service->sendMessage('System', 'Message 2');
```

---

## 🔐 Security Considerations

### 1. Input Validation

```php
// Laravel
public function broadcastMessage(Request $request)
{
    $validated = $request->validate([
        'sender' => 'required|string|max:100',
        'message' => 'required|string|max:5000',
        'type' => 'in:text,system,alert',
    ]);

    // Sanitize
    $validated['sender'] = strip_tags($validated['sender']);
    $validated['message'] = strip_tags($validated['message']);

    $this->socketIO->sendMessage(
        $validated['sender'],
        $validated['message']
    );
}
```

### 2. Authentication

```javascript
// Send token with connection
const socket = io('https://apg-socket.com:3001', {
    auth: {
        token: localStorage.getItem('authToken'),
    },
});

socket.on('connect_error', (error) => {
    if (error.message === 'Authentication error') {
        // Redirect to login
        window.location.href = '/login';
    }
});
```

### 3. Rate Limiting

```php
// Laravel middleware
public function handle($request, Closure $next)
{
    if (RateLimiter::tooManyAttempts('socket:' . auth()->id(), 100)) {
        return response()->json(['error' => 'Rate limited'], 429);
    }

    RateLimiter::hit('socket:' . auth()->id(), 60);
    return $next($request);
}
```

### 4. Message Encryption (Optional)

```javascript
// Encrypt sensitive messages before sending
import CryptoJS from 'crypto-js';

function sendEncryptedMessage(text, encryptionKey) {
    const encrypted = CryptoJS.AES.encrypt(text, encryptionKey).toString();
    
    socket.emit('send-message', {
        sender: 'User',
        text: encrypted,
        encrypted: true,
    });
}

socket.on('receive-message', (data) => {
    if (data.encrypted) {
        const decrypted = CryptoJS.AES.decrypt(
            data.text,
            encryptionKey
        ).toString(CryptoJS.enc.Utf8);
        
        console.log('Decrypted:', decrypted);
    }
});
```

---

## 📈 Scaling & Production

### Load Balancing

For multiple Socket.IO instances, use Redis adapter:

```javascript
// Node.js server
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const httpServer = createServer();
const io = new Server(httpServer);

const pubClient = createClient({ host: 'localhost', port: 6379 });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

### Database Optimization

```php
// Laravel - Index messages for faster queries
Schema::table('messages', function (Blueprint $table) {
    $table->index('sender');
    $table->index('platform');
    $table->index('created_at');
});

// Archive old messages
DB::table('messages')
    ->where('created_at', '<', now()->subMonths(3))
    ->delete();
```

---

## 📞 Support & Contact

### Reporting Issues

When reporting issues, include:

1. **Platform Information**
   - Laravel version / Flutter version / Browser/Node version
   - Socket.IO client version

2. **Reproduction Steps**
   - Exact steps to reproduce
   - Expected vs. actual behavior

3. **Logs & Screenshots**
   - Console errors
   - Network tab in DevTools
   - Server logs

### Resources

- **Server Status:** https://apg-socket.com/health
- **Documentation:** This guide
- **Examples:** Check integration examples in sections above
- **Issues:** Report to your development team

---

## 📝 API Reference Summary

### Quick Event Reference

| Event               | Direction       | Payload                                           |
| ------------------- | --------------- | ------------------------------------------------- |
| `identify`          | Client → Server | `{ userId, platform, appVersion }`                |
| `user-connected`    | Server → Client | `{ socketId, totalConnected, timestamp }`         |
| `send-message`      | Client → Server | `{ sender, text, platform }`                      |
| `receive-message`   | Server → Client | `{ sender, text, platform, timestamp }`           |
| `user-disconnected` | Server → Client | `{ socketId, connectedDuration, totalConnected }` |
| `custom-event`      | Bidirectional   | `{ eventType, data }`                             |
| `ping`              | Client → Server | (no data)                                         |
| `pong`              | Server → Client | `{ timestamp }`                                   |

---

## 📚 Code Examples Repository

All complete code examples are available in:

- **Laravel:** `/examples/laravel`
- **Flutter:** `/examples/flutter`
- **Web:** `/examples/web`

Clone the repository to see full working examples.

---

## 🎓 Learning Path

1. **Beginners:** Start with the Web/JavaScript example
2. **Intermediate:** Integrate with your existing backend (Laravel)
3. **Advanced:** Build mobile client (Flutter) with authentication
4. **Expert:** Scale with multiple instances and load balancing

---

## Version History

| Version | Date     | Changes                 |
| ------- | -------- | ----------------------- |
| 1.0.0   | Nov 2024 | Initial release         |
| 1.0.1   | Nov 2024 | Added Flutter support   |
| 1.0.2   | Nov 2024 | Enhanced error handling |

---

## License

This documentation and platform are proprietary. Use only with authorization.

---

**Last Updated:** November 2024  
**Documentation Version:** 1.0.0

For questions or clarifications, contact the development team.
# Socket.IO Real-Time Communication Platform - Developer Documentation

**Server URL:** `https://apg-socket.com`  
**WebSocket Port:** `3001`  
**API Documentation:** This guide

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Connection Guidelines](#connection-guidelines)
3. [Socket Events Reference](#socket-events-reference)
4. [Laravel Integration](#laravel-integration)
5. [Flutter Integration](#flutter-integration)
6. [Web/JavaScript Integration](#webjavascript-integration)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## 🚀 Getting Started

### Overview

The APG Socket platform is a real-time communication server that allows your applications to send and receive messages in real-time across multiple platforms:
- **Laravel** backend applications
- **Flutter** mobile applications
- **Web** applications (JavaScript/TypeScript)

### Key Features

✅ Real-time bidirectional communication  
✅ Support for multiple platforms simultaneously  
✅ Persistent message logging with SQLite database  
✅ Connection tracking and statistics  
✅ Automatic reconnection handling  
✅ CORS-enabled for cross-origin requests  
✅ WebSocket + polling fallback support  

### Server Information

```
Production Server: https://apg-socket.com
WebSocket Endpoint: wss://apg-socket.com:3001
Fallback (HTTP Polling): http://apg-socket.com:3001

Protocol: Socket.IO v4.7.2
Transports: WebSocket, HTTP Long-Polling
```

---

## 🔌 Connection Guidelines

### Connection Flow

```
1. Client initiates connection to server
2. Socket.IO establishes WebSocket connection
3. Client emits 'identify' event with user details
4. Server confirms with 'identified' event
5. Client can now send/receive messages
```

### Connection Configuration

All clients should use these recommended settings:

```
Reconnection: enabled
Reconnection Delay: 1000ms
Max Reconnection Delay: 5000ms
Reconnection Attempts: 5
Transports: ['websocket', 'polling']
```

### Headers & Authentication

Currently, the platform uses **socket-based identification**. Send your client details when connecting:

```json
{
  "userId": "unique-user-identifier",
  "platform": "laravel|flutter|web",
  "appVersion": "1.0.0"
}
```

---

## 📡 Socket Events Reference

### Client → Server Events

#### 1. `identify` - Register Client
Sent when client connects to identify itself to the server.

**Emit:**
```json
{
  "userId": "user-123",
  "platform": "laravel|flutter|web",
  "appVersion": "1.0.0"
}
```

**Response:** `identified` event

**Example:**
```typescript
socket.emit('identify', {
  userId: 'laravel-app-1',
  platform: 'laravel',
  appVersion: '1.0.0'
});
```

---

#### 2. `send-message` - Broadcast Message
Send a message to all connected clients.

**Emit:**
```json
{
  "sender": "John Doe",
  "text": "Hello everyone!",
  "platform": "laravel|flutter|web"
}
```

**Response:** `receive-message` event (to all clients)

**Example:**
```typescript
socket.emit('send-message', {
  sender: 'Laravel App',
  text: 'Database backup completed',
  platform: 'laravel'
});
```

---

#### 3. `custom-event` - Send Custom Event
For extensibility and custom use cases.

**Emit:**
```json
{
  "eventType": "notification|alert|action|custom",
  "data": {
    "any": "custom data"
  }
}
```

**Response:** `custom-event` event (to all clients)

**Example:**
```typescript
socket.emit('custom-event', {
  eventType: 'notification',
  data: {
    title: 'Alert',
    message: 'Critical issue detected',
    priority: 'high'
  }
});
```

---

#### 4. `ping` - Heartbeat
Keep the connection alive and check server status.

**Emit:** (no data required)

**Response:** `pong` event

**Example:**
```typescript
socket.emit('ping');
```

---

### Server → Client Events

#### 1. `user-connected` - New Client Connected
Emitted when a new client successfully connects.

**Receive:**
```json
{
  "socketId": "socket-id-abc123",
  "connectedAt": 1699000000000,
  "totalConnected": 5,
  "timestamp": "2024-11-08T12:00:00Z"
}
```

**Use Case:** Update online user count, show connection notifications

**Example:**
```typescript
socket.on('user-connected', (data) => {
  console.log(`User connected. Total online: ${data.totalConnected}`);
});
```

---

#### 2. `receive-message` - Incoming Message
Emitted when any client sends a message via `send-message` event.

**Receive:**
```json
{
  "socketId": "socket-id-xyz789",
  "sender": "John Doe",
  "text": "Hello everyone!",
  "platform": "laravel|flutter|web",
  "timestamp": "2024-11-08T12:00:00Z"
}
```

**Use Case:** Display messages in chat UI, log activity, trigger notifications

**Example:**
```typescript
socket.on('receive-message', (data) => {
  console.log(`${data.sender} (${data.platform}): ${data.text}`);
});
```

---

#### 3. `user-disconnected` - Client Disconnected
Emitted when a client disconnects or loses connection.

**Receive:**
```json
{
  "socketId": "socket-id-abc123",
  "platform": "laravel",
  "connectedDuration": 3600000,
  "totalConnected": 4,
  "timestamp": "2024-11-08T12:05:00Z"
}
```

**Use Case:** Update online user count, log disconnections, cleanup

**Example:**
```typescript
socket.on('user-disconnected', (data) => {
  console.log(`User disconnected. Connected for: ${data.connectedDuration}ms`);
});
```

---

#### 4. `identified` - Registration Confirmed
Response after client sends `identify` event.

**Receive:**
```json
{
  "socketId": "socket-id-123",
  "message": "Client identified successfully",
  "timestamp": "2024-11-08T12:00:00Z"
}
```

**Example:**
```typescript
socket.on('identified', (data) => {
  console.log(`Successfully identified as: ${data.socketId}`);
});
```

---

#### 5. `pong` - Heartbeat Response
Response to `ping` event.

**Receive:**
```json
{
  "timestamp": "2024-11-08T12:00:00Z"
}
```

**Example:**
```typescript
socket.on('pong', (data) => {
  console.log('Server is alive');
});
```

---

#### 6. `custom-event` - Custom Event Response
Response to `custom-event` emission.

**Receive:**
```json
{
  "from": "socket-id-123",
  "data": {
    "eventType": "notification",
    "customData": "..."
  },
  "timestamp": "2024-11-08T12:00:00Z"
}
```

**Example:**
```typescript
socket.on('custom-event', (data) => {
  console.log('Custom event from:', data.from, data.data);
});
```

---

#### 7. `server-shutting-down` - Server Maintenance
Emitted when server is shutting down gracefully.

**Receive:**
```json
{
  "timestamp": "2024-11-08T12:00:00Z"
}
```

**Use Case:** Save data, show warning message, gracefully disconnect

**Example:**
```typescript
socket.on('server-shutting-down', (data) => {
  console.warn('Server is shutting down. Reconnecting in 5 minutes.');
});
```

---

## 🔗 Laravel Integration

### Installation

```bash
composer require wisembly/elephant.io
```

Or alternative package:
```bash
composer require elephantio/socket.io-php-client
```

### Basic Setup

Create a service class `app/Services/SocketIOService.php`:

```php
<?php

namespace App\Services;

use ElephantIO\Client;
use ElephantIO\Engine\SocketIO\Version2X;
use Illuminate\Support\Facades\Log;
use Exception;

class SocketIOService
{
    private $client;
    private $url = 'https://apg-socket.com:3001';

    /**
     * Connect to Socket.IO server
     */
    public function connect($userId = null, $appVersion = '1.0.0')
    {
        try {
            $this->client = new Client(new Version2X($this->url));
            $this->client->initialize();

            $userId = $userId ?? 'laravel-app-' . time();

            // Identify client
            $this->client->emit('identify', [
                'userId' => $userId,
                'platform' => 'laravel',
                'appVersion' => $appVersion,
            ]);

            Log::info('Socket.IO connected', ['userId' => $userId]);
            return true;
        } catch (Exception $e) {
            Log::error('Socket.IO connection failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Send message to all connected clients
     */
    public function sendMessage($sender, $text, $platform = 'laravel')
    {
        try {
            $this->client->emit('send-message', [
                'sender' => $sender,
                'text' => $text,
                'platform' => $platform,
            ]);

            Log::info('Message sent', [
                'sender' => $sender,
                'text' => $text,
            ]);

            return true;
        } catch (Exception $e) {
            Log::error('Send message failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Send custom event
     */
    public function sendCustomEvent($eventType, $data = [])
    {
        try {
            $this->client->emit('custom-event', [
                'eventType' => $eventType,
                'data' => $data,
            ]);

            return true;
        } catch (Exception $e) {
            Log::error('Custom event failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Send heartbeat
     */
    public function ping()
    {
        try {
            $this->client->emit('ping');
            return true;
        } catch (Exception $e) {
            Log::error('Ping failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Disconnect from server
     */
    public function disconnect()
    {
        try {
            if ($this->client) {
                $this->client->close();
                Log::info('Socket.IO disconnected');
            }
            return true;
        } catch (Exception $e) {
            Log::error('Disconnect failed: ' . $e->getMessage());
            return false;
        }
    }
}
```

### Service Provider

Register in `app/Providers/AppServiceProvider.php`:

```php
public function register()
{
    $this->app->singleton(SocketIOService::class, function ($app) {
        return new SocketIOService();
    });
}
```

### Usage in Controller

```php
<?php

namespace App\Http\Controllers;

use App\Services\SocketIOService;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(private SocketIOService $socketIO) {}

    /**
     * Send notification to all clients
     */
    public function broadcast(Request $request)
    {
        $this->socketIO->connect('laravel-app');

        $this->socketIO->sendMessage(
            $request->input('sender', 'System'),
            $request->input('message')
        );

        $this->socketIO->disconnect();

        return response()->json(['status' => 'sent']);
    }

    /**
     * Send alert event
     */
    public function alert(Request $request)
    {
        $this->socketIO->connect('laravel-app');

        $this->socketIO->sendCustomEvent('alert', [
            'title' => $request->input('title'),
            'message' => $request->input('message'),
            'type' => $request->input('type', 'info'),
            'priority' => $request->input('priority', 'normal'),
        ]);

        $this->socketIO->disconnect();

        return response()->json(['status' => 'sent']);
    }
}
```

### Usage in Job/Queue

```php
<?php

namespace App\Jobs;

use App\Services\SocketIOService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendSocketNotification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private string $sender,
        private string $message
    ) {}

    public function handle(SocketIOService $socketIO)
    {
        $socketIO->connect('laravel-background-job');
        $socketIO->sendMessage($this->sender, $this->message);
        $socketIO->disconnect();
    }
}
```

Dispatch job:
```php
SendSocketNotification::dispatch('System', 'Backup completed successfully');
```

### Usage in Artisan Command

```php
<?php

namespace App\Console\Commands;

use App\Services\SocketIOService;
use Illuminate\Console\Command;

class BroadcastMessage extends Command
{
    protected $signature = 'socket:broadcast {sender} {message}';
    protected $description = 'Broadcast a message to all connected clients';

    public function handle(SocketIOService $socketIO)
    {
        $sender = $this->argument('sender');
        $message = $this->argument('message');

        $socketIO->connect('laravel-cli');
        $socketIO->sendMessage($sender, $message);
        $socketIO->disconnect();

        $this->info('Message broadcasted successfully');
    }
}
```

Run command:
```bash
php artisan socket:broadcast "System" "Important update"
```

### Configuration

Create `config/socketio.php`:

```php
<?php

return [
    'url' => env('SOCKETIO_URL', 'https://apg-socket.com:3001'),
    'enabled' => env('SOCKETIO_ENABLED', true),
    'app_id' => env('SOCKETIO_APP_ID', 'laravel-app'),
];
```

Add to `.env`:
```
SOCKETIO_URL=https://apg-socket.com:3001
SOCKETIO_ENABLED=true
SOCKETIO_APP_ID=laravel-app
```

---

## 📱 Flutter Integration

### Installation

Add to `pubspec.yaml`:

```yaml
dependencies:
  socket_io_client: ^2.0.0
  flutter: sdk: flutter
```

Run:
```bash
flutter pub get
```

### Basic Setup

Create a socket service `lib/services/socket_io_service.dart`:

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:flutter/foundation.dart';

class SocketIOService {
  static final SocketIOService _instance = SocketIOService._internal();
  late IO.Socket socket;

  factory SocketIOService() {
    return _instance;
  }

  SocketIOService._internal();

  /// Initialize connection
  Future<void> connect({
    required String url,
    required String userId,
    String platform = 'flutter',
    String appVersion = '1.0.0',
    VoidCallback? onConnected,
    VoidCallback? onDisconnected,
    Function(Map<String, dynamic>)? onMessageReceived,
    Function(Map<String, dynamic>)? onUserConnected,
    Function(Map<String, dynamic>)? onUserDisconnected,
  }) async {
    socket = IO.io(
      url,
      IO.OptionBuilder()
        .setTransports(['websocket', 'polling'])
        .disableAutoConnect()
        .build(),
    );

    // Connected
    socket.onConnect((_) {
      debugPrint('✅ Socket connected: ${socket.id}');

      // Identify client
      socket.emit('identify', {
        'userId': userId,
        'platform': platform,
        'appVersion': appVersion,
      });

      onConnected?.call();
    });

    // User connected
    socket.on('user-connected', (data) {
      debugPrint('👤 User connected: $data');
      onUserConnected?.call(data);
    });

    // Message received
    socket.on('receive-message', (data) {
      debugPrint('📨 Message received: $data');
      onMessageReceived?.call(data);
    });

    // User disconnected
    socket.on('user-disconnected', (data) {
      debugPrint('👤 User disconnected: $data');
      onUserDisconnected?.call(data);
    });

    // Identified
    socket.on('identified', (data) {
      debugPrint('✅ Identified: $data');
    });

    // Pong
    socket.on('pong', (data) {
      debugPrint('🏓 Pong: $data');
    });

    // Custom event
    socket.on('custom-event', (data) {
      debugPrint('🎯 Custom event: $data');
    });

    // Error
    socket.onConnectError((error) {
      debugPrint('❌ Connection error: $error');
    });

    // Disconnect
    socket.onDisconnect((_) {
      debugPrint('❌ Disconnected');
      onDisconnected?.call();
    });

    socket.connect();
  }

  /// Send message
  void sendMessage({
    required String sender,
    required String text,
    String platform = 'flutter',
  }) {
    socket.emit('send-message', {
      'sender': sender,
      'text': text,
      'platform': platform,
    });
    debugPrint('📤 Message sent: $text');
  }

  /// Send custom event
  void sendCustomEvent(String eventType, Map<String, dynamic> data) {
    socket.emit('custom-event', {
      'eventType': eventType,
      'data': data,
    });
  }

  /// Send ping
  void ping() {
    socket.emit('ping');
  }

  /// Disconnect
  void disconnect() {
    socket.disconnect();
  }

  /// Check connection status
  bool get isConnected => socket.connected;
}
```

### Usage in Widget

```dart
import 'package:flutter/material.dart';
import 'package:your_app/services/socket_io_service.dart';

class ChatScreen extends StatefulWidget {
  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final SocketIOService _socketService = SocketIOService();
  final TextEditingController _messageController = TextEditingController();
  final List<String> _messages = [];
  bool _isConnected = false;
  int _connectedUsers = 0;

  @override
  void initState() {
    super.initState();
    _connectSocket();
  }

  void _connectSocket() {
    _socketService.connect(
      url: 'https://apg-socket.com:3001',
      userId: 'flutter-user-${DateTime.now().millisecondsSinceEpoch}',
      platform: 'flutter',
      appVersion: '1.0.0',
      onConnected: () {
        setState(() => _isConnected = true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('✅ Connected to server')),
        );
      },
      onDisconnected: () {
        setState(() => _isConnected = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('❌ Disconnected')),
        );
      },
      onMessageReceived: (data) {
        setState(() {
          _messages.add(
            '${data['sender']}: ${data['text']}',
          );
        });
      },
      onUserConnected: (data) {
        setState(() => _connectedUsers = data['totalConnected'] ?? 0);
      },
      onUserDisconnected: (data) {
        setState(() => _connectedUsers = data['totalConnected'] ?? 0);
      },
    );
  }

  void _sendMessage() {
    if (_messageController.text.isEmpty) return;

    _socketService.sendMessage(
      sender: 'Flutter User',
      text: _messageController.text,
      platform: 'flutter',
    );

    setState(() {
      _messages.add('You: ${_messageController.text}');
      _messageController.clear();
    });
  }

  @override
  void dispose() {
    _messageController.dispose();
    _socketService.disconnect();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Real-Time Chat'),
        subtitle: Text(
          _isConnected
              ? '✅ Connected (Users: $_connectedUsers)'
              : '❌ Disconnected',
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                return Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(12.0),
                      child: Text(_messages[index]),
                    ),
                  ),
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: InputDecoration(
                      hintText: 'Enter message...',
                      border: OutlineInputBorder(),
                      enabled: _isConnected,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                FloatingActionButton(
                  onPressed: _isConnected ? _sendMessage : null,
                  child: const Icon(Icons.send),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
```

### Handling Connection States

```dart
// Listen for connection changes
if (_socketService.isConnected) {
  print('Connected and ready');
} else {
  print('Disconnected');
}

// Auto-reconnect on app resume
@override
void didChangeAppLifecycleState(AppLifecycleState state) {
  if (state == AppLifecycleState.resumed && !_socketService.isConnected) {
    _connectSocket();
  }
}
```

---

## 🌐 Web/JavaScript Integration

### Installation

#### Using NPM

```bash
npm install socket.io-client
```

#### Using CDN

```html
<script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
```

### Basic Setup

```javascript
import { io } from 'socket.io-client';

const socket = io('https://apg-socket.com:3001', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  transports: ['websocket', 'polling'],
});

// Connection events
socket.on('connect', () => {
  console.log('✅ Connected:', socket.id);

  // Identify client
  socket.emit('identify', {
    userId: 'web-user-' + Date.now(),
    platform: 'web',
    appVersion: '1.0.0',
  });
});

socket.on('identified', (data) => {
  console.log('✅ Identified:', data);
});

// Message events
socket.on('receive-message', (data) => {
  console.log('📨 Message:', data);
  displayMessage(data);
});

socket.on('user-connected', (data) => {
  console.log('👤 User connected. Total:', data.totalConnected);
  updateUserCount(data.totalConnected);
});

socket.on('user-disconnected', (data) => {
  console.log('👤 User disconnected. Total:', data.totalConnected);
  updateUserCount(data.totalConnected);
});

// Error handling
socket.on('error', (error) => {
  console.error('❌ Error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});

// Send message
function sendMessage(sender, text) {
  socket.emit('send-message', {
    sender,
    text,
    platform: 'web',
  });
}

// Send custom event
function sendCustomEvent(eventType, data) {
  socket.emit('custom-event', {
    eventType,
    data,
  });
}

// Disconnect
function disconnectSocket() {
  socket.disconnect();
}
```

### React Example

```jsx
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

function ChatApp() {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io('https://apg-socket.com:3001', {
      reconnection: true,
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('identify', {
        userId: 'react-user-' + Date.now(),
        platform: 'web',
        appVersion: '1.0.0',
      });
    });

    newSocket.on('receive-message', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleSendMessage = (text) => {
    socket?.emit('send-message', {
      sender: 'React User',
      text,
      platform: 'web',
    });
  };

  return (
    <div>
      <h1>Chat App</h1>
      <p>Status: {isConnected ? '✅ Connected' : '❌ Disconnected'}</p>
      <div>
        {messages.map((msg, i) => (
          <div key={i}>
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <input
        type="text"
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            handleSendMessage(e.target.value);
            e.target.value = '';
          }
        }}
        placeholder="Type message..."
      />
    </div>
  );
}

export default ChatApp;
```

---

## ⚠️ Error Handling

### Common Connection Errors

```javascript
socket.on('connect_error', (error) => {
  console.error('Connection Error:');
  console.error('- Message:', error.message);
  console.error('- Data:', error.data);
  
  // Handle specific errors
  if (error.message === 'CORS policy') {
    console.error('CORS configuration issue');
  }
});

socket.on('error', (error) => {
  console.error('Socket Error:', error);
  // Attempt to reconnect
  socket.connect();
});

socket.on('disconnect', (reason) => {
  console.warn('Disconnection reason:', reason);
  
  if (reason === 'io server disconnect') {
    // Server disconnected, reconnect manually
    setTimeout(() => socket.connect(), 5000);
  } else if (reason === 'io client disconnect') {
    // Client disconnect triggered
  } else {
    // Network error
  }
});
```

### Timeout Handling

```javascript
// Set connection timeout
const connectionTimeout = setTimeout(() => {
  if (!socket.connected) {
    console.error('Connection timeout');
    socket.disconnect();
  }
}, 10000);

socket.on('connect', () => {
  clearTimeout(connectionTimeout);
});
```

---

## ✅ Best Practices

### 1. Connection Management

```javascript
// Always check connection before emitting
if (socket.connected) {
  socket.emit('send-message', data);
} else {
  console.warn('Not connected, queuing message');
  messageQueue.push(data);
}

// Queue messages when disconnected
const messageQueue = [];

socket.on('connect', () => {
  while (messageQueue.length > 0) {
    const msg = messageQueue.shift();
    socket.emit('send-message', msg);
  }
});
```

### 2. Error Recovery

```dart
// Flutter example
Future<void> _connectWithRetry({int maxRetries = 3}) async {
  for (int i = 0; i < maxRetries; i++) {
    try {
      await _socketService.connect(
        url: 'https://apg-socket.com:3001',
        userId: _userId,
      );
      return;
    } catch (e) {
      debugPrint('Connection attempt ${i + 1} failed: $e');
      if (i < maxRetries - 1) {
        await Future.delayed(Duration(seconds: pow(2, i).toInt()));
      }
    }
  }
  throw Exception('Failed to connect after $maxRetries attempts');
}
```

### 3. Data Validation

```php
// Laravel example
public function sendMessage($sender, $text)
{
    // Validate input
    if (empty($sender) || strlen($sender) > 100) {
        throw new Exception('Invalid sender');
    }
    
    if (empty($text) || strlen($text) > 5000) {
        throw new Exception('Invalid message');
    }
    
    // Sanitize
    $sender = htmlspecialchars($sender);
    $text = htmlspecialchars($text);
    
    $this->socketIO->sendMessage($sender, $text);
}
```

### 4. Heartbeat/Keep-Alive

```javascript
// Send periodic ping to keep connection alive
setInterval(() => {
  if (socket.connected) {
    socket.emit('ping');
  }
}, 30000); // Every 30 seconds

socket.on('pong', (data) => {
  console.log('Server is alive at:', data.timestamp);
});
```

### 5. Logging & Monitoring

```php