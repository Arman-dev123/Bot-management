import { Component, OnInit, OnDestroy, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DfoChatService } from '../../services/dfo-chat.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dfo-chat-panel',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatIconModule,
    MatButtonModule, MatInputModule, MatProgressSpinnerModule, MatTooltipModule
  ],
  templateUrl: './dfo-chat-panel.component.html',
  styleUrl: './dfo-chat-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DfoChatPanelComponent implements OnInit, OnDestroy {
  readonly panelOpen = signal(false);
  readonly loading = signal(false);
  readonly configured = signal(false);
  readonly error = signal('');

  // Config form — filled from environment or manually by user
  readonly configForm = this.fb.nonNullable.group({
    scriptUrl: [environment.dfoChat?.scriptUrl ?? '', [Validators.required]],
    channelId: [environment.dfoChat?.channelId ?? '', [Validators.required]],
    brandId: [environment.dfoChat?.brandId ?? '', [Validators.required]]
  });

  get isLoaded() { return this.dfoService.isLoaded; }
  get isVisible() { return this.dfoService.isVisible; }

  constructor(private dfoService: DfoChatService, private fb: FormBuilder) {}

  ngOnInit(): void {
    // Auto-load if all env values are pre-filled
    const { scriptUrl, channelId, brandId } = this.configForm.getRawValue();
    if (scriptUrl && channelId && brandId) {
      this.loadWidget();
    }
  }

  ngOnDestroy(): void {
    this.dfoService.close();
  }

  loadWidget(): void {
    if (this.configForm.invalid) { this.configForm.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');

    const config = this.configForm.getRawValue();
    this.dfoService.load(config);
    this.configured.set(true);

    // Give the script a moment to inject the widget into the DOM
    setTimeout(() => {
      this.loading.set(false);
      if (!this.isLoaded()) {
        this.error.set('Widget script failed to load. Check your Script URL and try again.');
      }
    }, 3000);
  }

  openPanel(): void {
    this.panelOpen.set(true);
    this.dfoService.open();
  }

  closePanel(): void {
    this.panelOpen.set(false);
    this.dfoService.close();
  }

  togglePanel(): void {
    if (this.panelOpen()) this.closePanel();
    else this.openPanel();
  }
}
