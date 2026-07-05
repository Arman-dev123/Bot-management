import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettingsComponent } from './settings.component';
import { AuthService } from '../../services/auth.service';

describe('SettingsComponent', () => {
  let fixture: ComponentFixture<SettingsComponent>;
  let component: SettingsComponent;
  let authSpy: any;

  beforeEach(async () => {
    authSpy = {
      currentUser: signal({ userId: 'u1', name: 'Arman', email: 'arman@test.com' }),
      logout: vi.fn()
    };
    await TestBed.configureTestingModule({
      imports: [SettingsComponent, NoopAnimationsModule],
      providers: [{ provide: AuthService, useValue: authSpy }]
    }).compileComponents();
    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());
  it('should show current user', () => expect(component.currentUser?.name).toBe('Arman'));
  it('should call auth.logout on logout()', () => {
    component.logout();
    expect(authSpy.logout).toHaveBeenCalled();
  });
});
