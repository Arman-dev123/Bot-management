import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BotService } from '../../../services/bot.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-create-bot',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatInputModule, MatButtonModule, MatSelectModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './create-bot.component.html',
  styleUrl: './create-bot.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateBotComponent {
  readonly form = this.fb.nonNullable.group({
    botName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    projectId: ['', [Validators.required]],
    languageCode: ['en', [Validators.required]]
  });

  readonly selectedFile = signal<File | null>(null);
  readonly fileError = signal('');
  readonly loading = signal(false);
  readonly isDragging = signal(false);

  readonly languages = [
    { code: 'en', label: 'English (en)' },
    { code: 'es', label: 'Spanish (es)' },
    { code: 'fr', label: 'French (fr)' },
    { code: 'de', label: 'German (de)' },
    { code: 'ar', label: 'Arabic (ar)' },
    { code: 'zh', label: 'Chinese (zh)' },
    { code: 'ur', label: 'Urdu (ur)' }
  ];

  constructor(
    private fb: FormBuilder,
    private botService: BotService,
    private router: Router,
    private notification: NotificationService
  ) {}

  onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.validateFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.validateFile(file);
  }

  validateFile(file: File): void {
    this.fileError.set('');
    if (!file.name.endsWith('.json')) { this.fileError.set('Only .json files are accepted.'); return; }
    if (file.size > 1024 * 1024) { this.fileError.set('File must be under 1MB.'); return; }
    this.selectedFile.set(file);
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (!this.selectedFile()) { this.fileError.set('Credential file is required.'); return; }
    this.loading.set(true);

    this.botService.createBot(this.form.getRawValue(), this.selectedFile()!).subscribe({
      next: bot => {
        this.notification.success(`Bot "${bot.botName}" created!`);
        this.router.navigate(['/chat', bot.id]);
      },
      error: err => {
        this.notification.error(err.error?.message || 'Failed to create bot.');
        this.loading.set(false);
      }
    });
  }
}
