// import { TestBed } from '@angular/core/testing';
// import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
// import { provideHttpClient, withInterceptors } from '@angular/common/http';
// import { HttpClient } from '@angular/common/http';
// import { signal } from '@angular/core';
// import { describe, it, expect, beforeEach, afterEach } from 'vitest';
// import { authInterceptor } from './auth.interceptor';
// import { AuthService } from '../services/auth.service';

// describe('authInterceptor', () => {
//   let http: HttpClient;
//   let controller: HttpTestingController;

//   const makeAuth = (token: string | null) => ({ getToken: () => token });

//   beforeEach(() => {
//     TestBed.configureTestingModule({
//       imports: [HttpClientTestingModule],
//       providers: [
//         provideHttpClient(withInterceptors([authInterceptor])),
//         { provide: AuthService, useValue: makeAuth('test-token') }
//       ]
//     });
//     http = TestBed.inject(HttpClient);
//     controller = TestBed.inject(HttpTestingController);
//   });

//   afterEach(() => controller.verify());

//   it('adds Authorization header when token exists', () => {
//     http.get('/test').subscribe();
//     const req = controller.expectOne('/test');
//     expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
//     req.flush({});
//   });

//   it('does not add Authorization header when no token', () => {
//     TestBed.resetTestingModule();
//     TestBed.configureTestingModule({
//       providers: [
//         provideHttpClient(withInterceptors([authInterceptor])),
//         { provide: AuthService, useValue: makeAuth(null) }
//       ]
//     });
//     const http2 = TestBed.inject(HttpClient);
//     const ctrl2 = TestBed.inject(HttpTestingController);
//     http2.get('/test').subscribe();
//     const req = ctrl2.expectOne('/test');
//     expect(req.request.headers.has('Authorization')).toBe(false);
//     req.flush({});
//     ctrl2.verify();
//   });
// });



import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  const makeAuth = (token: string | null) => ({ getToken: () => token });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: makeAuth('test-token') }
      ]
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('adds Authorization header when token exists', () => {
    http.get('/test').subscribe();
    const req = controller.expectOne('/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    req.flush({});
  });

  it('does not add Authorization header when no token', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: makeAuth(null) }
      ]
    });
    const http2 = TestBed.inject(HttpClient);
    const ctrl2 = TestBed.inject(HttpTestingController);
    http2.get('/test').subscribe();
    const req = ctrl2.expectOne('/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
    ctrl2.verify();
  });
});