

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RegisterComponent, passwordMatchValidator } from './register.component';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let authSpy: any;
  let notifSpy: any;

  beforeEach(async () => {
    authSpy = { register: vi.fn() };
    notifSpy = { success: vi.fn(), error: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, RouterTestingModule, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: NotificationService, useValue: notifSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());
  it('should initialize empty', () => {
    expect(component.form.get('name')?.value).toBe('');
    expect(component.form.invalid).toBe(true);
  });

  it('should reject single char name', () => {
    component.form.get('name')?.setValue('A');
    expect(component.form.get('name')?.invalid).toBe(true);
  });

  it('should reject short password', () => {
    component.form.get('password')?.setValue('short');
    expect(component.form.get('password')?.invalid).toBe(true);
  });

  it('should fail on password mismatch', () => {
    component.form.patchValue({ password: 'Password1!', confirmPassword: 'Mismatch!' });
    expect(component.form.errors?.['passwordMismatch']).toBe(true);
  });

  it('should pass when passwords match', () => {
    component.form.setValue({ name: 'Test', email: 'test@test.com', password: 'Password1!', confirmPassword: 'Password1!' });
    expect(component.form.valid).toBe(true);
  });

  it('should not call register if invalid', () => {
    component.submit();
    expect(authSpy.register).not.toHaveBeenCalled();
  });

  it('should register and navigate on success', async () => {
    authSpy.register.mockReturnValue(of({ token: 'tok', userId: 'u1', name: 'N', email: 'e@e.com' }));
    component.form.setValue({ name: 'Test', email: 'test@test.com', password: 'Password1!', confirmPassword: 'Password1!' });
    component.submit();
    await fixture.whenStable();
    expect(notifSpy.success).toHaveBeenCalled();
  });

  it('should set errorMsg on failure', async () => {
    authSpy.register.mockReturnValue(throwError(() => ({ error: { message: 'Email taken' } })));
    component.form.setValue({ name: 'Test', email: 'test@test.com', password: 'Password1!', confirmPassword: 'Password1!' });
    component.submit();
    await fixture.whenStable();
    expect(component.errorMsg()).toBe('Email taken');
  });

  it('should toggle showPass', () => {
    component.togglePass();
    expect(component.showPass()).toBe(true);
  });

  describe('passwordMatchValidator', () => {
    const fb = new FormBuilder();
    it('returns null when passwords match', () => {
      const g = fb.group({ password: 'abc', confirmPassword: 'abc' });
      expect(passwordMatchValidator(g)).toBeNull();
    });
    it('returns error when passwords differ', () => {
      const g = fb.group({ password: 'abc', confirmPassword: 'xyz' });
      expect(passwordMatchValidator(g)).toEqual({ passwordMismatch: true });
    });
  });
});