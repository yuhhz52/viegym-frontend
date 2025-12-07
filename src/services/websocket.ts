import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { ChatMessageResponse } from '../api/chatApi';
import type { BookingNotificationResponse } from '../types/booking';

class WebSocketService {
  private client: Client | null = null;
  private connected: boolean = false;
  private messageCallbacks: ((message: ChatMessageResponse) => void)[] = [];
  private notificationCallbacks: ((notification: BookingNotificationResponse) => void)[] = [];

  connect(userId: string) {
    if (this.connected && this.client) {
      console.log('[WebSocket] Already connected for user:', userId);
      return;
    }

    // Disconnect existing connection first
    if (this.client) {
      this.disconnect();
    }

    console.log('[WebSocket] Connecting for user:', userId);

    this.client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      debug: (str) => {
        console.log('[STOMP]', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = () => {
      console.log('[WebSocket] ✅ Connected successfully');
      this.connected = true;
      console.log('[WebSocket] Connection state updated - this.connected:', this.connected, 'client.connected:', this.client?.connected);

      // Subscribe to personal message queue
      this.client?.subscribe(`/topic/chat/${userId}`, (message: IMessage) => {
        const chatMessage: ChatMessageResponse = JSON.parse(message.body);
        console.log('[WebSocket]  Received message:', chatMessage);
        
        // Notify all callbacks
        this.messageCallbacks.forEach(callback => {
          console.log('[WebSocket] Calling message callback...');
          callback(chatMessage);
        });
      });
      
      // Subscribe to coach notifications
      this.client?.subscribe(`/topic/coach/${userId}/notifications`, (message: IMessage) => {
        const notification: BookingNotificationResponse = JSON.parse(message.body);
        console.log('[WebSocket]  Received notification:', notification);
        
        // Notify all notification callbacks
        this.notificationCallbacks.forEach(callback => {
          console.log('[WebSocket] Calling notification callback...');
          callback(notification);
        });
      });
      
      console.log('[WebSocket]  Subscribed to chat and notifications for user:', userId);
    };

    this.client.onStompError = (frame) => {
      console.error('STOMP error:', frame);
    };

    this.client.onWebSocketClose = () => {
      console.log('WebSocket disconnected');
      this.connected = false;
    };

    this.client.activate();
  }

  disconnect() {
    if (this.client) {
      console.log('[WebSocket] Disconnecting...');
      this.client.deactivate();
      this.client = null;
      this.connected = false;
      this.messageCallbacks = [];
      this.notificationCallbacks = [];
    }
  }

  onMessage(callback: (message: ChatMessageResponse) => void) {
    this.messageCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    };
  }

  onNotification(callback: (notification: BookingNotificationResponse) => void) {
    this.notificationCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.notificationCallbacks = this.notificationCallbacks.filter(cb => cb !== callback);
    };
  }

  isConnected() {
    const connectionState = this.connected && this.client && this.client.connected;
    console.log('[WebSocket] isConnected check - this.connected:', this.connected, 'client.connected:', this.client?.connected, 'final:', connectionState);
    return connectionState;
  }
}

export const wsService = new WebSocketService();
