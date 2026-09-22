export interface Quote {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

/** Fields the user can create or edit. */
export type QuotePayload = Pick<Quote, 'author' | 'text'>;

export interface QuoteQuery {
  /** Zero-based page index. */
  page: number;
  size: number;
  /** Free-text search by author; empty string means no filter. */
  author: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export const QUOTE_LIMITS = {
  author: 200,
  text: 1000,
} as const;
