
// import { TestBed, ComponentFixture } from '@angular/core/testing';
// import { RouterTestingModule } from '@angular/router/testing';
// import { NoopAnimationsModule } from '@angular/platform-browser/animations';
// import { signal } from '@angular/core';
// import { of, throwError } from 'rxjs';
// import { describe, it, expect, beforeEach, vi } from 'vitest';
// import { SidebarComponent } from './sidebar.component';
// import { AuthService } from '../../services/auth.service';
// import { BotService } from '../../services/bot.service';

// const mockBot = { id: 'b1', botName: 'Bot1', projectId: 'p', languageCode: 'en', createdDate: '', updatedDate: '' };

// describe('SidebarComponent', () => {
//   let fixture: ComponentFixture<SidebarComponent>;
//   let component: SidebarComponent;
//   let authSpy: any;
//   let botSpy: any;

//   beforeEach(async () => {
//     authSpy = {
//       currentUser: signal({ userId: 'u1', name: 'Arman', email: 'arman@test.com' }),
//       logout: vi.fn()
//     };
//     botSpy = { getBots: vi.fn().mockReturnValue(of([mockBot])) };

//     await TestBed.configureTestingModule({
//       imports: [SidebarComponent, RouterTestingModule, NoopAnimationsModule],
//       providers: [
//         { provide: AuthService, useValue: authSpy },
//         { provide: BotService, useValue: botSpy }
//       ]
//     }).compileComponents();

//     fixture = TestBed.createComponent(SidebarComponent);
//     component = fixture.componentInstance;
//     fixture.detectChanges();
//   });

//   it('should create', () => expect(component).toBeTruthy());

//   it('should load bots on init', async () => {
//     await fixture.whenStable();
//     expect(component.bots().length).toBe(1);
//   });

//   it('should show correct user initial', () => {
//     expect(component.userInitial).toBe('A');
//   });

//   it('should call auth.logout on logout()', () => {
//     component.logout();
//     expect(authSpy.logout).toHaveBeenCalled();
//   });

//   it('should toggle collapsed state', () => {
//     expect(component.collapsed()).toBe(false);
//     component.toggleCollapse();
//     expect(component.collapsed()).toBe(true);
//     component.toggleCollapse();
//     expect(component.collapsed()).toBe(false);
//   });

//   it('should handle getBots error gracefully', async () => {
//     botSpy.getBots.mockReturnValue(throwError(() => new Error('fail')));
//     component.ngOnInit();
//     await fixture.whenStable();
//     expect(component.bots()).toEqual([]);
//   });

//   it('should have 5 nav items', () => {
//     expect(component.navItems.length).toBe(5);
//   });

//   it('should navigate to chat on openChat', () => {
//     const routerSpy = vi.spyOn((component as any).router, 'navigate');
//     component.openChat('b1');
//     expect(routerSpy).toHaveBeenCalledWith(['/chat', 'b1']);
//   });
// });



import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SidebarComponent } from './sidebar.component';
import { AuthService } from '../../services/auth.service';
import { BotService } from '../../services/bot.service';
import { DfoChatService } from '../../services/dfo-chat.service';

const mockBot = { id: 'b1', botName: 'Bot1', projectId: 'p', languageCode: 'en', createdDate: '', updatedDate: '' };

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;
  let component: SidebarComponent;
  let authSpy: any;
  let botSpy: any;
  let dfoSpy: any;

  beforeEach(async () => {
    authSpy = {
      currentUser: signal({ userId: 'u1', name: 'Arman', email: 'arman@test.com' }),
      logout: vi.fn()
    };
    botSpy = { getBots: vi.fn().mockReturnValue(of([mockBot])) };
    dfoSpy = {
      isLoaded: signal(false),
      isVisible: signal(false),
      unload: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [SidebarComponent, RouterTestingModule, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: BotService, useValue: botSpy },
        { provide: DfoChatService, useValue: dfoSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should load bots on init', () => {
    expect(component.bots().length).toBe(1);
  });

  it('should show correct user initial', () => {
    expect(component.userInitial).toBe('A');
  });

  it('should call dfo.unload AND auth.logout on logout()', () => {
    component.logout();
    expect(dfoSpy.unload).toHaveBeenCalled();
    expect(authSpy.logout).toHaveBeenCalled();
  });

  it('should toggle collapsed state', () => {
    expect(component.collapsed()).toBe(false);
    component.toggleCollapse();
    expect(component.collapsed()).toBe(true);
    component.toggleCollapse();
    expect(component.collapsed()).toBe(false);
  });

  it('should handle getBots error gracefully', () => {
    botSpy.getBots.mockReturnValue(throwError(() => new Error('fail')));
    component.ngOnInit();
    expect(component.bots()).toEqual([]);
  });

  it('should have 6 nav items including DFO Live Chat', () => {
    expect(component.navItems.length).toBe(6);
    const dfoItem = component.navItems.find(i => i.route === '/dfo-chat');
    expect(dfoItem).toBeTruthy();
    expect(dfoItem?.label).toBe('NICE DFO Live Chat');
  });

  it('should place dividers after Test Panel and Settings', () => {
    const testPanelItem = component.navItems.find(i => i.route === '/test-panel');
    const settingsItem = component.navItems.find(i => i.route === '/settings');
    expect(testPanelItem?.divider).toBe(true);
    expect(settingsItem?.divider).toBe(true);
  });

  it('should navigate to chat on openChat', () => {
    const routerSpy = vi.spyOn((component as any).router, 'navigate');
    component.openChat('b1');
    expect(routerSpy).toHaveBeenCalledWith(['/chat', 'b1']);
  });

  it('dfoChatLoaded reflects dfoService.isLoaded', () => {
    expect(component.dfoChatLoaded).toBe(false);
    dfoSpy.isLoaded = signal(true);
    expect(component.dfoChatLoaded).toBe(true);
  });
});