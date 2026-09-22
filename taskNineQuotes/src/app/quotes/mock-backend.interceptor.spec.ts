import { MockQuoteStore, validatePayload } from './mock-backend.interceptor';

describe('MockQuoteStore', () => {
  const seed = [
    { author: 'Григорій Сковорода', text: 'Світ ловив мене, та не спіймав.' },
    { author: 'Donald Knuth', text: 'Premature optimization is the root of all evil.' },
    { author: 'Тарас Шевченко', text: 'Борітеся - поборете!' },
  ];
  let store: MockQuoteStore;

  beforeEach(() => {
    store = new MockQuoteStore(null, seed);
  });

  it('paginates', () => {
    const page = store.list(1, 2, '');
    expect(page.total).toBe(3);
    expect(page.items.length).toBe(1);
  });

  it('searches by author, case-insensitive and by substring', () => {
    const page = store.list(0, 10, '  сков ');
    expect(page.items.map((q) => q.author)).toEqual(['Григорій Сковорода']);
  });

  it('puts a newly created quote first', () => {
    const created = store.create({ author: ' New ', text: ' Text ' });
    expect(created.author).toBe('New');
    expect(store.list(0, 10, '').items[0].id).toBe(created.id);
  });

  it('updates and deletes', () => {
    const [first] = store.list(0, 1, '').items;
    expect(store.update(first.id, { author: 'A', text: 'B' })?.text).toBe('B');
    expect(store.delete(first.id)).toBe(true);
    expect(store.list(0, 10, '').total).toBe(2);
    expect(store.update('missing', { author: 'A', text: 'B' })).toBeNull();
  });
});

describe('validatePayload', () => {
  it('enforces the entity limits', () => {
    expect(validatePayload({ author: 'a', text: 'b' })).toBeNull();
    expect(validatePayload({ author: '   ', text: 'b' })).not.toBeNull();
    expect(validatePayload({ author: 'a'.repeat(201), text: 'b' })).not.toBeNull();
    expect(validatePayload({ author: 'a', text: 'b'.repeat(1001) })).not.toBeNull();
    expect(validatePayload({ author: 'a'.repeat(200), text: 'b'.repeat(1000) })).toBeNull();
  });
});
