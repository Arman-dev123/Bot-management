
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SidebarComponent } from './sidebar.component';
import { AuthService } from '../../services/auth.service';
import { BotService } from '../../services/bot.service';

const mockBot = { id: 'b1', botName: 'Bot1', projectId: 'p', languageCode: 'en', createdDate: '', updatedDate: '' };

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;
  let component: SidebarComponent;
  let authSpy: any;
  let botSpy: any;

  beforeEach(async () => {
    authSpy = {
      currentUser: signal({ userId: 'u1', name: 'Arman', email: 'arman@test.com' }),
      logout: vi.fn()
    };
    botSpy = { getBots: vi.fn().mockReturnValue(of([mockBot])) };

    await TestBed.configureTestingModule({
      imports: [SidebarComponent, RouterTestingModule, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: BotService, useValue: botSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should load bots on init', async () => {
    await fixture.whenStable();
    expect(component.bots().length).toBe(1);
  });

  it('should show correct user initial', () => {
    expect(component.userInitial).toBe('A');
  });

  it('should call auth.logout on logout()', () => {
    component.logout();
    expect(authSpy.logout).toHaveBeenCalled();
  });

  it('should toggle collapsed state', () => {
    expect(component.collapsed()).toBe(false);
    component.toggleCollapse();
    expect(component.collapsed()).toBe(true);
    component.toggleCollapse();
    expect(component.collapsed()).toBe(false);
  });

  it('should handle getBots error gracefully', async () => {
    botSpy.getBots.mockReturnValue(throwError(() => new Error('fail')));
    component.ngOnInit();
    await fixture.whenStable();
    expect(component.bots()).toEqual([]);
  });

  it('should have 5 nav items', () => {
    expect(component.navItems.length).toBe(5);
  });

  it('should navigate to chat on openChat', () => {
    const routerSpy = vi.spyOn((component as any).router, 'navigate');
    component.openChat('b1');
    expect(routerSpy).toHaveBeenCalledWith(['/chat', 'b1']);
  });
});