import { FormBuilder } from '@angular/forms';
import { singleSideValidator, balancedEntryValidator } from './operation-form.service';

const fb = new FormBuilder();

// ─── singleSideValidator ──────────────────────────────────────────────────────

describe('singleSideValidator', () => {
  function makeLineGroup(debit: number, credit: number) {
    return fb.group({ accountId: [1], debit: [debit], credit: [credit] });
  }

  it('retourne null si seul le débit est renseigné', () => {
    expect(singleSideValidator(makeLineGroup(500, 0))).toBeNull();
  });

  it('retourne null si seul le crédit est renseigné', () => {
    expect(singleSideValidator(makeLineGroup(0, 500))).toBeNull();
  });

  it('retourne { bothSides: true } si débit et crédit sont tous deux non nuls', () => {
    expect(singleSideValidator(makeLineGroup(100, 200))).toEqual({ bothSides: true });
  });

  it('retourne { emptySide: true } si débit et crédit sont tous deux à zéro', () => {
    expect(singleSideValidator(makeLineGroup(0, 0))).toEqual({ emptySide: true });
  });

  it('traite les chaînes numériques comme des nombres', () => {
    const group = fb.group({ accountId: [1], debit: ['150'], credit: ['0'] });
    expect(singleSideValidator(group)).toBeNull();
  });
});

// ─── balancedEntryValidator ───────────────────────────────────────────────────

describe('balancedEntryValidator', () => {
  function makeEntryGroup(lines: { debit: number; credit: number }[]) {
    const lineGroups = lines.map((l) =>
      fb.group({ accountId: [1], debit: [l.debit], credit: [l.credit] }),
    );
    return fb.group(
      {
        date:  ['2025-01-01'],
        label: ['Test'],
        lines: fb.array(lineGroups),
      },
      { validators: balancedEntryValidator },
    );
  }

  it('retourne null pour une écriture équilibrée', () => {
    const group = makeEntryGroup([
      { debit: 1000, credit: 0 },
      { debit: 0,    credit: 1000 },
    ]);
    expect(balancedEntryValidator(group)).toBeNull();
  });

  it('retourne { unbalanced } si l\'écriture n\'est pas équilibrée', () => {
    const group = makeEntryGroup([
      { debit: 1000, credit: 0 },
      { debit: 0,    credit: 900 },
    ]);
    const errors = balancedEntryValidator(group);
    expect(errors).toEqual({ unbalanced: { totalDebit: 1000, totalCredit: 900 } });
  });

  it('retourne { minLines: true } si moins de 2 lignes', () => {
    const group = makeEntryGroup([{ debit: 500, credit: 0 }]);
    expect(balancedEntryValidator(group)).toEqual({ minLines: true });
  });

  it('gère les écritures multi-lignes équilibrées', () => {
    const group = makeEntryGroup([
      { debit: 500, credit: 0 },
      { debit: 300, credit: 0 },
      { debit: 0,   credit: 800 },
    ]);
    expect(balancedEntryValidator(group)).toBeNull();
  });
});
