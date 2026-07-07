

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateBotComponent } from './create-bot.component';
import { BotService } from '../../../services/bot.service';
import { NotificationService } from '../../../services/notification.service';

describe('CreateBotComponent', () => {
  let fixture: ComponentFixture<CreateBotComponent>;
  let component: CreateBotComponent;
  let botSpy: any;
  let notifSpy: any;

  beforeEach(async () => {
    botSpy = { createBot: vi.fn() };
    notifSpy = { success: vi.fn(), error: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [CreateBotComponent, RouterTestingModule, NoopAnimationsModule],
      providers: [
        { provide: BotService, useValue: botSpy },
        { provide: NotificationService, useValue: notifSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateBotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should init with default languageCode en', () => {
    expect(component.form.get('languageCode')?.value).toBe('en');
  });

  it('should be invalid when empty', () => expect(component.form.invalid).toBe(true));

  it('should reject botName < 2 chars', () => {
    component.form.get('botName')?.setValue('A');
    expect(component.form.get('botName')?.invalid).toBe(true);
  });

  it('should not submit if no file', () => {
    component.form.setValue({ botName: 'Bot', projectId: 'proj', languageCode: 'en' });
    component.submit();
    expect(botSpy.createBot).not.toHaveBeenCalled();
  });

  it('validateFile() rejects non-json', () => {
    const file = new File(['x'], 'creds.txt');
    component.validateFile(file);
    expect(component.fileError()).toBe('Only .json files are accepted.');
    expect(component.selectedFile()).toBeNull();
  });

  it('validateFile() rejects oversized file', () => {
    const big = new File([new Array(1024 * 1024 + 2).join('x')], 'creds.json');
    component.validateFile(big);
    expect(component.fileError()).toBe('File must be under 1MB.');
  });

  it('validateFile() accepts valid json', () => {
    const file = new File(['{}'], 'creds.json');
    component.validateFile(file);
    expect(component.fileError()).toBe('');
    expect(component.selectedFile()).toBe(file);
  });

  it('onDragOver sets isDragging', () => {
    const ev = { preventDefault: vi.fn() } as any;
    component.onDragOver(ev);
    expect(component.isDragging()).toBe(true);
    expect(ev.preventDefault).toHaveBeenCalled();
  });

  it('onDrop clears isDragging', () => {
    component.isDragging.set(true);
    const ev = { preventDefault: vi.fn(), dataTransfer: { files: [] } } as any;
    component.onDrop(ev);
    expect(component.isDragging()).toBe(false);
  });

  it('should create bot and show success', async () => {
    const mockBot = { id: 'b1', botName: 'MyBot' };
    botSpy.createBot.mockReturnValue(of(mockBot));
    const file = new File(['{}'], 'creds.json');
    component.selectedFile.set(file);
    component.form.setValue({ botName: 'MyBot', projectId: 'proj', languageCode: 'en' });
    component.submit();
    await fixture.whenStable();
    // Original test used tick(100) to advance past a real setTimeout in the component.
    // fixture.whenStable() only flushes Angular-tracked async work, not an arbitrary
    // timer delay, so we wait past it with a real (short) delay instead.
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(notifSpy.success).toHaveBeenCalled();
  });

  it('should show error on create failure', async () => {
    botSpy.createBot.mockReturnValue(throwError(() => ({ error: { message: 'Bad JSON' } })));
    const file = new File(['{}'], 'creds.json');
    component.selectedFile.set(file);
    component.form.setValue({ botName: 'MyBot', projectId: 'proj', languageCode: 'en' });
    component.submit();
    await fixture.whenStable();
    expect(notifSpy.error).toHaveBeenCalledWith('Bad JSON');
    expect(component.loading()).toBe(false);
  });
});