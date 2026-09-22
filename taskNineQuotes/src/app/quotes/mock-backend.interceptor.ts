import {
  HttpErrorResponse,
  HttpEvent,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, delay, dematerialize, materialize, of, throwError } from 'rxjs';

import { Page, QUOTE_LIMITS, Quote, QuotePayload } from './quote.model';

/**
 * In-memory stand-in for the quotes REST API, so the frontend runs without a server.
 *
 *   GET    /api/quotes?page=0&size=10&author=...   -> Page<Quote>
 *   POST   /api/quotes                             -> Quote (201)
 *   PUT    /api/quotes/:id                         -> Quote
 *   DELETE /api/quotes/:id                         -> 204
 *
 * Data is kept in localStorage (when available), so it survives a page reload.
 * Remove the interceptor from app.config.ts to use a real backend.
 */

const API_PREFIX = '/api/quotes';
const STORAGE_KEY = 'quotes-app.mock-db.v2';
const LATENCY_MS = 350;

export class MockQuoteStore {
  private quotes: Quote[];

  constructor(
    private readonly storage: Storage | null = safeLocalStorage(),
    seed: QuotePayload[] = SEED_QUOTES,
  ) {
    this.quotes = this.load() ?? this.seedFrom(seed);
  }

  list(page: number, size: number, author: string): Page<Quote> {
    const needle = author.trim().toLocaleLowerCase();
    const filtered = this.sorted().filter(
      (q) => !needle || q.author.toLocaleLowerCase().includes(needle),
    );
    const start = page * size;
    return {
      items: filtered.slice(start, start + size),
      total: filtered.length,
      page,
      size,
    };
  }

  create(payload: QuotePayload): Quote {
    const now = new Date().toISOString();
    const quote: Quote = { id: newId(), ...clean(payload), createdAt: now, updatedAt: now };
    this.quotes.push(quote);
    this.save();
    return quote;
  }

  update(id: string, payload: QuotePayload): Quote | null {
    const index = this.quotes.findIndex((q) => q.id === id);
    if (index === -1) return null;
    const updated: Quote = {
      ...this.quotes[index],
      ...clean(payload),
      updatedAt: new Date().toISOString(),
    };
    this.quotes[index] = updated;
    this.save();
    return updated;
  }

  delete(id: string): boolean {
    const before = this.quotes.length;
    this.quotes = this.quotes.filter((q) => q.id !== id);
    this.save();
    return this.quotes.length !== before;
  }

  /** Newest first, so a freshly created quote appears at the top of page 1. */
  private sorted(): Quote[] {
    return [...this.quotes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  private seedFrom(seed: QuotePayload[]): Quote[] {
    // Spread creation times out so the seed has a stable order.
    const base = Date.now() - seed.length * 60_000;
    return seed.map((payload, i) => {
      const at = new Date(base + i * 60_000).toISOString();
      return { id: newId(), ...payload, createdAt: at, updatedAt: at };
    });
  }

  private load(): Quote[] | null {
    try {
      const raw = this.storage?.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Quote[]) : null;
    } catch {
      return null;
    }
  }

  private save(): void {
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.quotes));
    } catch {
      // Storage full or unavailable: keep working in memory only.
    }
  }
}

/** Server-side validation, mirroring the rules of the form. */
export function validatePayload(body: unknown): string | null {
  const p = body as Partial<QuotePayload> | null;
  if (!p || typeof p.author !== 'string' || typeof p.text !== 'string') {
    return 'Поля author і text обов\'язкові';
  }
  const author = p.author.trim();
  const text = p.text.trim();
  if (!author) return 'Автор не може бути порожнім';
  if (!text) return 'Текст не може бути порожнім';
  if (author.length > QUOTE_LIMITS.author) {
    return `Автор: максимум ${QUOTE_LIMITS.author} символів`;
  }
  if (text.length > QUOTE_LIMITS.text) {
    return `Текст: максимум ${QUOTE_LIMITS.text} символів`;
  }
  return null;
}

let store: MockQuoteStore | null = null;

export const mockBackendInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(API_PREFIX)) {
    return next(req);
  }
  store ??= new MockQuoteStore();
  // materialize/dematerialize lets errors be delayed like successful responses.
  return handle(req, store).pipe(materialize(), delay(LATENCY_MS), dematerialize());
};

function handle(req: HttpRequest<unknown>, db: MockQuoteStore): Observable<HttpEvent<unknown>> {
  const id = decodeURIComponent(req.url.slice(API_PREFIX.length).replace(/^\//, ''));

  if (!id && req.method === 'GET') {
    const page = Math.max(0, Number(req.params.get('page') ?? 0) || 0);
    const size = Math.min(100, Math.max(1, Number(req.params.get('size') ?? 10) || 10));
    return ok(db.list(page, size, req.params.get('author') ?? ''));
  }

  if (!id && req.method === 'POST') {
    const error = validatePayload(req.body);
    if (error) return fail(req, 400, error);
    return ok(db.create(req.body as QuotePayload), 201);
  }

  if (id && req.method === 'PUT') {
    const error = validatePayload(req.body);
    if (error) return fail(req, 400, error);
    const updated = db.update(id, req.body as QuotePayload);
    return updated ? ok(updated) : fail(req, 404, 'Цитату не знайдено');
  }

  if (id && req.method === 'DELETE') {
    return db.delete(id) ? ok(null, 204) : fail(req, 404, 'Цитату не знайдено');
  }

  return fail(req, 405, 'Метод не підтримується');
}

function ok<T>(body: T, status = 200): Observable<HttpEvent<T>> {
  return of(new HttpResponse({ status, body }));
}

function fail(req: HttpRequest<unknown>, status: number, message: string): Observable<never> {
  return throwError(
    () => new HttpErrorResponse({ status, url: req.url, error: { message } }),
  );
}

function clean(payload: QuotePayload): QuotePayload {
  return { author: payload.author.trim(), text: payload.text.trim() };
}

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function safeLocalStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

const SEED_QUOTES: QuotePayload[] = [
  { author: 'Смиш О. Р.', text: 'Ви переживаєте за мої об’єми?' },
  {
    author: 'Глибовець А. М.',
    text: 'В лісі є розумна тварина - сова, знає відповіді на всі запитання. Миші приходять до сови, кажуть: сова, ти ж розумна, а нас всі полюють, вбивають. Що нам робити? - Станьте їжаками, їжаки коляться і на них менше нападають.',
  },
  { author: 'Макарець А. О.', text: 'Це не ганчірка, а моя майка.' },
  { author: 'Кирієнко О. В.', text: 'Забудьте все, що ви знали до цього.' },
  {
    author: 'Курочкін А. В.',
    text: 'Людина краще рахує площу прямокутника, ніж шматка піци. Це дослідження.',
  },
  {
    author: 'Проценко В. С.',
    text: 'А от потім скажете, що викладач вам навішав лапши на уші. Да, навішав.',
  },
  {
    author: 'Смиш О. Р.',
    text: 'Без 100 грам не скажу, що це скрапбукінг, тому наливайте 100 грам.',
  },
  { author: 'Кирієнко О. В.', text: 'Ви отримали лист і плачете від щастя.' },
];
