import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { signal } from '@angular/core';

import { DfoChatPanelComponent } from './dfo-chat-panel.component';
import { DfoChatService } from '../../services/dfo-chat.service';

describe('DfoChatPanelComponent', () => {
  let component: DfoChatPanelComponent;
  let fixture: ComponentFixture<DfoChatPanelComponent>;
  let dfoServiceMock: {
    load: ReturnType<typeof vi.fn>;
    open: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    isLoaded: ReturnType<typeof signal<boolean>>;
    isVisible: ReturnType<typeof signal<boolean>>;
  };

  beforeEach(() => {
    dfoServiceMock = {
      load: vi.fn(),
      open: vi.fn(),
      close: vi.fn(),
      isLoaded: signal(false),
      isVisible: signal(false)
    };

    TestBed.configureTestingModule({
      imports: [DfoChatPanelComponent, ReactiveFormsModule, NoopAnimationsModule],
      providers: [{ provide: DfoChatService, useValue: dfoServiceMock }]
    });

    fixture = TestBed.createComponent(DfoChatPanelComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should be created', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize the config form', () => {
    fixture.detectChanges();
    expect(component.configForm.contains('scriptUrl')).toBe(true);
    expect(component.configForm.contains('channelId')).toBe(true);
    expect(component.configForm.contains('brandId')).toBe(true);
  });

  it('should not call dfoService.load when the form is invalid', () => {
    fixture.detectChanges();
    // ngOnInit may have already triggered an auto-load if environment.dfoChat
    // has pre-filled values, so clear that call before testing this path.
    dfoServiceMock.load.mockClear();

    component.configForm.setValue({ scriptUrl: '', channelId: '', brandId: '' });
    component.loadWidget();

    expect(dfoServiceMock.load).not.toHaveBeenCalled();
    expect(component.configForm.get('scriptUrl')?.touched).toBe(true);
  });

  it('should call dfoService.load and set configured/loading state when form is valid', () => {
    fixture.detectChanges();
    component.configForm.setValue({
      scriptUrl: 'https://web-modules-de-na1.niceincontact.com/loader/1/loader.js',
      channelId: 'chat_1842a9a4-fa58-4469-875b-cb76fcb87e8c',
      brandId: '1586'
    });

    component.loadWidget();

    expect(dfoServiceMock.load).toHaveBeenCalledWith({
      scriptUrl: 'https://web-modules-de-na1.niceincontact.com/loader/1/loader.js',
      channelId: 'chat_1842a9a4-fa58-4469-875b-cb76fcb87e8c',
      brandId: '1586'
    });
    expect(component.configured()).toBe(true);
    expect(component.loading()).toBe(true);
  });

  it('should clear loading after the timeout when the widget loads successfully', () => {
    vi.useFakeTimers();
    fixture.detectChanges();
    component.configForm.setValue({
      scriptUrl: 'https://example.com/loader.js',
      channelId: 'chat_123',
      brandId: '1586'
    });

    component.loadWidget();
    dfoServiceMock.isLoaded.set(true);
    vi.advanceTimersByTime(3000);

    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('');
  });

  it('should set an error message if the widget fails to load in time', () => {
    vi.useFakeTimers();
    fixture.detectChanges();
    component.configForm.setValue({
      scriptUrl: 'https://example.com/loader.js',
      channelId: 'chat_123',
      brandId: '1586'
    });

    component.loadWidget();
    vi.advanceTimersByTime(3000);

    expect(component.error()).toContain('Widget script failed to load');
  });

  it('openPanel() should set panelOpen and call dfoService.open()', () => {
    fixture.detectChanges();
    component.openPanel();
    expect(component.panelOpen()).toBe(true);
    expect(dfoServiceMock.open).toHaveBeenCalled();
  });

  it('closePanel() should clear panelOpen and call dfoService.close()', () => {
    fixture.detectChanges();
    component.openPanel();
    component.closePanel();
    expect(component.panelOpen()).toBe(false);
    expect(dfoServiceMock.close).toHaveBeenCalled();
  });

  it('togglePanel() should open when closed and close when open', () => {
    fixture.detectChanges();
    expect(component.panelOpen()).toBe(false);

    component.togglePanel();
    expect(component.panelOpen()).toBe(true);
    expect(dfoServiceMock.open).toHaveBeenCalled();

    component.togglePanel();
    expect(component.panelOpen()).toBe(false);
    expect(dfoServiceMock.close).toHaveBeenCalled();
  });

  it('should call dfoService.close() on destroy', () => {
    fixture.detectChanges();
    component.ngOnDestroy();
    expect(dfoServiceMock.close).toHaveBeenCalled();
  });
});