import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, catchError, debounceTime, distinctUntilChanged, filter, map, of, switchMap, tap } from 'rxjs';

import { ConfirmDialog, ConfirmDialogData } from '../shared/confirm-dialog';
import { NotificationService, errorMessage } from '../shared/notification.service';
import { Page, Quote } from './quote.model';
import { QuoteFormDialog, QuoteFormDialogData } from './quote-form-dialog';
import { QuoteService } from './quote.service';

const EMPTY_PAGE: Page<Quote> = { items: [], total: 0, page: 0, size: 0 };

@Component({
  selector: 'app-quote-list',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './quote-list.html',
  styleUrl: './quote-list.scss',
})
export class QuoteList {
  private readonly quotes = inject(QuoteService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly pageSizeOptions = [5, 10, 20];

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly search = signal('');
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);

  protected readonly page = signal<Page<Quote>>(EMPTY_PAGE);
  protected readonly loading = signal(false);
  protected readonly loadError = signal<string | null>(null);
  /** Quote to briefly highlight after it was created or edited. */
  protected readonly highlightId = signal<string | null>(null);

  private readonly reload$ = new Subject<void>();
  private highlightTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    // switchMap drops responses of outdated requests (fast typing, quick paging).
    this.reload$
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.loadError.set(null);
        }),
        switchMap(() =>
          this.quotes
            .list({ page: this.pageIndex(), size: this.pageSize(), author: this.search() })
            .pipe(
              catchError((err: unknown) => {
                this.loadError.set(errorMessage(err, 'Не вдалося завантажити цитати'));
                return of(null);
              }),
            ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        this.loading.set(false);
        if (!result) return;

        // Page became empty (e.g. last quote on it was deleted): step back to the last page.
        if (result.items.length === 0 && result.page > 0 && result.total > 0) {
          this.pageIndex.set(Math.ceil(result.total / result.size) - 1);
          this.reload();
          return;
        }
        this.page.set(result);
      });

    this.searchControl.valueChanges
      .pipe(
        map((value) => value.trim()),
        debounceTime(300),
        distinctUntilChanged(),
        filter((value) => value !== this.search()),
        takeUntilDestroyed(),
      )
      .subscribe((value) => {
        this.search.set(value);
        this.pageIndex.set(0);
        this.reload();
      });

    this.destroyRef.onDestroy(() => clearTimeout(this.highlightTimer));
    this.reload();
  }

  protected reload(): void {
    this.reload$.next();
  }

  protected onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.reload();
  }

  protected clearSearch(): void {
    this.searchControl.setValue('', { emitEvent: false });
    if (this.search() !== '') {
      this.search.set('');
      this.pageIndex.set(0);
      this.reload();
    }
  }

  protected openCreate(): void {
    this.openForm({}).subscribe((created) => {
      this.notify.success('Цитату додано');
      // Newest quotes come first: show page 1 without a filter that could hide the new one.
      this.searchControl.setValue('', { emitEvent: false });
      this.search.set('');
      this.pageIndex.set(0);
      this.highlight(created.id);
      this.reload();
    });
  }

  protected openEdit(quote: Quote): void {
    this.openForm({ quote }).subscribe((updated) => {
      this.notify.success('Зміни збережено');
      // Swap the card in place instead of refetching: a refetch would hide the quote
      // if its new author no longer matches the active search.
      this.page.update((p) => ({
        ...p,
        items: p.items.map((q) => (q.id === updated.id ? updated : q)),
      }));
      this.highlight(updated.id);
    });
  }

  protected confirmDelete(quote: Quote): void {
    const data: ConfirmDialogData = {
      title: 'Видалити цитату?',
      message: `Цитату автора «${quote.author}» буде видалено без можливості відновлення.`,
      details: quote.text.length > 200 ? `${quote.text.slice(0, 200)}...` : quote.text,
      confirmText: 'Видалити',
    };

    this.dialog
      .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, { data, width: '440px' })
      .afterClosed()
      .pipe(
        filter((confirmed) => confirmed === true),
        switchMap(() => this.quotes.delete(quote.id)),
      )
      .subscribe({
        next: () => {
          this.notify.success('Цитату видалено');
          this.reload();
        },
        error: (err: unknown) => {
          this.notify.error(errorMessage(err, 'Не вдалося видалити цитату'));
          this.reload();
        },
      });
  }

  private openForm(data: QuoteFormDialogData) {
    return this.dialog
      .open<QuoteFormDialog, QuoteFormDialogData, Quote>(QuoteFormDialog, {
        data,
        width: '600px',
        maxWidth: '95vw',
        autoFocus: 'first-tabbable',
      })
      .afterClosed()
      .pipe(filter((quote): quote is Quote => !!quote));
  }

  private highlight(id: string): void {
    clearTimeout(this.highlightTimer);
    this.highlightId.set(id);
    this.highlightTimer = setTimeout(() => this.highlightId.set(null), 2500);
  }
}
