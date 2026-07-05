import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BotService } from '../../../services/bot.service';
import { NotificationService } from '../../../services/notification.service';
import { Bot } from '../../../models/models';

@Component({
  selector: 'app-bot-list',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatTooltipModule],
  templateUrl: './bot-list.component.html',
  styleUrl: './bot-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BotListComponent implements OnInit {
  readonly bots = signal<Bot[]>([]);
  readonly loading = signal(true);
  readonly deletingId = signal<string | null>(null);

  constructor(private botService: BotService, private notification: NotificationService) {}

  ngOnInit(): void {
    this.botService.getBots().subscribe({
      next: bots => { this.bots.set(bots); this.loading.set(false); },
      error: () => { this.notification.error('Failed to load bots.'); this.loading.set(false); }
    });
  }

  deleteBot(id: string, name: string): void {
    if (!confirm(`Delete "${name}"?`)) return;
    this.deletingId.set(id);
    this.botService.deleteBot(id).subscribe({
      next: () => {
        this.bots.update(list => list.filter(b => b.id !== id));
        this.notification.success(`"${name}" deleted.`);
        this.deletingId.set(null);
      },
      error: () => { this.notification.error('Delete failed.'); this.deletingId.set(null); }
    });
  }
}
