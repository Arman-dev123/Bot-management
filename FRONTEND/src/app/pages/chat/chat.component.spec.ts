

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, of } from 'rxjs';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ChatComponent } from './chat.component';
import { ChatSignalRService } from '../../services/chat-signalr.service';
import { BotService } from '../../services/bot.service';
import { AuthService } from '../../services/auth.service';

describe('ChatComponent', () => {
  let fixture: ComponentFixture<ChatComponent>;
  let component: ChatComponent;
  let chatSpy: any;
  let botSpy: any;
  const messages$ = new BehaviorSubject<any[]>([]);
  const error$ = new BehaviorSubject<string | null>(null);

  beforeEach(async () => {
    chatSpy = {
      connectionState: signal('connected'),
      isTyping: signal(false),
      messages$,
      error$,
      connect: vi.fn().mockResolvedValue(undefined),
      connectBot: vi.fn().mockResolvedValue(undefined),
      disconnectBot: vi.fn().mockResolvedValue(undefined),
      sendMessage: vi.fn().mockResolvedValue(undefined)
    };
    botSpy = {
      getBots: vi.fn().mockReturnValue(of([{ id: 'b1', botName: 'Bot1', projectId: 'p', languageCode: 'en', createdDate: '', updatedDate: '' }])),
      getBot: vi.fn().mockReturnValue(of({ id: 'b1', botName: 'Bot1', projectId: 'p', languageCode: 'en', createdDate: '', updatedDate: '' }))
    };

    await TestBed.configureTestingModule({
      imports: [ChatComponent, RouterTestingModule, NoopAnimationsModule],
      providers: [
        { provide: ChatSignalRService, useValue: chatSpy },
        { provide: BotService, useValue: botSpy },
        { provide: AuthService, useValue: { currentUser: signal({ userId: 'u1', name: 'Arman', email: 'a@a.com' }) } },
        { provide: ActivatedRoute, useValue: { params: of({ botId: 'b1' }) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => { messages$.next([]); error$.next(null); });

  it('should create', () => expect(component).toBeTruthy());

  it('should load all bots on init', async () => {
    await fixture.whenStable();
    expect(component.allBots().length).toBe(1);
  });

  it('should set currentBotId from route params', async () => {
    await fixture.whenStable();
    expect(component.currentBotId).toBe('b1');
  });

  it('should call connect and connectBot on loadBot', async () => {
    await fixture.whenStable();
    expect(chatSpy.connect).toHaveBeenCalled();
    expect(chatSpy.connectBot).toHaveBeenCalledWith('b1');
  });

  it('should update messages when messages$ emits', async () => {
    messages$.next([{ sender: 'user', message: 'Hi', timestamp: new Date().toISOString(), botId: 'b1' }]);
    await fixture.whenStable();
    expect(component.messages().length).toBe(1);
  });

  it('should set errorMsg when error$ emits', async () => {
    error$.next('Connection error');
    await fixture.whenStable();
    expect(component.errorMsg()).toBe('Connection error');
  });

  it('canSend returns true when connected and not connecting', async () => {
    await fixture.whenStable();
    component.isConnecting.set(false);
    expect(component.canSend).toBe(true);
  });

  it('canSend returns false when isConnecting', () => {
    component.isConnecting.set(true);
    expect(component.canSend).toBe(false);
  });

  it('should return correct connectionLabel for connected', () => {
    (chatSpy as any).connectionState = signal('connected');
    expect(component.connectionLabel).toBe('Connected');
  });

  it('should return correct connectionLabel for disconnected', () => {
    (chatSpy as any).connectionState = signal('disconnected');
    expect(component.connectionLabel).toBe('Disconnected');
  });

  it('should return correct connectionLabel for reconnecting', () => {
    (chatSpy as any).connectionState = signal('reconnecting');
    expect(component.connectionLabel).toBe('Reconnecting…');
  });

  it('should not send empty message', async () => {
    component.inputText.set('');
    component.isConnecting.set(false);
    await component.sendMessage();
    expect(chatSpy.sendMessage).not.toHaveBeenCalled();
  });

  it('should send message and clear input', async () => {
    component.inputText.set('Hello');
    component.isConnecting.set(false);
    await component.sendMessage();
    expect(chatSpy.sendMessage).toHaveBeenCalledWith('Hello');
    expect(component.inputText()).toBe('');
  });

  it('should set errorMsg on sendMessage failure', async () => {
    chatSpy.sendMessage.mockRejectedValue(new Error('fail'));
    component.inputText.set('Hi');
    component.isConnecting.set(false);
    await component.sendMessage();
    expect(component.errorMsg()).toBe('Failed to send message.');
  });

  it('onEnterKey without shift calls sendMessage', () => {
    const spy = vi.spyOn(component, 'sendMessage');
    const ev = new KeyboardEvent('keydown', { shiftKey: false });
    vi.spyOn(ev, 'preventDefault');
    component.onEnterKey(ev);
    expect(spy).toHaveBeenCalled();
  });

  it('onEnterKey with shift does NOT call sendMessage', () => {
    const spy = vi.spyOn(component, 'sendMessage');
    const ev = new KeyboardEvent('keydown', { shiftKey: true });
    component.onEnterKey(ev);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should not switchBot if same botId', async () => {
    component.currentBotId = 'b1';
    await component.switchBot('b1');
    expect(chatSpy.disconnectBot).not.toHaveBeenCalled();
  });

  it('should disconnectBot on destroy', () => {
    component.ngOnDestroy();
    expect(chatSpy.disconnectBot).toHaveBeenCalled();
  });

  it('formatTime returns string', () => {
    const r = component.formatTime('2024-01-15T10:30:00Z');
    expect(typeof r).toBe('string');
    expect(r.length).toBeGreaterThan(0);
  });

  it('should set errorMsg on reconnect failure', async () => {
    chatSpy.connect.mockRejectedValue(new Error('fail'));
    await component.reconnect();
    expect(component.errorMsg()).toBe('Reconnect failed.');
    expect(component.isConnecting()).toBe(false);
  });

  it('userInitial from auth', () => {
    expect(component.userInitial).toBe('A');
  });
});