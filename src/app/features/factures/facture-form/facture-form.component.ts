import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FactureService } from '../../../core/services/facture.service';
import { TiersService } from '../../../core/services/tiers.service';
import { AlertService } from '../../../shared/components/alert/alert.service';
import { CurrencyInputComponent } from '../../../shared/components/currency-input/currency-input.component';
import { Facture } from '../../../core/models/facture.model';
import { Tiers } from '../../../core/models/tiers.model';

@Component({
  selector: 'app-facture-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, CurrencyInputComponent,
  ],
  template: `
    <div class="dlg">

      <!-- ── Header ── -->
      <div class="dlg-header">
        <div class="dlg-icon" [class.icon-edit]="isEdit">
          <mat-icon>{{ isEdit ? 'edit' : 'receipt_long' }}</mat-icon>
        </div>
        <div class="dlg-titles">
          <div class="dlg-title">{{ isEdit ? 'Modifier la facture' : 'Nouvelle facture' }}</div>
          <div class="dlg-sub">{{ isEdit ? data!.numero : 'Créer une facture client ou fournisseur' }}</div>
        </div>
        <button class="dlg-close" type="button" (click)="cancel()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- ── Body ── -->
      <form [formGroup]="form" (ngSubmit)="submit()" class="dlg-body" id="facture-form">

        <!-- N° Facture + Date -->
        <div class="row-2">
          <div class="field-group">
            <label class="field-label">N° Facture <span class="req">*</span></label>
            <div class="field-wrap" [class.has-error]="form.get('numero')?.invalid && form.get('numero')?.touched">
              <mat-icon class="fi">tag</mat-icon>
              <input class="fi-input" formControlName="numero" placeholder="FAC-2025-001" autocomplete="off" />
            </div>
            @if (form.get('numero')?.touched && form.get('numero')?.hasError('required')) {
              <span class="field-err">Le numéro est requis</span>
            }
          </div>
          <div class="field-group">
            <label class="field-label">Date <span class="req">*</span></label>
            <div class="field-wrap" [class.has-error]="form.get('date')?.invalid && form.get('date')?.touched">
              <mat-icon class="fi">calendar_today</mat-icon>
              <input class="fi-input" formControlName="date" type="date" />
            </div>
          </div>
        </div>

        <!-- Tiers -->
        <div class="field-group">
          <label class="field-label">Tiers <span class="req">*</span></label>
          <div class="field-wrap select-wrap" [class.has-error]="form.get('tiersId')?.invalid && form.get('tiersId')?.touched">
            <mat-icon class="fi">people</mat-icon>
            <select class="fi-select" formControlName="tiersId">
              <option [ngValue]="null" disabled>Sélectionner un tiers…</option>
              @for (t of tiersList; track t.id) {
                <option [ngValue]="t.id">
                  [{{ t.type === 'CLIENT' ? 'Client' : 'Fournisseur' }}] {{ t.nom }}
                </option>
              }
            </select>
            <mat-icon class="fi fi-chevron">expand_more</mat-icon>
          </div>
          @if (form.get('tiersId')?.touched && form.get('tiersId')?.hasError('required')) {
            <span class="field-err">Le tiers est requis</span>
          }
        </div>

        <!-- Montant -->
        <div class="field-group">
          <label class="field-label">Montant <span class="req">*</span></label>
          <div class="field-wrap currency-wrap">
            <mat-icon class="fi">euro</mat-icon>
            <app-currency-input formControlName="montant" />
            <span class="currency-suffix">€</span>
          </div>
        </div>

        <!-- Date échéance + Statut -->
        <div class="row-2">
          <div class="field-group">
            <label class="field-label">Date d'échéance</label>
            <div class="field-wrap">
              <mat-icon class="fi">event</mat-icon>
              <input class="fi-input" formControlName="dateEcheance" type="date" />
            </div>
          </div>
          <div class="field-group">
            <label class="field-label">Statut</label>
            <div class="field-wrap select-wrap">
              <mat-icon class="fi">info_outline</mat-icon>
              <select class="fi-select" formControlName="statut">
                <option value="EN_ATTENTE">En attente</option>
                <option value="PARTIELLEMENT_PAYEE">Partiellement payée</option>
                <option value="PAYEE">Payée</option>
                <option value="ANNULEE">Annulée</option>
              </select>
              <mat-icon class="fi fi-chevron">expand_more</mat-icon>
            </div>
          </div>
        </div>

        <!-- Statut badge preview -->
        <div class="statut-preview">
          <span class="statut-badge" [class]="'statut-' + form.value.statut">
            <mat-icon>{{ statutIcon(form.value.statut) }}</mat-icon>
            {{ statutLabel(form.value.statut) }}
          </span>
        </div>

        <!-- Notes -->
        <div class="field-group">
          <label class="field-label">Notes</label>
          <div class="field-wrap field-textarea">
            <mat-icon class="fi fi-top">notes</mat-icon>
            <textarea class="fi-input" formControlName="notes" rows="2"
              placeholder="Informations complémentaires…"></textarea>
          </div>
        </div>

      </form>

      <!-- ── Footer ── -->
      <div class="dlg-footer">
        <button class="btn-cancel" type="button" (click)="cancel()">Annuler</button>
        <button class="btn-save" type="submit" form="facture-form"
          [disabled]="form.invalid || saving"
          [class.btn-edit]="isEdit">
          @if (saving) {
            <span class="btn-spin"></span>
          } @else {
            <mat-icon>{{ isEdit ? 'save' : 'add_circle' }}</mat-icon>
          }
          {{ saving ? 'Enregistrement…' : (isEdit ? 'Enregistrer' : 'Créer la facture') }}
        </button>
      </div>

    </div>
  `,
  styles: [`
    .dlg {
      display: flex; flex-direction: column;
      width: 100%; background: white;
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
      &.icon-edit {
        background: linear-gradient(135deg, #e65100 0%, #bf360c 100%);
        box-shadow: 0 4px 12px rgba(230,81,0,.35);
      }
    }
    .dlg-titles { flex: 1; min-width: 0; }
    .dlg-title { font-size: 16px; font-weight: 800; color: #0d1b2a; }
    .dlg-sub   { font-size: 12px; color: #90a4ae; margin-top: 2px; }
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
      padding: 20px 24px; display: flex; flex-direction: column; gap: 16px;
      overflow-y: auto; max-height: calc(88vh - 140px);
      scrollbar-width: thin;
    }

    /* ── Fields ── */
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
    .field-textarea {
      height: auto; padding: 10px 12px; align-items: flex-start;
    }
    .select-wrap { padding-right: 6px; }

    .fi { font-size: 16px; width: 16px; height: 16px; color: #94a3b8; flex-shrink: 0; }
    .fi-top { margin-top: 2px; }
    .fi-chevron { margin-left: auto; pointer-events: none; }

    .fi-input {
      flex: 1; border: none; background: transparent; outline: none;
      font-size: 14px; color: #0d1b2a; min-width: 0; resize: none;
      &::placeholder { color: #b0bec5; }
    }

    .fi-select {
      flex: 1; border: none; background: transparent; outline: none;
      font-size: 14px; color: #0d1b2a; min-width: 0;
      appearance: none; -webkit-appearance: none; cursor: pointer;
    }

    /* Montant currency wrap */
    .currency-wrap {
      app-currency-input { flex: 1; min-width: 0; display: flex; }
      ::ng-deep app-currency-input input {
        flex: 1; border: none; background: transparent; outline: none;
        font-size: 14px; font-weight: 600; color: #0d1b2a; min-width: 0; width: 100%;
        &::placeholder { color: #b0bec5; font-weight: 400; }
      }
    }
    .currency-suffix {
      font-size: 13px; font-weight: 700; color: #94a3b8; flex-shrink: 0;
    }

    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

    .field-err  { font-size: 12px; color: #c62828; }

    /* ── Statut preview ── */
    .statut-preview { display: flex; }
    .statut-badge {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }
    .statut-EN_ATTENTE       { background: #fff3e0; color: #e65100; }
    .statut-PARTIELLEMENT_PAYEE { background: #e8f0fe; color: #1a73e8; }
    .statut-PAYEE            { background: #e8f5e9; color: #2e7d32; }
    .statut-ANNULEE          { background: #fce4ec; color: #c62828; }

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
      &.btn-edit {
        background: linear-gradient(135deg, #e65100 0%, #bf360c 100%);
        box-shadow: 0 4px 14px rgba(230,81,0,.4);
        &:hover:not(:disabled) { box-shadow: 0 6px 20px rgba(230,81,0,.55); }
      }
    }
    .btn-spin {
      width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0;
      border: 2px solid rgba(255,255,255,.4); border-top-color: white;
      animation: spin .6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class FactureFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(FactureService);
  private readonly tiersService = inject(TiersService);
  private readonly alert = inject(AlertService);
  readonly dialogRef = inject(MatDialogRef<FactureFormComponent>);
  readonly data: Facture | null = inject(MAT_DIALOG_DATA);

  tiersList: Tiers[] = [];
  saving = false;
  get isEdit(): boolean { return !!this.data; }

  form = this.fb.group({
    numero:       ['', Validators.required],
    date:         ['', Validators.required],
    dateEcheance: [''],
    montant:      [0, [Validators.required, Validators.min(1)]],
    statut:       ['EN_ATTENTE'],
    notes:        [''],
    tiersId:      [null as number | null, Validators.required],
  });

  ngOnInit(): void {
    this.tiersService.getAll().subscribe({ next: list => this.tiersList = list, error: () => {} });
    if (this.data) {
      this.form.patchValue({
        numero:       this.data.numero,
        date:         this.data.date?.substring(0, 10) ?? '',
        dateEcheance: this.data.dateEcheance?.substring(0, 10) ?? '',
        montant:      this.data.montant,
        statut:       this.data.statut,
        notes:        this.data.notes ?? '',
        tiersId:      this.data.tiersId,
      });
    } else {
      const today = new Date().toISOString().substring(0, 10);
      this.form.patchValue({ date: today });
    }
  }

  submit(): void {
    if (this.form.invalid || this.saving) return;
    this.saving = true;
    const v = this.form.value;
    const dto = {
      numero:       v.numero!,
      date:         v.date!,
      dateEcheance: v.dateEcheance || undefined,
      montant:      v.montant!,
      statut:       (v.statut as any) ?? 'EN_ATTENTE',
      notes:        v.notes || undefined,
      tiersId:      v.tiersId!,
    };

    const obs$ = this.isEdit
      ? this.service.update(this.data!.id, dto)
      : this.service.create(dto);

    obs$.subscribe({
      next: saved => {
        this.alert.success(this.isEdit ? 'Facture modifiée' : 'Facture créée');
        this.dialogRef.close(saved);
      },
      error: () => { this.alert.error('Erreur'); this.saving = false; },
    });
  }

  cancel(): void { this.dialogRef.close(null); }

  statutIcon(statut: string | null | undefined): string {
    const map: Record<string, string> = {
      EN_ATTENTE: 'schedule', PARTIELLEMENT_PAYEE: 'payments',
      PAYEE: 'check_circle', ANNULEE: 'cancel',
    };
    return map[statut ?? ''] ?? 'info';
  }

  statutLabel(statut: string | null | undefined): string {
    const map: Record<string, string> = {
      EN_ATTENTE: 'En attente', PARTIELLEMENT_PAYEE: 'Partiellement payée',
      PAYEE: 'Payée', ANNULEE: 'Annulée',
    };
    return map[statut ?? ''] ?? '—';
  }
}
