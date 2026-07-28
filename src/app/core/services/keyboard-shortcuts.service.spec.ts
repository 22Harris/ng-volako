import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { KeyboardShortcutsService } from './keyboard-shortcuts.service';

function makeKeyEvent(key: string, opts: Partial<KeyboardEventInit> = {}): KeyboardEvent {
  return new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...opts });
}

describe('KeyboardShortcutsService', () => {
  let svc: KeyboardShortcutsService;
  const navigateFn = vi.fn();

  beforeEach(() => {
    navigateFn.mockReset();

    TestBed.configureTestingModule({
      providers: [
        KeyboardShortcutsService,
        { provide: Router, useValue: { navigate: navigateFn } },
      ],
    });

    svc = TestBed.inject(KeyboardShortcutsService);
  });

  // ── Help toggle ────────────────────────────────────────────────────────────

  it('toggles helpVisible on ?', () => {
    expect(svc.helpVisible()).toBe(false);
    svc.handleKeyDown(makeKeyEvent('?'));
    expect(svc.helpVisible()).toBe(true);
    svc.handleKeyDown(makeKeyEvent('?'));
    expect(svc.helpVisible()).toBe(false);
  });

  it('closes helpVisible on Escape', () => {
    svc.helpVisible.set(true);
    svc.handleKeyDown(makeKeyEvent('Escape'));
    expect(svc.helpVisible()).toBe(false);
  });

  it('Escape works even when target is an input', () => {
    svc.helpVisible.set(true);
    const event = makeKeyEvent('Escape');
    const input = document.createElement('input');
    Object.defineProperty(event, 'target', { value: input });
    svc.handleKeyDown(event);
    expect(svc.helpVisible()).toBe(false);
  });

  it('does not toggle help when Ctrl+? is pressed', () => {
    svc.handleKeyDown(makeKeyEvent('?', { ctrlKey: true }));
    expect(svc.helpVisible()).toBe(false);
  });

  // ── focusSearch$ ───────────────────────────────────────────────────────────

  it('emits focusSearch$ on Ctrl+K and prevents default', () => {
    let emitted = false;
    svc.focusSearch$.subscribe(() => { emitted = true; });
    const event = makeKeyEvent('k', { ctrlKey: true });
    svc.handleKeyDown(event);
    expect(emitted).toBe(true);
    expect(event.defaultPrevented).toBe(true);
  });

  it('emits focusSearch$ on Cmd+K (Mac)', () => {
    let emitted = false;
    svc.focusSearch$.subscribe(() => { emitted = true; });
    svc.handleKeyDown(makeKeyEvent('k', { metaKey: true }));
    expect(emitted).toBe(true);
  });

  it('does not emit focusSearch$ for plain K', () => {
    let emitted = false;
    svc.focusSearch$.subscribe(() => { emitted = true; });
    svc.handleKeyDown(makeKeyEvent('k'));
    expect(emitted).toBe(false);
  });

  // ── G-chord navigation ─────────────────────────────────────────────────────

  it('navigates to /dashboard on G then D', () => {
    svc.handleKeyDown(makeKeyEvent('g'));
    svc.handleKeyDown(makeKeyEvent('d'));
    expect(navigateFn).toHaveBeenCalledWith(['/dashboard']);
  });

  it('navigates to /factures on G then F', () => {
    svc.handleKeyDown(makeKeyEvent('g'));
    svc.handleKeyDown(makeKeyEvent('f'));
    expect(navigateFn).toHaveBeenCalledWith(['/factures']);
  });

  it('navigates to /tva on G then V', () => {
    svc.handleKeyDown(makeKeyEvent('g'));
    svc.handleKeyDown(makeKeyEvent('v'));
    expect(navigateFn).toHaveBeenCalledWith(['/tva']);
  });

  it('does not navigate for unknown chord key (G then X)', () => {
    svc.handleKeyDown(makeKeyEvent('g'));
    svc.handleKeyDown(makeKeyEvent('x'));
    expect(navigateFn).not.toHaveBeenCalled();
  });

  it('G-chord is case-insensitive (uppercase G)', () => {
    svc.handleKeyDown(makeKeyEvent('G'));
    svc.handleKeyDown(makeKeyEvent('j'));
    expect(navigateFn).toHaveBeenCalledWith(['/journal']);
  });

  it('G-chord expires after 800 ms', () => {
    vi.useFakeTimers();
    try {
      svc.handleKeyDown(makeKeyEvent('g'));
      vi.advanceTimersByTime(801);
      svc.handleKeyDown(makeKeyEvent('d'));
      expect(navigateFn).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  // ── Editable target blocks shortcuts ──────────────────────────────────────

  it('ignores ? shortcut when target is an input', () => {
    const event = makeKeyEvent('?');
    Object.defineProperty(event, 'target', { value: document.createElement('input') });
    svc.handleKeyDown(event);
    expect(svc.helpVisible()).toBe(false);
  });

  it('ignores G-chord when target is a textarea', () => {
    const gEvent = makeKeyEvent('g');
    Object.defineProperty(gEvent, 'target', { value: document.createElement('textarea') });
    svc.handleKeyDown(gEvent);
    svc.handleKeyDown(makeKeyEvent('d'));
    expect(navigateFn).not.toHaveBeenCalled();
  });

  // ── shortcuts list ─────────────────────────────────────────────────────────

  it('exposes 13 shortcuts', () => {
    expect(svc.shortcuts.length).toBe(13);
  });

  it('all shortcuts have keys, description, and category', () => {
    for (const s of svc.shortcuts) {
      expect(s.keys).toBeTruthy();
      expect(s.description).toBeTruthy();
      expect(s.category).toBeTruthy();
    }
  });
});
