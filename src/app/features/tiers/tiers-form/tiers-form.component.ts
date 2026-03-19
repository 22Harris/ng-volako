import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TiersService } from '../../../core/services/tiers.service';
import { AlertService } from '../../../shared/components/alert/alert.service';
import { AccountSelectComponent } from '../../../shared/components/account-select/account-select.component';
import { Tiers } from '../../../core/models/tiers.model';

@Component({
  selector: 'app-tiers-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, AccountSelectComponent],
  template: `
    <div class="dlg">

      <!-- ── Header ── -->
      <div class="dlg-header">
        <div class="dlg-icon" [class.icon-fournisseur]="form.value.type === 'FOURNISSEUR'">
          <mat-icon>{{ isEdit ? 'edit' : (form.value.type === 'CLIENT' ? 'person' : 'store') }}</mat-icon>
        </div>
        <div class="dlg-titles">
          <div class="dlg-title">{{ isEdit ? 'Modifier le tiers' : 'Nouveau tiers' }}</div>
          <div class="dlg-sub">{{ isEdit ? data!.nom : 'Client ou fournisseur' }}</div>
        </div>
        <button class="dlg-close" type="button" (click)="cancel()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- ── Body ── -->
      <form [formGroup]="form" (ngSubmit)="submit()" class="dlg-body" id="tiers-form">

        <!-- Type -->
        <div class="field-group">
          <label class="field-label">Type <span class="req">*</span></label>
          <div class="type-row">
            <button type="button" class="type-tile"
              [class.selected-client]="form.value.type === 'CLIENT'"
              (click)="form.patchValue({ type: 'CLIENT' })">
              <div class="tile-icon tile-client"><mat-icon>person</mat-icon></div>
              <span class="tile-name">Client</span>
              <span class="tile-desc">Acheteur</span>
              @if (form.value.type === 'CLIENT') {
                <mat-icon class="tile-check">check_circle</mat-icon>
              }
            </button>
            <button type="button" class="type-tile"
              [class.selected-fournisseur]="form.value.type === 'FOURNISSEUR'"
              (click)="form.patchValue({ type: 'FOURNISSEUR' })">
              <div class="tile-icon tile-fournisseur"><mat-icon>store</mat-icon></div>
              <span class="tile-name">Fournisseur</span>
              <span class="tile-desc">Prestataire</span>
              @if (form.value.type === 'FOURNISSEUR') {
                <mat-icon class="tile-check">check_circle</mat-icon>
              }
            </button>
          </div>
        </div>

        <!-- Nom -->
        <div class="field-group">
          <label class="field-label">Raison sociale / Nom <span class="req">*</span></label>
          <div class="field-wrap" [class.has-error]="form.get('nom')?.invalid && form.get('nom')?.touched">
            <mat-icon class="fi">person_outline</mat-icon>
            <input class="fi-input" formControlName="nom" placeholder="ex : Dupont SARL" autocomplete="off" />
          </div>
          @if (form.get('nom')?.touched && form.get('nom')?.hasError('required')) {
            <span class="field-err">Le nom est requis</span>
          }
        </div>

        <!-- SIRET -->
        <div class="field-group">
          <label class="field-label">SIRET</label>
          <div class="field-wrap">
            <mat-icon class="fi">business</mat-icon>
            <input class="fi-input" formControlName="siret" placeholder="14 chiffres" maxlength="14" />
          </div>
        </div>

        <!-- Email + Téléphone -->
        <div class="row-2">
          <div class="field-group">
            <label class="field-label">Email</label>
            <div class="field-wrap">
              <mat-icon class="fi">email</mat-icon>
              <input class="fi-input" formControlName="email" type="email" placeholder="contact@exemple.fr" />
            </div>
          </div>
          <div class="field-group">
            <label class="field-label">Téléphone</label>
            <div class="field-wrap">
              <mat-icon class="fi">phone</mat-icon>
              <input class="fi-input" formControlName="telephone" placeholder="06 00 00 00 00" />
            </div>
          </div>
        </div>

        <!-- Adresse -->
        <div class="field-group">
          <label class="field-label">Adresse</label>
          <div class="field-wrap field-textarea">
            <mat-icon class="fi fi-top">location_on</mat-icon>
            <textarea class="fi-input" formControlName="adresse" rows="2"
              placeholder="Rue, code postal, ville…"></textarea>
          </div>
        </div>

        <!-- Compte comptable -->
        <div class="field-group">
          <label class="field-label">Compte comptable associé</label>
          <app-account-select formControlName="accountId" label="Compte" appearance="outline"></app-account-select>
          <span class="field-hint">Compte 411 (clients) ou 401 (fournisseurs)</span>
        </div>

      </form>

      <!-- ── Footer ── -->
      <div class="dlg-footer">
        <button class="btn-cancel" type="button" (click)="cancel()">Annuler</button>
        <button class="btn-save" type="submit" form="tiers-form"
          [disabled]="form.invalid || saving"
          [class.btn-fournisseur]="form.value.type === 'FOURNISSEUR'">
          @if (saving) {
            <span class="btn-spin"></span>
          } @else {
            <mat-icon>check</mat-icon>
          }
          {{ isEdit ? 'Enregistrer' : 'Créer le tiers' }}
        </button>
      </div>

    </div>
  `,
  styles: [`
    .dlg {
      display: flex; flex-direction: column;
      width: 100%;
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
      transition: background .25s, box-shadow .25s;
      mat-icon { font-size: 22px; width: 22px; height: 22px; }
      &.icon-fournisseur {
        background: linear-gradient(135deg, #c62828 0%, #b71c1c 100%);
        box-shadow: 0 4px 12px rgba(198,40,40,.35);
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
      padding: 20px 24px; display: flex; flex-direction: column; gap: 18px;
      overflow-y: auto; max-height: calc(88vh - 140px);
      scrollbar-width: thin;
    }

    /* ── Type selector ── */
    .type-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .type-tile {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 14px; border-radius: 12px;
      border: 1.5px solid #e2e8f0; background: white;
      cursor: pointer; transition: border-color .12s, background .12s;
      &:hover { border-color: #b0bec5; background: #f8fafc; }
    }
    .tile-icon {
      width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .tile-client     { background: #e3f2fd; color: #1565c0; }
    .tile-fournisseur { background: #ffebee; color: #c62828; }
    .tile-name { font-size: 13px; font-weight: 700; color: #263238; }
    .tile-desc { font-size: 11px; color: #90a4ae; flex: 1; }
    .tile-check { font-size: 18px; width: 18px; height: 18px; margin-left: auto; }

    .type-tile.selected-client {
      border-color: #1565c0; background: #e8f4fd;
      .tile-check { color: #1565c0; }
    }
    .type-tile.selected-fournisseur {
      border-color: #c62828; background: #fef0f0;
      .tile-check { color: #c62828; }
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
    .fi { font-size: 16px; width: 16px; height: 16px; color: #94a3b8; flex-shrink: 0; }
    .fi-top { margin-top: 2px; }
    .fi-input {
      flex: 1; border: none; background: transparent; outline: none;
      font-size: 14px; color: #0d1b2a; min-width: 0; resize: none;
      &::placeholder { color: #b0bec5; }
    }

    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

    .field-err  { font-size: 12px; color: #c62828; }
    .field-hint { font-size: 12px; color: #90a4ae; }

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
      &.btn-fournisseur {
        background: linear-gradient(135deg, #c62828 0%, #b71c1c 100%);
        box-shadow: 0 4px 14px rgba(198,40,40,.4);
        &:hover:not(:disabled) { box-shadow: 0 6px 20px rgba(198,40,40,.55); }
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
export class TiersFormComponent implements OnInit {
  private readonly fb      = inject(FormBuilder);
  private readonly service = inject(TiersService);
  private readonly alert   = inject(AlertService);
  readonly dialogRef       = inject(MatDialogRef<TiersFormComponent>);
  readonly data: Tiers | null = inject(MAT_DIALOG_DATA);

  saving = false;
  get isEdit(): boolean { return !!this.data; }

  form = this.fb.group({
    nom:       ['', Validators.required],
    type:      ['CLIENT' as 'CLIENT' | 'FOURNISSEUR', Validators.required],
    siret:     [''],
    email:     [''],
    telephone: [''],
    adresse:   [''],
    accountId: [null as number | null],
  });

  ngOnInit(): void {
    if (this.data) {
      this.form.patchValue({
        nom:       this.data.nom,
        type:      this.data.type,
        siret:     this.data.siret ?? '',
        email:     this.data.email ?? '',
        telephone: this.data.telephone ?? '',
        adresse:   this.data.adresse ?? '',
        accountId: this.data.accountId ?? null,
      });
    }
  }

  submit(): void {
    if (this.form.invalid || this.saving) return;
    this.saving = true;
    const v = this.form.value;
    const dto = {
      nom:       v.nom!,
      type:      v.type!,
      siret:     v.siret || undefined,
      email:     v.email || undefined,
      telephone: v.telephone || undefined,
      adresse:   v.adresse || undefined,
      accountId: v.accountId ?? undefined,
    };

    const obs$ = this.isEdit
      ? this.service.update(this.data!.id, dto)
      : this.service.create(dto);

    obs$.subscribe({
      next: (saved) => {
        this.alert.success(this.isEdit ? 'Tiers modifié' : 'Tiers créé');
        this.dialogRef.close(saved);
      },
      error: () => { this.alert.error('Erreur'); this.saving = false; },
    });
  }

  cancel(): void { this.dialogRef.close(null); }
}
