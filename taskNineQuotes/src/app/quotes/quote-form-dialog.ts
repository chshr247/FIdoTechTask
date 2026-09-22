import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable } from 'rxjs';

import { errorMessage } from '../shared/notification.service';
import { QUOTE_LIMITS, Quote, QuotePayload } from './quote.model';
import { QuoteService } from './quote.service';

export interface QuoteFormDialogData {
  /** Quote to edit; omit to create a new one. */
  quote?: Quote;
}

/** Rejects values made only of whitespace (Validators.required lets them through). */
function notBlank(control: AbstractControl<string>): ValidationErrors | null {
  return control.value && !control.value.trim() ? { blank: true } : null;
}

/**
 * Create / edit dialog. Saves through QuoteService itself and closes with the saved
 * Quote, so the dialog stays open (with the error shown) if the request fails.
 */
@Component({
  selector: 'app-quote-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './quote-form-dialog.html',
  styleUrl: './quote-form-dialog.scss',
})
export class QuoteFormDialog {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly quotes = inject(QuoteService);
  private readonly dialogRef = inject<MatDialogRef<QuoteFormDialog, Quote>>(MatDialogRef);
  private readonly data = inject<QuoteFormDialogData>(MAT_DIALOG_DATA, { optional: true });

  protected readonly limits = QUOTE_LIMITS;
  protected readonly original = this.data?.quote;
  protected readonly isEdit = !!this.original;

  protected readonly form = this.fb.group({
    author: [
      this.original?.author ?? '',
      [Validators.required, notBlank, Validators.maxLength(QUOTE_LIMITS.author)],
    ],
    text: [
      this.original?.text ?? '',
      [Validators.required, notBlank, Validators.maxLength(QUOTE_LIMITS.text)],
    ],
  });

  protected readonly saving = signal(false);
  protected readonly serverError = signal<string | null>(null);

  private readonly value = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });
  private readonly status = toSignal(this.form.statusChanges, {
    initialValue: this.form.status,
  });

  protected readonly authorLength = computed(() => this.value().author?.length ?? 0);
  protected readonly textLength = computed(() => this.value().text?.length ?? 0);

  /** In edit mode, saving an unchanged quote makes no sense. */
  private readonly changed = computed(() => {
    if (!this.original) return true;
    const v = this.value();
    return (
      (v.author ?? '').trim() !== this.original.author ||
      (v.text ?? '').trim() !== this.original.text
    );
  });

  protected readonly canSubmit = computed(
    () => this.status() === 'VALID' && !this.saving() && this.changed(),
  );

  protected submit(): void {
    if (!this.canSubmit()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: QuotePayload = { author: raw.author.trim(), text: raw.text.trim() };
    const request$: Observable<Quote> = this.original
      ? this.quotes.update(this.original.id, payload)
      : this.quotes.create(payload);

    this.saving.set(true);
    this.serverError.set(null);
    this.dialogRef.disableClose = true;

    request$.subscribe({
      next: (quote) => this.dialogRef.close(quote),
      error: (err: unknown) => {
        this.saving.set(false);
        this.dialogRef.disableClose = false;
        this.serverError.set(errorMessage(err, 'Не вдалося зберегти цитату'));
      },
    });
  }
}
