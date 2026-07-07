import { Component, OnInit, OnDestroy, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { ChatSignalRService } from '../../services/chat-signalr.service';
import { BotService } from '../../services/bot.service';
import { NotificationService } from '../../services/notification.service';
import { Bot, ChatMessage } from '../../models/models';

@Component({
  selector: 'app-test-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatSelectModule, MatProgressSpinnerModule, MatTooltipModule],
  templateUrl: './test-panel.component.html',
  styleUrl: './test-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TestPanelComponent implements OnInit, OnDestroy {
  readonly bots = signal<Bot[]>([]);
  readonly selectedBotId = signal<string>('');
  readonly messages = signal<ChatMessage[]>([]);
  readonly inputText = signal('');
  readonly connecting = signal(false);
  readonly connected = signal(false);
  readonly errorMsg = signal('');
  readonly latencies = signal<number[]>([]);

  private subs: Subscription[] = [];
  private msgSentAt = 0;

  get avgLatency(): number {
    const arr = this.latencies();
    return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
  }

  constructor(
    private botService: BotService,
    protected chatService: ChatSignalRService,
    private notification: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.botService.getBots().subscribe({
      next: bots => { this.bots.set(bots); this.cdr.markForCheck(); }
    });

    this.subs.push(
      this.chatService.messages$.subscribe(msgs => {
        if (this.msgSentAt && msgs.length > 0) {
          const last = msgs[msgs.length - 1];
          if (last.sender === 'bot') {
            this.latencies.update(arr => [...arr, Date.now() - this.msgSentAt]);
            this.msgSentAt = 0;
          }
        }
        this.messages.set(msgs);
        this.cdr.markForCheck();
      }),
      this.chatService.error$.subscribe(err => {
        if (err) { this.errorMsg.set(err); this.chatService.error$.next(null); this.cdr.markForCheck(); }
      })
    );

  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    if (this.connected()) this.chatService.disconnectBot().catch(() => {});
  }

  async connectBot(): Promise<void> {
    if (!this.selectedBotId()) { this.notification.error('Select a bot first.'); return; }
    this.connecting.set(true);
    this.errorMsg.set('');
    try {
      await this.chatService.connect();
      await this.chatService.connectBot(this.selectedBotId());
      this.connected.set(true);
      this.latencies.set([]);
    } catch {
      this.errorMsg.set('Failed to connect to bot.');
    } finally {
      this.connecting.set(false);
      this.cdr.markForCheck();
    }
  }

  async disconnectBot(): Promise<void> {
    await this.chatService.disconnectBot().catch(() => {});
    this.connected.set(false);
    this.messages.set([]);
    this.latencies.set([]);
    this.cdr.markForCheck();
  }

  async sendMessage(): Promise<void> {
    const text = this.inputText().trim();
    if (!text || !this.connected()) return;
    this.inputText.set('');
    this.msgSentAt = Date.now();
    try {
      await this.chatService.sendMessage(text);
    } catch {
      this.errorMsg.set('Send failed.');
    }
  }

  onEnterKey(event: KeyboardEvent): void {
    if (!event.shiftKey) { event.preventDefault(); this.sendMessage(); }
  }

  clearMessages(): void {
    this.messages.set([]);
    this.latencies.set([]);
  }

  formatTime(ts: string | Date): string {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getSelectedBotName(): string {
    return this.bots().find(b => b.id === this.selectedBotId())?.botName ?? '';
  }
}