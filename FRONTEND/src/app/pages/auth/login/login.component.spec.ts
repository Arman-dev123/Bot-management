
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let authSpy: any;
  let notifSpy: any;

  beforeEach(async () => {
    authSpy = { login: vi.fn() };
    notifSpy = { success: vi.fn(), error: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [LoginComponent, RouterTestingModule, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: NotificationService, useValue: notifSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should initialize form with empty fields', () => {
    expect(component.form.get('email')?.value).toBe('');
    expect(component.form.get('password')?.value).toBe('');
  });

  it('should be invalid when empty', () => expect(component.form.invalid).toBe(true));

  it('should reject invalid email', () => {
    component.form.get('email')?.setValue('not-email');
    expect(component.form.get('email')?.invalid).toBe(true);
  });

  it('should be valid with correct data', () => {
    component.form.setValue({ email: 'user@test.com', password: 'password' });
    expect(component.form.valid).toBe(true);
  });

  it('should not call login if form invalid', () => {
    component.submit();
    expect(authSpy.login).not.toHaveBeenCalled();
  });

  it('should call login and navigate on success', async () => {
    authSpy.login.mockReturnValue(of({ token: 'tok', userId: 'u1', name: 'N', email: 'e@e.com' }));
    component.form.setValue({ email: 'user@test.com', password: 'password' });
    component.submit();
    await fixture.whenStable();
    expect(authSpy.login).toHaveBeenCalled();
    expect(notifSpy.success).toHaveBeenCalled();
  });

  it('should set errorMsg on login failure', async () => {
    authSpy.login.mockReturnValue(throwError(() => ({ error: { message: 'Invalid creds' } })));
    component.form.setValue({ email: 'user@test.com', password: 'wrong' });
    component.submit();
    await fixture.whenStable();
    expect(component.errorMsg()).toBe('Invalid creds');
    expect(component.loading()).toBe(false);
  });

  it('should use fallback errorMsg', async () => {
    authSpy.login.mockReturnValue(throwError(() => ({})));
    component.form.setValue({ email: 'user@test.com', password: 'wrong' });
    component.submit();
    await fixture.whenStable();
    expect(component.errorMsg()).toBe('Login failed. Please try again.');
  });

  it('should toggle showPass', () => {
    expect(component.showPass()).toBe(false);
    component.togglePass();
    expect(component.showPass()).toBe(true);
  });

  it('should mark all as touched on invalid submit', () => {
    component.submit();
    expect(component.form.get('email')?.touched).toBe(true);
  });
});