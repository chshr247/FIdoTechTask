import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  /** Optional quoted snippet shown under the message. */
  details?: string;
  confirmText?: string;
  cancelText?: string;
}

/** Generic yes/no dialog. Closes with `true` on confirm, `false`/undefined otherwise. */
@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
      @if (data.details) {
        <blockquote class="details">{{ data.details }}</blockquote>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false" cdkFocusInitial>
        {{ data.cancelText ?? 'Скасувати' }}
      </button>
      <button mat-flat-button class="danger" [mat-dialog-close]="true">
        {{ data.confirmText ?? 'Підтвердити' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .details {
      margin: 12px 0 0;
      padding: 8px 12px;
      border-left: 3px solid var(--mat-sys-outline-variant);
      color: var(--mat-sys-on-surface-variant);
      font-style: italic;
      overflow-wrap: anywhere;
    }
  `,
})
export class ConfirmDialog {
  protected readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}
