import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { ChatSignalRService } from '../../services/chat-signalr.service';
import { BotService } from '../../services/bot.service';
import { AuthService } from '../../services/auth.service';
import { ChatMessage, Bot, ConnectionState } from '../../models/models';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatTooltipModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLDivElement>;

  readonly messages = signal<ChatMessage[]>([]);
  readonly currentBot = signal<Bot | null>(null);
  readonly allBots = signal<Bot[]>([]);
  readonly isConnecting = signal(true);
  readonly errorMsg = signal('');
  readonly inputText = signal('');

  currentBotId = '';
  private shouldScroll = false;
  private subs: Subscription[] = [];

  get connectionState() { return this.chatService.connectionState; }
  get isTyping() { return this.chatService.isTyping; }
  get userInitial() { return this.auth.currentUser()?.name?.charAt(0).toUpperCase() ?? 'U'; }

  get connectionLabel(): string {
    const labels: Record<ConnectionState, string> = {
      connected: 'Connected', connecting: 'Connecting…',
      reconnecting: 'Reconnecting…', disconnected: 'Disconnected'
    };
    return labels[this.connectionState()];
  }

  get canSend(): boolean {
    return this.connectionState() === 'connected' && !this.isConnecting();
  }

  constructor(
    private route: ActivatedRoute,
    private chatService: ChatSignalRService,
    private botService: BotService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.botService.getBots().subscribe({ next: bots => this.allBots.set(bots) });

    this.subs.push(
      this.route.params.subscribe(params => {
        this.currentBotId = params['botId'];
        this.loadBot(this.currentBotId);
      }),
      this.chatService.messages$.subscribe(msgs => {
        this.messages.set(msgs);
        this.shouldScroll = true;
        this.cdr.markForCheck();
      }),
      this.chatService.error$.subscribe(err => {
        if (err) { this.errorMsg.set(err); this.chatService.error$.next(null); this.cdr.markForCheck(); }
      })
    );
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.chatService.disconnectBot().catch(() => {});
  }

  async loadBot(botId: string): Promise<void> {
    this.isConnecting.set(true);
    this.currentBot.set(null);
    this.messages.set([]);
    this.botService.getBot(botId).subscribe({ next: bot => { this.currentBot.set(bot); this.cdr.markForCheck(); } });
    try {
      await this.chatService.connect();
      await this.chatService.connectBot(botId);
    } catch {
      this.errorMsg.set('Failed to connect to bot. Check your connection.');
    } finally {
      this.isConnecting.set(false);
      this.cdr.markForCheck();
    }
  }

  async switchBot(botId: string): Promise<void> {
    if (botId === this.currentBotId) return;
    await this.chatService.disconnectBot().catch(() => {});
    this.currentBotId = botId;
    await this.loadBot(botId);
  }

  async sendMessage(): Promise<void> {
    const text = this.inputText().trim();
    if (!text || !this.canSend) return;
    this.inputText.set('');
    try {
      await this.chatService.sendMessage(text);
    } catch {
      this.errorMsg.set('Failed to send message.');
    }
  }

  onEnterKey(event: KeyboardEvent): void {
    if (!event.shiftKey) { event.preventDefault(); this.sendMessage(); }
  }

  async reconnect(): Promise<void> {
    this.isConnecting.set(true);
    try {
      await this.chatService.connect();
      await this.chatService.connectBot(this.currentBotId);
    } catch {
      this.errorMsg.set('Reconnect failed.');
    } finally {
      this.isConnecting.set(false);
    }
  }

  formatTime(ts: string | Date): string {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private scrollToBottom(): void {
    try {
      const el = this.messagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch {}
  }
}
