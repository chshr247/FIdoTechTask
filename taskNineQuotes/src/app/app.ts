import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';

import { QuoteList } from './quotes/quote-list';

const THEME_KEY = 'quotes-app.theme';

@Component({
  selector: 'app-root',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, QuoteList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly document = inject(DOCUMENT);

  protected readonly dark = signal(this.initialDark());

  constructor() {
    // Material and our own tokens use light-dark(), which follows color-scheme on <html>.
    effect(() => {
      const scheme = this.dark() ? 'dark' : 'light';
      this.document.documentElement.style.colorScheme = scheme;
      try {
        localStorage.setItem(THEME_KEY, scheme);
      } catch {
        // Storage blocked: the choice just won't survive a reload.
      }
    });
  }

  protected toggleTheme(): void {
    this.dark.update((d) => !d);
  }

  private initialDark(): boolean {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved) return saved === 'dark';
    } catch {
      // Fall through to the system preference.
    }
    return this.document.defaultView?.matchMedia('(prefers-color-scheme: dark)').matches ?? false;
  }
}
