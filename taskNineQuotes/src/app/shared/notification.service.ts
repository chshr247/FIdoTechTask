import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.snackBar.open(message, 'OK', {
      duration: 3000,
      panelClass: 'snack-success',
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  error(message: string): void {
    this.snackBar.open(message, 'Закрити', {
      duration: 6000,
      panelClass: 'snack-error',
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}

/** Human-readable text for a failed HTTP call. */
export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse) {
    const serverMessage = (err.error as { message?: string } | null)?.message;
    if (serverMessage) return serverMessage;
    if (err.status === 0) return 'Немає з\'єднання з сервером';
  }
  return fallback;
}
