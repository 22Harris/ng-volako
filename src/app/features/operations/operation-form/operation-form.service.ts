import { Injectable, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl, ValidationErrors } from '@angular/forms';

export function singleSideValidator(group: AbstractControl): ValidationErrors | null {
  const debit  = +group.get('debit')?.value  || 0;
  const credit = +group.get('credit')?.value || 0;
  if (debit > 0 && credit > 0) return { bothSides: true };
  if (debit === 0 && credit === 0) return { emptySide: true };
  return null;
}

export function balancedEntryValidator(group: AbstractControl): ValidationErrors | null {
  const lines       = (group.get('lines') as FormArray).controls;
  const totalDebit  = lines.reduce((s, l) => s + (+l.get('debit')?.value  || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (+l.get('credit')?.value || 0), 0);
  if (lines.length < 2) return { minLines: true };
  return totalDebit === totalCredit ? null : { unbalanced: { totalDebit, totalCredit } };
}

@Injectable()
export class OperationFormService {
  private fb = inject(FormBuilder);

  buildOperationForm(): FormGroup {
    return this.fb.group({
      type:    ['', Validators.required],
      date:    ['', Validators.required],
      label:   ['', Validators.required],
      entries: this.fb.array([this.buildEntryGroup()], { validators: Validators.required }),
    });
  }

  buildEntryGroup(): FormGroup {
    return this.fb.group({
      date:  ['', Validators.required],
      label: ['', Validators.required],
      lines: this.fb.array([this.buildLineGroup(), this.buildLineGroup()]),
    }, { validators: balancedEntryValidator });
  }

  buildLineGroup(): FormGroup {
    return this.fb.group({
      accountId: [null, Validators.required],
      debit:     [0],
      credit:    [0],
    }, { validators: singleSideValidator });
  }

  getEntries(form: FormGroup): FormArray {
    return form.get('entries') as FormArray;
  }

  getLines(entryGroup: FormGroup): FormArray {
    return entryGroup.get('lines') as FormArray;
  }

  getEntryDebit(entryGroup: FormGroup): number {
    return this.getLines(entryGroup).controls.reduce((s, l) => s + (+l.get('debit')?.value || 0), 0);
  }

  getEntryCredit(entryGroup: FormGroup): number {
    return this.getLines(entryGroup).controls.reduce((s, l) => s + (+l.get('credit')?.value || 0), 0);
  }
}
