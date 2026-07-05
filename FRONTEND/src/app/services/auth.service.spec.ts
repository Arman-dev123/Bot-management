import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

const mockAuthResponse = {
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1MSIsImV4cCI6OTk5OTk5OTk5OX0.sig',
  userId: 'u1', name: 'Test User', email: 'test@test.com',
  expiresAt: new Date(Date.now() + 86400000).toISOString()
};

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => { http.verify(); localStorage.clear(); });

  it('should be created', () => { expect(service).toBeTruthy(); });

  it('isAuthenticated() returns false with no token', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  it('login() POST to /auth/login and stores token', () => {
    service.login({ email: 'test@test.com', password: 'pass' }).subscribe(res => {
      expect(res.token).toBe(mockAuthResponse.token);
    });
    const req = http.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockAuthResponse);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()?.email).toBe('test@test.com');
  });

  it('register() POST to /auth/register and stores token', () => {
    service.register({ name: 'Test', email: 'test@test.com', password: 'pass', confirmPassword: 'pass' }).subscribe();
    const req = http.expectOne(`${environment.apiUrl}/auth/register`);
    expect(req.request.method).toBe('POST');
    req.flush(mockAuthResponse);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('logout() clears token and user', () => {
    service.login({ email: 'test@test.com', password: 'pass' }).subscribe();
    http.expectOne(`${environment.apiUrl}/auth/login`).flush(mockAuthResponse);
    service.logout();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
    expect(service.getToken()).toBeNull();
  });

  it('getToken() returns null when not logged in', () => {
    expect(service.getToken()).toBeNull();
  });

  it('getToken() returns token after login', () => {
    service.login({ email: 'test@test.com', password: 'pass' }).subscribe();
    http.expectOne(`${environment.apiUrl}/auth/login`).flush(mockAuthResponse);
    expect(service.getToken()).toBe(mockAuthResponse.token);
  });

  it('currentUser() returns null initially', () => {
    expect(service.currentUser()).toBeNull();
  });

  it('currentUser() returns user after login', () => {
    service.login({ email: 'test@test.com', password: 'pass' }).subscribe();
    http.expectOne(`${environment.apiUrl}/auth/login`).flush(mockAuthResponse);
    expect(service.currentUser()?.name).toBe('Test User');
  });
});
