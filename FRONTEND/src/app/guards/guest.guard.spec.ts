import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { guestGuard } from './guest.guard';
import { AuthService } from '../services/auth.service';

describe('guestGuard', () => {
  const makeAuth = (authenticated: boolean) => ({ isAuthenticated: signal(authenticated) });
  beforeEach(() => TestBed.resetTestingModule());

  it('returns true when NOT authenticated', () => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [{ provide: AuthService, useValue: makeAuth(false) }]
    });
    const result = TestBed.runInInjectionContext(() => (guestGuard as any)({} as any, {} as any));
    expect(result).toBe(true);
  });

  it('returns false and navigates to /dashboard when authenticated', () => {
    const routerSpy = { navigate: vi.fn() };
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: makeAuth(true) },
        { provide: Router, useValue: routerSpy }
      ]
    });
    const result = TestBed.runInInjectionContext(() => (guestGuard as any)({} as any, {} as any));
    expect(result).toBe(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
