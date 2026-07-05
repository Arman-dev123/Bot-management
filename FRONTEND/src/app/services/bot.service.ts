import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Bot, BotConfig, CreateBotRequest, UpdateBotRequest } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BotService {
  private readonly BASE = `${environment.apiUrl}/bots`;

  constructor(private http: HttpClient) {}

  getBots(): Observable<Bot[]> {
    return this.http.get<Bot[]>(this.BASE);
  }

  getBot(id: string): Observable<Bot> {
    return this.http.get<Bot>(`${this.BASE}/${id}`);
  }

  getBotConfig(id: string): Observable<BotConfig> {
    return this.http.get<BotConfig>(`${this.BASE}/${id}`);
  }

  createBot(data: CreateBotRequest, credentialFile: File): Observable<Bot> {
    const form = new FormData();
    form.append('botName', data.botName);
    form.append('projectId', data.projectId);
    form.append('languageCode', data.languageCode);
    form.append('credentialFile', credentialFile);
    return this.http.post<Bot>(`${this.BASE}/create`, form);
  }

  updateBot(id: string, data: UpdateBotRequest): Observable<Bot> {
    return this.http.put<Bot>(`${this.BASE}/${id}`, data);
  }

  deleteBot(id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${id}`);
  }
}
