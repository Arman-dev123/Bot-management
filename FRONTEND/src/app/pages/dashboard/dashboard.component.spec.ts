

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DashboardComponent } from './dashboard.component';
import { DashboardService } from '../../services/dashboard.service';
import { BotService } from '../../services/bot.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

const mockBot = { id: 'b1', botName: 'TestBot', projectId: 'proj', languageCode: 'en', createdDate: '2024-01-01', updatedDate: '2024-01-01' };
const mockStats = { totalBots: 2, totalMessages: 10, recentBots: [] };

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;
  let dashSpy: any;
  let botSpy: any;
  let notifSpy: any;

  beforeEach(async () => {
    dashSpy = { getStats: vi.fn().mockReturnValue(of(mockStats)) };
    botSpy = { getBots: vi.fn().mockReturnValue(of([mockBot])), deleteBot: vi.fn() };
    notifSpy = { success: vi.fn(), error: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent, RouterTestingModule, NoopAnimationsModule],
      providers: [
        { provide: DashboardService, useValue: dashSpy },
        { provide: BotService, useValue: botSpy },
        { provide: AuthService, useValue: { currentUser: signal({ userId: 'u1', name: 'Arman', email: 'a@a.com' }) } },
        { provide: NotificationService, useValue: notifSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should load stats and bots on init', async () => {
    await fixture.whenStable();
    expect(component.stats()?.totalBots).toBe(2);
    expect(component.bots().length).toBe(1);
    expect(component.loading()).toBe(false);
  });

  it('should show currentUser name', () => {
    expect(component.currentUser?.name).toBe('Arman');
  });

  it('should set loading false on stats error', async () => {
    dashSpy.getStats.mockReturnValue(throwError(() => new Error('fail')));
    botSpy.getBots.mockReturnValue(throwError(() => new Error('fail')));
    component.load();
    await fixture.whenStable();
    expect(component.loading()).toBe(false);
    expect(notifSpy.error).toHaveBeenCalled();
  });

  it('should delete bot and update list', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    botSpy.deleteBot.mockReturnValue(of(void 0));
    component.bots.set([mockBot as any]);
    component.stats.set({ ...mockStats, totalBots: 1 });
    component.deleteBot('b1', 'TestBot');
    await fixture.whenStable();
    expect(component.bots().length).toBe(0);
    expect(component.stats()?.totalBots).toBe(0);
    expect(notifSpy.success).toHaveBeenCalled();
  });

  it('should not delete if confirm is false', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    component.deleteBot('b1', 'TestBot');
    await fixture.whenStable();
    expect(botSpy.deleteBot).not.toHaveBeenCalled();
  });

  it('should show error notification on delete failure', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    botSpy.deleteBot.mockReturnValue(throwError(() => new Error('fail')));
    component.bots.set([mockBot as any]);
    component.deleteBot('b1', 'TestBot');
    await fixture.whenStable();
    expect(notifSpy.error).toHaveBeenCalled();
    expect(component.deletingId()).toBeNull();
  });

  it('totalBots should not go below 0', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    botSpy.deleteBot.mockReturnValue(of(void 0));
    component.bots.set([mockBot as any]);
    component.stats.set({ ...mockStats, totalBots: 0 });
    component.deleteBot('b1', 'TestBot');
    await fixture.whenStable();
    expect(component.stats()?.totalBots).toBe(0);
  });
});