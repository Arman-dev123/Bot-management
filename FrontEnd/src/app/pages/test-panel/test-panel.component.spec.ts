

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestPanelComponent } from './test-panel.component';
import { ChatSignalRService } from '../../services/chat-signalr.service';
import { BotService } from '../../services/bot.service';
import { NotificationService } from '../../services/notification.service';

const messages$ = new BehaviorSubject<any[]>([]);
const error$ = new BehaviorSubject<string | null>(null);

describe('TestPanelComponent', () => {
  let fixture: ComponentFixture<TestPanelComponent>;
  let component: TestPanelComponent;
  let chatSpy: any;
  let botSpy: any;
  let notifSpy: any;

  beforeEach(async () => {
    chatSpy = {
      connectionState: signal('disconnected'),
      isTyping: signal(false),
      messages$,
      error$,
      connect: vi.fn().mockResolvedValue(undefined),
      connectBot: vi.fn().mockResolvedValue(undefined),
      disconnectBot: vi.fn().mockResolvedValue(undefined),
      sendMessage: vi.fn().mockResolvedValue(undefined)
    };
    botSpy = { getBots: vi.fn().mockReturnValue(of([{ id: 'b1', botName: 'Bot1' }])) };
    notifSpy = { success: vi.fn(), error: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [TestPanelComponent, NoopAnimationsModule],
      providers: [
        { provide: ChatSignalRService, useValue: chatSpy },
        { provide: BotService, useValue: botSpy },
        { provide: NotificationService, useValue: notifSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TestPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => { messages$.next([]); error$.next(null); });

  it('should create', () => expect(component).toBeTruthy());

  it('should load bots on init', async () => {
    await fixture.whenStable();
    expect(component.bots().length).toBe(1);
  });

  it('should show error if no bot selected on connect', async () => {
    component.selectedBotId.set('');
    await component.connectBot();
    expect(notifSpy.error).toHaveBeenCalledWith('Select a bot first.');
  });

  it('should connect bot and set connected', async () => {
    component.selectedBotId.set('b1');
    await component.connectBot();
    expect(component.connected()).toBe(true);
    expect(chatSpy.connect).toHaveBeenCalled();
    expect(chatSpy.connectBot).toHaveBeenCalledWith('b1');
  });

  it('should set errorMsg on connect failure', async () => {
    chatSpy.connect.mockRejectedValue(new Error('fail'));
    component.selectedBotId.set('b1');
    await component.connectBot();
    expect(component.errorMsg()).toBe('Failed to connect to bot.');
    expect(component.connecting()).toBe(false);
  });

  it('should disconnect and clear messages', async () => {
    component.connected.set(true);
    component.messages.set([{ sender: 'user', message: 'hi', botId: '', timestamp: '' }]);
    await component.disconnectBot();
    expect(component.connected()).toBe(false);
    expect(component.messages().length).toBe(0);
  });

  it('should not send if not connected', async () => {
    component.connected.set(false);
    component.inputText.set('hello');
    await component.sendMessage();
    expect(chatSpy.sendMessage).not.toHaveBeenCalled();
  });

  it('should send message and clear input when connected', async () => {
    component.connected.set(true);
    component.inputText.set('test msg');
    await component.sendMessage();
    expect(chatSpy.sendMessage).toHaveBeenCalledWith('test msg');
    expect(component.inputText()).toBe('');
  });

  it('should set errorMsg on send failure', async () => {
    chatSpy.sendMessage.mockRejectedValue(new Error('fail'));
    component.connected.set(true);
    component.inputText.set('hi');
    await component.sendMessage();
    expect(component.errorMsg()).toBe('Send failed.');
  });

  it('onEnterKey without shift sends message', () => {
    const spy = vi.spyOn(component, 'sendMessage');
    const ev = new KeyboardEvent('keydown', { shiftKey: false });
    vi.spyOn(ev, 'preventDefault');
    component.onEnterKey(ev);
    expect(spy).toHaveBeenCalled();
  });

  it('onEnterKey with shift does not send', () => {
    const spy = vi.spyOn(component, 'sendMessage');
    const ev = new KeyboardEvent('keydown', { shiftKey: true });
    component.onEnterKey(ev);
    expect(spy).not.toHaveBeenCalled();
  });

  it('clearMessages clears messages and latencies', () => {
    component.messages.set([{ sender: 'user', message: 'hi', botId: '', timestamp: '' }]);
    component.latencies.set([200, 300]);
    component.clearMessages();
    expect(component.messages().length).toBe(0);
    expect(component.latencies().length).toBe(0);
  });

  it('getSelectedBotName returns correct name', async () => {
    await fixture.whenStable();
    component.selectedBotId.set('b1');
    expect(component.getSelectedBotName()).toBe('Bot1');
  });

  it('avgLatency returns 0 with no latencies', () => {
    component.latencies.set([]);
    expect(component.avgLatency).toBe(0);
  });

  it('avgLatency computes average', () => {
    component.latencies.set([100, 200, 300]);
    expect(component.avgLatency).toBe(200);
  });

  it('formatTime returns time string', () => {
    const r = component.formatTime('2024-01-15T10:30:00Z');
    expect(typeof r).toBe('string');
  });

  it('should update messages on messages$ emit', async () => {
    messages$.next([{ sender: 'user', message: 'hello', botId: '', timestamp: '' }]);
    await fixture.whenStable();
    expect(component.messages().length).toBe(1);
  });

  it('should set errorMsg on error$ emit', async () => {
    error$.next('Test error');
    await fixture.whenStable();
    expect(component.errorMsg()).toBe('Test error');
  });
});