import { Injectable, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { ChatMessage, ConnectionState, SignalRMessage } from '../models/models';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ChatSignalRService {
  private hub: signalR.HubConnection | null = null;

  readonly connectionState = signal<ConnectionState>('disconnected');
  readonly isTyping = signal<boolean>(false);
  readonly messages$ = new BehaviorSubject<ChatMessage[]>([]);
  readonly error$ = new BehaviorSubject<string | null>(null);

  constructor(private auth: AuthService) {}

  async connect(): Promise<void> {
    if (this.hub?.state === signalR.HubConnectionState.Connected) return;

    const token = this.auth.getToken();
    if (!token) throw new Error('Not authenticated');

    this.hub = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.hubUrl}/hubs/chat`, {
        accessTokenFactory: () => token,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    this.registerHandlers();
    this.connectionState.set('connecting');
    await this.hub.start();
    this.connectionState.set('connected');
  }

  async connectBot(botId: string): Promise<void> {
    await this.ensureConnected();
    this.messages$.next([]);
    await this.hub!.invoke('ConnectBot', botId);
  }

  async sendMessage(message: string): Promise<void> {
    await this.ensureConnected();
    await this.hub!.invoke('SendMessage', message);
  }

  async disconnectBot(): Promise<void> {
    if (this.hub?.state === signalR.HubConnectionState.Connected) {
      await this.hub.invoke('DisconnectBot');
    }
  }

  async disconnect(): Promise<void> {
    if (this.hub) {
      await this.hub.stop();
      this.hub = null;
    }
    this.connectionState.set('disconnected');
    this.messages$.next([]);
  }

  clearMessages(): void {
    this.messages$.next([]);
  }

  private registerHandlers(): void {
    if (!this.hub) return;

    this.hub.on('BotConnected', (_botId: string, history: ChatMessage[]) => {
      this.messages$.next(history ?? []);
    });

    this.hub.on('MessageReceived', (msg: SignalRMessage) => {
      const current = this.messages$.getValue();
      this.messages$.next([...current, {
        botId: '',
        sender: msg.sender,
        message: msg.message,
        timestamp: msg.timestamp
      }]);
    });

    this.hub.on('BotTyping', (typing: boolean) => {
      this.isTyping.set(typing);
    });

    this.hub.on('Error', (error: string) => {
      this.error$.next(error);
    });

    this.hub.on('BotDisconnected', () => {
      this.messages$.next([]);
    });

    this.hub.onreconnecting(() => this.connectionState.set('reconnecting'));
    this.hub.onreconnected(() => this.connectionState.set('connected'));
    this.hub.onclose(() => this.connectionState.set('disconnected'));
  }

  private async ensureConnected(): Promise<void> {
    if (this.hub?.state !== signalR.HubConnectionState.Connected) {
      await this.connect();
    }
  }
}
