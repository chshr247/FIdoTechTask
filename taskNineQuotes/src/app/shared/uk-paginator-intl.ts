import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';

/** Ukrainian labels for mat-paginator. */
@Injectable()
export class UkPaginatorIntl extends MatPaginatorIntl {
  override itemsPerPageLabel = 'На сторінці:';
  override nextPageLabel = 'Наступна сторінка';
  override previousPageLabel = 'Попередня сторінка';
  override firstPageLabel = 'Перша сторінка';
  override lastPageLabel = 'Остання сторінка';

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0) return '0 з 0';
    const start = page * pageSize + 1;
    const end = Math.min(start + pageSize - 1, length);
    return `${start}-${end} з ${length}`;
  };
}
