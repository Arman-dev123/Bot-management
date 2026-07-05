import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DashboardService } from './dashboard.service';
import { environment } from '../../environments/environment';

describe('DashboardService', () => {
  let service: DashboardService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [DashboardService] });
    service = TestBed.inject(DashboardService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => expect(service).toBeTruthy());

  it('getStats() GET /dashboard/stats', () => {
    const mockStats = { totalBots: 3, totalMessages: 50, recentBots: [] };
    let result: any;
    service.getStats().subscribe(r => result = r);
    http.expectOne(`${environment.apiUrl}/dashboard/stats`).flush(mockStats);
    expect(result.totalBots).toBe(3);
    expect(result.totalMessages).toBe(50);
  });
});
