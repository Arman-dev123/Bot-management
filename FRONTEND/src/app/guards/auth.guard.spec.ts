import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  const makeAuth = (authenticated: boolean) => ({
    isAuthenticated: signal(authenticated)
  });

  beforeEach(() => TestBed.resetTestingModule());

  it('returns true when authenticated', () => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [{ provide: AuthService, useValue: makeAuth(true) }]
    });
    const result = TestBed.runInInjectionContext(() => (authGuard as any)({} as any, {} as any));
    expect(result).toBe(true);
  });

  it('returns false and navigates to /login when not authenticated', () => {
    const routerSpy = { navigate: vi.fn() };
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: makeAuth(false) },
        { provide: Router, useValue: routerSpy }
      ]
    });
    const result = TestBed.runInInjectionContext(() => (authGuard as any)({} as any, {} as any));
    expect(result).toBe(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });
});
