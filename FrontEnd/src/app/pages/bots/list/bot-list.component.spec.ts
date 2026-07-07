

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BotListComponent } from './bot-list.component';
import { BotService } from '../../../services/bot.service';
import { NotificationService } from '../../../services/notification.service';

const mockBot = { id: 'b1', botName: 'TestBot', projectId: 'proj', languageCode: 'en', createdDate: '2024-01-01', updatedDate: '2024-01-01' };

describe('BotListComponent', () => {
  let fixture: ComponentFixture<BotListComponent>;
  let component: BotListComponent;
  let botSpy: any;
  let notifSpy: any;

  beforeEach(async () => {
    botSpy = { getBots: vi.fn().mockReturnValue(of([mockBot])), deleteBot: vi.fn() };
    notifSpy = { success: vi.fn(), error: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [BotListComponent, RouterTestingModule, NoopAnimationsModule],
      providers: [
        { provide: BotService, useValue: botSpy },
        { provide: NotificationService, useValue: notifSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BotListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should load bots on init', async () => {
    await fixture.whenStable();
    expect(component.bots().length).toBe(1);
    expect(component.loading()).toBe(false);
  });

  it('should show error on load failure', async () => {
    botSpy.getBots.mockReturnValue(throwError(() => new Error('fail')));
    component.ngOnInit();
    await fixture.whenStable();
    expect(notifSpy.error).toHaveBeenCalled();
    expect(component.loading()).toBe(false);
  });

  it('should delete bot on confirm', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    botSpy.deleteBot.mockReturnValue(of(void 0));
    component.bots.set([mockBot as any]);
    component.deleteBot('b1', 'TestBot');
    await fixture.whenStable();
    expect(component.bots().length).toBe(0);
    expect(notifSpy.success).toHaveBeenCalled();
  });

  it('should not delete without confirm', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    component.deleteBot('b1', 'TestBot');
    await fixture.whenStable();
    expect(botSpy.deleteBot).not.toHaveBeenCalled();
  });

  it('should show error on delete failure', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    botSpy.deleteBot.mockReturnValue(throwError(() => new Error('fail')));
    component.bots.set([mockBot as any]);
    component.deleteBot('b1', 'TestBot');
    await fixture.whenStable();
    expect(notifSpy.error).toHaveBeenCalled();
    expect(component.deletingId()).toBeNull();
  });
});