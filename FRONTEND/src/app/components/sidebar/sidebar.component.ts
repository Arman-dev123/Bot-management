import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../services/auth.service';
import { BotService } from '../../services/bot.service';
import { Bot } from '../../models/models';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  exact?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent implements OnInit {
  readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard', exact: true },
    { label: 'My Bots', icon: 'smart_toy', route: '/bots' },
    { label: 'Create Bot', icon: 'add_circle_outline', route: '/bots/create' },
    { label: 'Test Panel', icon: 'science', route: '/test-panel' },
    { label: 'Settings', icon: 'settings', route: '/settings' }
  ];

  bots = signal<Bot[]>([]);
  collapsed = signal<boolean>(false);

  get currentUser() { return this.auth.currentUser(); }
  get userInitial() { return this.currentUser?.name?.charAt(0).toUpperCase() ?? '?'; }

  constructor(
    private auth: AuthService,
    private botService: BotService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.botService.getBots().subscribe({
      next: bots => this.bots.set(bots),
      error: () => this.bots.set([])
    });
  }

  openChat(botId: string): void {
    this.router.navigate(['/chat', botId]);
  }

  logout(): void {
    this.auth.logout();
  }

  toggleCollapse(): void {
    this.collapsed.update(v => !v);
  }
}
