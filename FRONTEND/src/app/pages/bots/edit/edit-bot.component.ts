import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BotService } from '../../../services/bot.service';
import { NotificationService } from '../../../services/notification.service';
import { Bot } from '../../../models/models';

@Component({
  selector: 'app-edit-bot',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatInputModule, MatButtonModule, MatSelectModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './edit-bot.component.html',
  styleUrl: './edit-bot.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditBotComponent implements OnInit {
  readonly form = this.fb.nonNullable.group({
    botName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    languageCode: ['en', [Validators.required]]
  });

  readonly bot = signal<Bot | null>(null);
  readonly loading = signal(false);
  readonly fetching = signal(true);

  readonly languages = [
    { code: 'en', label: 'English (en)' },
    { code: 'es', label: 'Spanish (es)' },
    { code: 'fr', label: 'French (fr)' },
    { code: 'de', label: 'German (de)' },
    { code: 'ar', label: 'Arabic (ar)' },
    { code: 'zh', label: 'Chinese (zh)' },
    { code: 'ur', label: 'Urdu (ur)' }
  ];

  private botId = '';

  constructor(
    private fb: FormBuilder,
    private botService: BotService,
    private router: Router,
    private route: ActivatedRoute,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.botId = this.route.snapshot.paramMap.get('id') ?? '';
    this.botService.getBot(this.botId).subscribe({
      next: bot => {
        this.bot.set(bot);
        this.form.patchValue({ botName: bot.botName, languageCode: bot.languageCode });
        this.fetching.set(false);
      },
      error: () => {
        this.notification.error('Bot not found.');
        this.router.navigate(['/bots']);
      }
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);

    this.botService.updateBot(this.botId, this.form.getRawValue()).subscribe({
      next: () => {
        this.notification.success('Bot updated successfully!');
        this.router.navigate(['/bots']);
      },
      error: err => {
        this.notification.error(err.error?.message || 'Update failed.');
        this.loading.set(false);
      }
    });
  }
}
