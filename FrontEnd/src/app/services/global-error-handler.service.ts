import { ErrorHandler, Injectable, NgZone } from '@angular/core';
import { NotificationService } from './notification.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private zone: NgZone, private notification: NotificationService) {}

  handleError(error: unknown): void {
    this.zone.run(() => {
      console.error('Global error:', error);
      this.notification.error('An unexpected error occurred. Please try again.');
    });
  }
}
