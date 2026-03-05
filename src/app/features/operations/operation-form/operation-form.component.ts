import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { AppDateInputComponent } from '../../../shared/components/date-input/date-input.component';
import { OperationService } from '../../../core/services/operation.service';
import { AlertService } from '../../../shared/components/alert/alert.service';
import { Operation, OperationType } from '../../../core/models/operation.model';
import { OPERATION_TYPES_BY_CATEGORY, CATEGORY_LABELS, OperationCategory, OPERATION_TYPE_CONFIG } from '../../../core/utils/operation-type.utils';

@Component({
  selector: 'app-operation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, AppDateInputComponent],
  template: `
    <div class="dlg">

      <!-- ── Header ── -->
      <div class="dlg-header">
        <div class="dlg-icon">
          <mat-icon>{{ data.operation ? 'edit' : 'add_circle' }}</mat-icon>
        </div>
        <div class="dlg-titles">
          <div class="dlg-title">{{ data.operation ? "Modifier l'opération" : 'Nouvelle opération' }}</div>
          <div class="dlg-sub">
            {{ data.operation ? data.operation.label : "Renseigner les informations de l'opération" }}
          </div>
        </div>
        <button class="dlg-close" type="button" (click)="cancel()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- ── Body ── -->
      <div class="dlg-body">
        <form [formGroup]="form" (ngSubmit)="submit()" id="op-form">

          <!-- Type -->
          <div class="field-group">
            <label class="field-label">Type d'opération <span class="req">*</span></label>
            <div class="field-wrap" [class.has-error]="typeCtrl.invalid && typeCtrl.touched">
              <mat-icon class="fi">category</mat-icon>
              <select class="fi-select" formControlName="type" (change)="onTypeChange()">
                <option value="">Sélectionner un type…</option>
                @for (category of categories; track category) {
                  <optgroup [label]="categoryLabels[category]">
                    @for (type of typesByCategory[category]; track type) {
                      <option [value]="type">{{ typeConfig[type].label }}</option>
                    }
                  </optgroup>
                }
              </select>
            </div>
            @if (typeCtrl.touched && typeCtrl.hasError('required')) {
              <span class="field-err">Le type est requis</span>
            }
          </div>

          <!-- Date -->
          <div class="field-group">
            <label class="field-label">Date <span class="req">*</span></label>
            <div class="field-wrap" [class.has-error]="dateCtrl.invalid && dateCtrl.touched">
              <mat-icon class="fi">calendar_today</mat-icon>
              <app-date-input formControlName="date"></app-date-input>
            </div>
            @if (dateCtrl.touched && dateCtrl.hasError('required')) {
              <span class="field-err">La date est requise</span>
            }
          </div>

          <!-- Libellé -->
          <div class="field-group">
            <label class="field-label">Libellé <span class="req">*</span></label>
            <div class="field-wrap" [class.has-error]="labelCtrl.invalid && labelCtrl.touched">
              <mat-icon class="fi">label_outline</mat-icon>
              <input class="fi-input" formControlName="label" type="text"
                placeholder="ex: Facture fournisseur" autocomplete="off" />
            </div>
            @if (labelCtrl.touched && labelCtrl.hasError('required')) {
              <span class="field-err">Le libellé est requis</span>
            }
          </div>

          <!-- Montant -->
          <div class="field-group">
            <label class="field-label">Montant (Ar) <span class="req">*</span></label>
            <div class="field-wrap" [class.has-error]="amountCtrl.invalid && amountCtrl.touched">
              <mat-icon class="fi">payments</mat-icon>
              <input class="fi-input" formControlName="amount" type="number"
                min="0.01" step="0.01" placeholder="0.00" />
            </div>
            @if (amountCtrl.touched && amountCtrl.hasError('required')) {
              <span class="field-err">Le montant est requis</span>
            } @else if (amountCtrl.touched && amountCtrl.hasError('min')) {
              <span class="field-err">Le montant doit être supérieur à 0</span>
            }
          </div>

        </form>
      </div>

      <!-- ── Footer ── -->
      <div class="dlg-footer">
        <button class="btn-cancel" type="button" (click)="cancel()">Annuler</button>
        <button class="btn-save" type="submit" form="op-form"
          [disabled]="form.invalid || saving()">
          @if (saving()) {
            <span class="btn-spin"></span>
          } @else {
            <mat-icon>check</mat-icon>
          }
          Enregistrer
        </button>
      </div>

    </div>
  `,
  styles: [`
    .dlg {
      display: flex; flex-direction: column;
      width: 480px; max-width: 95vw;
      background: white;
    }

    /* ── Header ── */
    .dlg-header {
      display: flex; align-items: center; gap: 14px;
      padding: 20px 24px 16px;
      border-bottom: 1px solid #f0f4f8;
    }
    .dlg-icon {
      width: 46px; height: 46px; border-radius: 13px; flex-shrink: 0;
      background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
      display: flex; align-items: center; justify-content: center;
      color: white; box-shadow: 0 4px 12px rgba(21,101,192,.35);
      mat-icon { font-size: 22px; width: 22px; height: 22px; }
    }
    .dlg-titles { flex: 1; min-width: 0; }
    .dlg-title { font-size: 16px; font-weight: 800; color: #0d1b2a; }
    .dlg-sub   { font-size: 12px; color: #90a4ae; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .dlg-close {
      flex-shrink: 0; width: 32px; height: 32px; border-radius: 8px;
      border: 1.5px solid #e8edf2; background: white; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #90a4ae; transition: border-color .15s, color .15s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover { border-color: #cfd8dc; color: #546e7a; }
    }

    /* ── Body ── */
    .dlg-body {
      padding: 22px 24px; display: flex; flex-direction: column; gap: 20px;
    }

    form { display: flex; flex-direction: column; gap: 18px; }

    .field-group { display: flex; flex-direction: column; gap: 6px; }
    .field-label {
      font-size: 11px; font-weight: 700; color: #475569;
      text-transform: uppercase; letter-spacing: .5px;
    }
    .req { color: #ef5350; }

    .field-wrap {
      display: flex; align-items: center; gap: 8px;
      height: 44px; padding: 0 12px;
      border: 1.5px solid #e2e8f0; border-radius: 10px; background: #f8fafc;
      transition: border-color .15s, background .15s;
      &:focus-within { border-color: #90caf9; background: white; box-shadow: 0 0 0 3px rgba(144,202,249,.15); }
      &.has-error { border-color: #ef9a9a; background: #fff5f5; }
    }
    .fi { font-size: 16px; width: 16px; height: 16px; color: #94a3b8; flex-shrink: 0; }
    .fi-input {
      flex: 1; border: none; background: transparent; outline: none;
      font-size: 14px; color: #0d1b2a; min-width: 0;
      &::placeholder { color: #b0bec5; }
    }
    .fi-select {
      flex: 1; border: none; background: transparent; outline: none;
      font-size: 14px; color: #0d1b2a; min-width: 0; cursor: pointer;
    }

    .field-err { font-size: 12px; color: #c62828; }

    /* ── Footer ── */
    .dlg-footer {
      display: flex; justify-content: flex-end; gap: 10px;
      padding: 14px 24px 20px;
      border-top: 1px solid #f0f4f8;
    }
    .btn-cancel {
      height: 40px; padding: 0 18px; border-radius: 10px; cursor: pointer;
      border: 1.5px solid #e2e8f0; background: white;
      font-size: 14px; font-weight: 600; color: #546e7a;
      transition: background .12s, border-color .12s;
      &:hover { background: #f5f7fa; border-color: #cfd8dc; }
    }
    .btn-save {
      display: flex; align-items: center; gap: 6px;
      height: 40px; padding: 0 20px; border-radius: 10px; cursor: pointer; border: none;
      background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
      color: white; font-size: 14px; font-weight: 700;
      box-shadow: 0 4px 14px rgba(21,101,192,.4);
      transition: box-shadow .2s, transform .15s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover:not(:disabled) { box-shadow: 0 6px 20px rgba(21,101,192,.55); transform: translateY(-1px); }
      &:disabled { opacity: .5; cursor: not-allowed; transform: none; box-shadow: none; }
    }
    .btn-spin {
      width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0;
      border: 2px solid rgba(255,255,255,.4); border-top-color: white;
      animation: spin .6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class OperationFormComponent implements OnInit {
  private readonly fb        = inject(FormBuilder);
  private readonly opService = inject(OperationService);
  private readonly alertSvc  = inject(AlertService);
  private readonly dialogRef = inject(MatDialogRef<OperationFormComponent>);
  readonly data: { operation?: Operation } = inject(MAT_DIALOG_DATA) ?? {};

  saving = signal(false);

  categories     = Object.keys(OPERATION_TYPES_BY_CATEGORY) as OperationCategory[];
  typesByCategory = OPERATION_TYPES_BY_CATEGORY;
  categoryLabels  = CATEGORY_LABELS;
  typeConfig      = OPERATION_TYPE_CONFIG;

  get typeCtrl()   { return this.form.get('type')!; }
  get dateCtrl()   { return this.form.get('date')!; }
  get labelCtrl()  { return this.form.get('label')!; }
  get amountCtrl() { return this.form.get('amount')!; }

  form = this.fb.group({
    type:   ['', Validators.required],
    date:   ['', Validators.required],
    label:  ['', Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  ngOnInit(): void {
    if (this.data.operation) {
      this.form.patchValue({
        type:   this.data.operation.type,
        date:   this.data.operation.date,
        label:  this.data.operation.label,
        amount: this.data.operation.amount,
      });
    }
  }

  onTypeChange(): void {
    if (!this.labelCtrl.value) {
      const type = this.typeCtrl.value as OperationType;
      this.labelCtrl.setValue(this.typeConfig[type]?.label ?? '');
    }
  }

  cancel(): void { this.dialogRef.close(false); }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const dto = this.form.getRawValue() as { type: OperationType; date: string; label: string; amount: number };

    const req$ = this.data.operation
      ? this.opService.update(this.data.operation.id, dto)
      : this.opService.create(dto);

    req$.subscribe({
      next: () => {
        this.alertSvc.success(this.data.operation ? 'Opération modifiée' : 'Opération créée');
        this.dialogRef.close(true);
      },
      error: () => {
        this.alertSvc.error('Erreur lors de l\'enregistrement');
        this.saving.set(false);
      }
    });
  }
}
