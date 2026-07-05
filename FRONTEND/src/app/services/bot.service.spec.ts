import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BotService } from './bot.service';
import { environment } from '../../environments/environment';

const mockBot = { id: 'b1', botName: 'TestBot', projectId: 'proj-1', languageCode: 'en', createdDate: '2024-01-01', updatedDate: '2024-01-01' };

describe('BotService', () => {
  let service: BotService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [BotService] });
    service = TestBed.inject(BotService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => { expect(service).toBeTruthy(); });

  it('getBots() GET /bots returns array', () => {
    let result: any;
    service.getBots().subscribe(r => result = r);
    http.expectOne(`${environment.apiUrl}/bots`).flush([mockBot]);
    expect(result.length).toBe(1);
    expect(result[0].botName).toBe('TestBot');
  });

  it('getBot() GET /bots/:id', () => {
    let result: any;
    service.getBot('b1').subscribe(r => result = r);
    http.expectOne(`${environment.apiUrl}/bots/b1`).flush(mockBot);
    expect(result.id).toBe('b1');
  });

  it('getBotConfig() GET /bots/:id', () => {
    service.getBotConfig('b1').subscribe();
    const req = http.expectOne(`${environment.apiUrl}/bots/b1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockBot);
  });

  it('createBot() POST /bots/create with FormData', () => {
    const file = new File(['{}'], 'creds.json');
    service.createBot({ botName: 'B', projectId: 'p', languageCode: 'en' }, file).subscribe();
    const req = http.expectOne(`${environment.apiUrl}/bots/create`);
    expect(req.request.method).toBe('POST');
    const body = req.request.body as FormData;
    expect(body.get('botName')).toBe('B');
    expect(body.get('projectId')).toBe('p');
    expect(body.get('languageCode')).toBe('en');
    req.flush(mockBot);
  });

  it('updateBot() PUT /bots/:id', () => {
    service.updateBot('b1', { botName: 'New' }).subscribe();
    const req = http.expectOne(`${environment.apiUrl}/bots/b1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ botName: 'New' });
    req.flush(mockBot);
  });

  it('deleteBot() DELETE /bots/:id', () => {
    service.deleteBot('b1').subscribe();
    const req = http.expectOne(`${environment.apiUrl}/bots/b1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
