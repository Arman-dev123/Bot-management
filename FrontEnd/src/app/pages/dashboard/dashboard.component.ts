import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';
import { DashboardService } from '../../services/dashboard.service';
import { BotService } from '../../services/bot.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { DashboardStats, Bot } from '../../models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatTooltipModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  readonly stats = signal<DashboardStats | null>(null);
  readonly bots = signal<Bot[]>([]);
  readonly loading = signal(true);
  readonly deletingId = signal<string | null>(null);

  get currentUser() { return this.auth.currentUser(); }

  constructor(
    private dashboardService: DashboardService,
    private botService: BotService,
    private auth: AuthService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    forkJoin({
      stats: this.dashboardService.getStats(),
      bots: this.botService.getBots()
    }).subscribe({
      next: ({ stats, bots }) => {
        this.stats.set(stats);
        this.bots.set(bots);
        this.loading.set(false);
      },
      error: () => {
        this.notification.error('Failed to load dashboard data.');
        this.loading.set(false);
      }
    });
  }

  deleteBot(botId: string, botName: string): void {
    if (!confirm(`Delete "${botName}"? This cannot be undone.`)) return;
    this.deletingId.set(botId);
    this.botService.deleteBot(botId).subscribe({
      next: () => {
        this.bots.update(list => list.filter(b => b.id !== botId));
        this.stats.update(s => s ? { ...s, totalBots: Math.max(0, s.totalBots - 1) } : s);
        this.notification.success(`"${botName}" deleted.`);
        this.deletingId.set(null);
      },
      error: () => {
        this.notification.error('Failed to delete bot.');
        this.deletingId.set(null);
      }
    });
  }
}
