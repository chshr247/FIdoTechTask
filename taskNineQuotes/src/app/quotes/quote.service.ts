import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Page, Quote, QuotePayload, QuoteQuery } from './quote.model';

/**
 * REST client for quotes.
 *
 * Talks to `/api/quotes`. While there is no real backend, requests are answered
 * by `mockBackendInterceptor` (see app.config.ts). Pointing the app at a real API
 * only requires removing that interceptor and, if needed, changing `baseUrl`.
 */
@Injectable({ providedIn: 'root' })
export class QuoteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/quotes';

  list(query: QuoteQuery): Observable<Page<Quote>> {
    let params = new HttpParams().set('page', query.page).set('size', query.size);
    const author = query.author.trim();
    if (author) {
      params = params.set('author', author);
    }
    return this.http.get<Page<Quote>>(this.baseUrl, { params });
  }

  create(payload: QuotePayload): Observable<Quote> {
    return this.http.post<Quote>(this.baseUrl, payload);
  }

  update(id: string, payload: QuotePayload): Observable<Quote> {
    return this.http.put<Quote>(`${this.baseUrl}/${encodeURIComponent(id)}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${encodeURIComponent(id)}`);
  }
}
