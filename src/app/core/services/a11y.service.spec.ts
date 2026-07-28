import { TestBed } from '@angular/core/testing';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { DOCUMENT } from '@angular/common';
import { A11yService } from './a11y.service';

function makeAnnouncer() {
  return {
    announce: vi.fn().mockResolvedValue(undefined),
    clear:    vi.fn(),
  };
}

function makeService(announcerMock = makeAnnouncer(), doc: Document = document): A11yService {
  TestBed.configureTestingModule({
    providers: [
      A11yService,
      { provide: LiveAnnouncer, useValue: announcerMock },
      { provide: DOCUMENT,      useValue: doc },
    ],
  });
  return TestBed.inject(A11yService);
}

afterEach(() => TestBed.resetTestingModule());

// ── announce ──────────────────────────────────────────────────────────────────

describe('A11yService.announce()', () => {
  it('calls LiveAnnouncer with polite by default', async () => {
    const spy = makeAnnouncer();
    await makeService(spy).announce('Test message');
    expect(spy.announce).toHaveBeenCalledWith('Test message', 'polite');
  });

  it('forwards assertive politeness', async () => {
    const spy = makeAnnouncer();
    await makeService(spy).announce('Urgent!', 'assertive');
    expect(spy.announce).toHaveBeenCalledWith('Urgent!', 'assertive');
  });
});

// ── announceSuccess / announceError / announceNavigation ──────────────────────

describe('A11yService convenience helpers', () => {
  it('announceSuccess() uses polite', async () => {
    const spy = makeAnnouncer();
    await makeService(spy).announceSuccess('Enregistrement réussi');
    expect(spy.announce).toHaveBeenCalledWith('Enregistrement réussi', 'polite');
  });

  it('announceError() uses assertive', async () => {
    const spy = makeAnnouncer();
    await makeService(spy).announceError('Erreur de connexion');
    expect(spy.announce).toHaveBeenCalledWith('Erreur de connexion', 'assertive');
  });

  it('announceNavigation() prefixes with "Navigation vers"', async () => {
    const spy = makeAnnouncer();
    await makeService(spy).announceNavigation('Dashboard');
    expect(spy.announce).toHaveBeenCalledWith('Navigation vers Dashboard', 'polite');
  });

  it('announceNavigation() uses polite politeness', async () => {
    const spy = makeAnnouncer();
    await makeService(spy).announceNavigation('Comptes');
    const call = spy.announce.mock.calls[0] as [string, string];
    expect(call[1]).toBe('polite');
  });

  it('announceCount() formats "N label"', async () => {
    const spy = makeAnnouncer();
    await makeService(spy).announceCount(5, 'résultats trouvés');
    expect(spy.announce).toHaveBeenCalledWith('5 résultats trouvés', 'polite');
  });

  it('announceCount() with zero', async () => {
    const spy = makeAnnouncer();
    await makeService(spy).announceCount(0, 'résultats');
    expect(spy.announce).toHaveBeenCalledWith('0 résultats', 'polite');
  });

  it('clearAnnouncement() delegates to LiveAnnouncer.clear()', () => {
    const spy = makeAnnouncer();
    makeService(spy).clearAnnouncement();
    expect(spy.clear).toHaveBeenCalled();
  });
});

// ── moveFocus ─────────────────────────────────────────────────────────────────

describe('A11yService.moveFocus()', () => {
  let btn: HTMLButtonElement;

  beforeEach(() => {
    btn = document.createElement('button');
    btn.id = 'a11y-test-btn';
    btn.tabIndex = 0;
    document.body.appendChild(btn);
  });

  afterEach(() => {
    document.body.removeChild(btn);
  });

  it('returns true and focuses the matching element', () => {
    const focusSpy = vi.spyOn(btn, 'focus');
    const result   = makeService().moveFocus('#a11y-test-btn');
    expect(result).toBe(true);
    expect(focusSpy).toHaveBeenCalled();
  });

  it('returns false when selector matches nothing', () => {
    const result = makeService().moveFocus('#absolutely-nonexistent-xyz-987');
    expect(result).toBe(false);
  });

  it('returns true for selector matching a div', () => {
    const div = document.createElement('div');
    div.id = 'a11y-main-content';
    div.tabIndex = -1;
    document.body.appendChild(div);
    const focusSpy = vi.spyOn(div, 'focus');

    const result = makeService().moveFocus('#a11y-main-content');
    expect(result).toBe(true);
    expect(focusSpy).toHaveBeenCalled();

    document.body.removeChild(div);
  });

  it('returns false for empty selector string', () => {
    expect(makeService().moveFocus('')).toBe(false);
  });

  it('does not throw for a selector with no match', () => {
    expect(() => makeService().moveFocus('.no-such-class')).not.toThrow();
  });
});

// ── integration: announce then clear ─────────────────────────────────────────

describe('A11yService announce + clear', () => {
  it('can call announce then clear without error', async () => {
    const spy = makeAnnouncer();
    const svc = makeService(spy);
    await svc.announce('Message initial');
    svc.clearAnnouncement();
    expect(spy.clear).toHaveBeenCalled();
  });
});
