import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';

import { QuoteFormDialog } from './quote-form-dialog';
import { QuoteService } from './quote.service';

describe('QuoteFormDialog', () => {
  function setup(data: object = {}) {
    TestBed.configureTestingModule({
      imports: [QuoteFormDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close: () => {}, disableClose: false } },
        { provide: QuoteService, useValue: { create: () => of({}), update: () => of({}) } },
      ],
    });
    const fixture = TestBed.createComponent(QuoteFormDialog);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const submit = () => el.querySelector<HTMLButtonElement>('button[type=submit]')!;
    const type = async (selector: string, value: string) => {
      const input = el.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
      await fixture.whenStable();
    };
    return { fixture, submit, type };
  }

  it('enables submit only for valid input', async () => {
    const { submit, type } = setup();
    expect(submit().disabled).toBe(true);

    await type('input', 'Author');
    await type('textarea', '   ');
    expect(submit().disabled).toBe(true);

    await type('textarea', 'x'.repeat(1001));
    expect(submit().disabled).toBe(true);

    await type('textarea', 'Some quote');
    expect(submit().disabled).toBe(false);
  });

  it('keeps submit disabled while an edited quote is unchanged', async () => {
    const quote = { id: '1', author: 'A', text: 'B', createdAt: '', updatedAt: '' };
    const { submit, type } = setup({ quote });
    expect(submit().disabled).toBe(true);
    await type('textarea', 'B2');
    expect(submit().disabled).toBe(false);
  });
});
