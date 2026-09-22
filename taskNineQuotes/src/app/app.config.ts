import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { MAT_DIALOG_DEFAULT_OPTIONS, MatDialogConfig } from '@angular/material/dialog';
import { MatPaginatorIntl } from '@angular/material/paginator';

import { mockBackendInterceptor } from './quotes/mock-backend.interceptor';
import { UkPaginatorIntl } from './shared/uk-paginator-intl';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Remove mockBackendInterceptor to talk to a real REST API at /api/quotes.
    provideHttpClient(withInterceptors([mockBackendInterceptor])),
    { provide: MatPaginatorIntl, useClass: UkPaginatorIntl },
    // Spread the stock config: a partial object here would drop Material's own defaults.
    {
      provide: MAT_DIALOG_DEFAULT_OPTIONS,
      useValue: { ...new MatDialogConfig(), panelClass: 'meme-dialog' },
    },
  ],
};
