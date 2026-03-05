import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { AppDateInputComponent } from '../../../shared/components/date-input/date-input.component';
import { EvenementService } from '../../../core/services/evenement.service';
import { AlertService } from '../../../shared/components/alert/alert.service';
import { CATEGORIE_CONFIG, RECURRENCE_CONFIG, STATUT_CONFIG, ALL_CATEGORIES } from '../../../core/utils/evenement-category.utils';
import { Evenement, EvenementCategorie, EvenementRecurrence, EvenementStatut } from '../../../core/models/evenement.model';

@Component({
  selector: 'app-evenement-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, AppDateInputComponent],
  template: `
    <div class="dlg">

      <!-- ── Header ── -->
      <div class="dlg-header">
        <div class="dlg-icon">
          <mat-icon>{{ data.evenement ? 'edit_calendar' : 'event_available' }}</mat-icon>
        </div>
        <div class="dlg-titles">
          <div class="dlg-title">{{ data.evenement ? 'Modifier l\'événement' : 'Nouvel événement' }}</div>
          <div class="dlg-sub">{{ data.evenement ? data.evenement.titre : 'Renseigner les informations' }}</div>
        </div>
        <button class="dlg-close" type="button" (click)="cancel()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- ── Body ── -->
      <div class="dlg-body">
        <form [formGroup]="form" (ngSubmit)="submit()" id="ev-form">

          <!-- Titre -->
          <div class="field-group">
            <label class="field-label">Titre <span class="req">*</span></label>
            <div class="field-wrap" [class.has-error]="titreCtrl.invalid && titreCtrl.touched">
              <mat-icon class="fi">label_outline</mat-icon>
              <input class="fi-input" formControlName="titre" placeholder="ex: Loyer appartement" autocomplete="off" />
            </div>
            @if (titreCtrl.touched && titreCtrl.hasError('required')) {
              <span class="field-err">Le titre est requis</span>
            }
          </div>

          <!-- Catégorie -->
          <div class="field-group">
            <label class="field-label">Catégorie <span class="req">*</span></label>
            <div class="cat-grid">
              @for (cat of allCats; track cat) {
                <button type="button" class="cat-tile"
                  [class.selected]="form.get('categorie')?.value === cat"
                  [style.--fg]="catConfig[cat].fg"
                  [style.--bg]="catConfig[cat].bg"
                  (click)="form.get('categorie')?.setValue(cat); form.get('categorie')?.markAsTouched()">
                  <mat-icon>{{ catConfig[cat].icon }}</mat-icon>
                  <span>{{ catConfig[cat].label }}</span>
                </button>
              }
            </div>
            @if (form.get('categorie')?.touched && form.get('categorie')?.hasError('required')) {
              <span class="field-err">La catégorie est requise</span>
            }
          </div>

          <!-- Montant + Date -->
          <div class="row-2">
            <div class="field-group">
              <label class="field-label">Montant (Ar) <span class="req">*</span></label>
              <div class="field-wrap" [class.has-error]="montantCtrl.invalid && montantCtrl.touched">
                <mat-icon class="fi">payments</mat-icon>
                <input class="fi-input" formControlName="montant" type="number" min="0" placeholder="ex: 350000" />
              </div>
              @if (montantCtrl.touched && montantCtrl.hasError('required')) {
                <span class="field-err">Le montant est requis</span>
              }
            </div>
            <div class="field-group">
              <label class="field-label">Date d'échéance <span class="req">*</span></label>
              <div class="field-wrap" [class.has-error]="dateCtrl.invalid && dateCtrl.touched">
                <mat-icon class="fi">calendar_today</mat-icon>
                <app-date-input formControlName="dateEcheance"></app-date-input>
              </div>
              @if (dateCtrl.touched && dateCtrl.hasError('required')) {
                <span class="field-err">La date est requise</span>
              }
            </div>
          </div>

          <!-- Récurrence -->
          <div class="field-group">
            <label class="field-label">Récurrence <span class="req">*</span></label>
            <div class="rec-row">
              @for (rec of allRecurrences; track rec) {
                <button type="button" class="rec-btn"
                  [class.selected]="form.get('recurrence')?.value === rec"
                  (click)="form.get('recurrence')?.setValue(rec)">
                  <mat-icon>{{ recurrenceConfig[rec].icon }}</mat-icon>
                  {{ recurrenceConfig[rec].label }}
                </button>
              }
            </div>
          </div>

          <!-- Statut -->
          <div class="field-group">
            <label class="field-label">Statut</label>
            <div class="statut-row">
              @for (st of allStatuts; track st) {
                <button type="button" class="statut-btn"
                  [class.selected]="form.get('statut')?.value === st"
                  [style.--fg]="statutConfig[st].fg"
                  [style.--bg]="statutConfig[st].bg"
                  (click)="form.get('statut')?.setValue(st)">
                  <mat-icon>{{ statutConfig[st].icon }}</mat-icon>
                  {{ statutConfig[st].label }}
                </button>
              }
            </div>
          </div>

          <!-- Notes -->
          <div class="field-group">
            <label class="field-label">Notes <span class="opt">(optionnel)</span></label>
            <div class="field-wrap textarea-wrap">
              <mat-icon class="fi fi-top">notes</mat-icon>
              <textarea class="fi-input fi-textarea" formControlName="notes"
                placeholder="Informations complémentaires…" rows="3"></textarea>
            </div>
          </div>

        </form>
      </div>

      <!-- ── Footer ── -->
      <div class="dlg-footer">
        <button class="btn-cancel" type="button" (click)="cancel()">Annuler</button>
        <button class="btn-save" type="submit" form="ev-form"
          [disabled]="form.invalid || saving()">
          @if (saving()) { <span class="btn-spin"></span> }
          @else { <mat-icon>check</mat-icon> }
          Enregistrer
        </button>
      </div>

    </div>
  `,
  styles: [`
    .dlg {
      display: flex; flex-direction: column;
      width: 560px; max-width: 95vw; max-height: 90vh; overflow: hidden;
      background: white;
    }

    /* ── Header ── */
    .dlg-header {
      display: flex; align-items: center; gap: 14px;
      padding: 20px 24px 16px; border-bottom: 1px solid #f0f4f8; flex-shrink: 0;
    }
    .dlg-icon {
      width: 46px; height: 46px; border-radius: 13px; flex-shrink: 0;
      background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
      display: flex; align-items: center; justify-content: center;
      color: white; box-shadow: 0 4px 12px rgba(21,101,192,.35);
      mat-icon { font-size: 22px; width: 22px; height: 22px; }
    }
    .dlg-titles { flex: 1; min-width: 0; }
    .dlg-title  { font-size: 16px; font-weight: 800; color: #0d1b2a; }
    .dlg-sub    { font-size: 12px; color: #90a4ae; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
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
      overflow-y: auto; flex: 1;
    }
    form { display: flex; flex-direction: column; gap: 20px; }

    .field-group { display: flex; flex-direction: column; gap: 6px; }
    .field-label {
      font-size: 11px; font-weight: 700; color: #475569;
      text-transform: uppercase; letter-spacing: .5px;
    }
    .req { color: #ef5350; }
    .opt { color: #b0bec5; text-transform: none; font-weight: 400; letter-spacing: 0; }

    .field-wrap {
      display: flex; align-items: center; gap: 8px;
      height: 44px; padding: 0 12px;
      border: 1.5px solid #e2e8f0; border-radius: 10px; background: #f8fafc;
      transition: border-color .15s, background .15s;
      &:focus-within { border-color: #90caf9; background: white; box-shadow: 0 0 0 3px rgba(144,202,249,.15); }
      &.has-error { border-color: #ef9a9a; background: #fff5f5; }
      &.textarea-wrap { height: auto; align-items: flex-start; padding-top: 10px; }
    }
    .fi { font-size: 16px; width: 16px; height: 16px; color: #94a3b8; flex-shrink: 0; }
    .fi-top { margin-top: 2px; }
    .fi-input {
      flex: 1; border: none; background: transparent; outline: none;
      font-size: 14px; color: #0d1b2a; min-width: 0;
      &::placeholder { color: #b0bec5; }
    }
    .fi-textarea { resize: none; line-height: 1.5; padding: 0; }
    .field-err { font-size: 12px; color: #c62828; }

    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

    /* ── Catégorie grid ── */
    .cat-grid {
      display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;
    }
    .cat-tile {
      display: flex; flex-direction: column; align-items: center; gap: 5px;
      padding: 10px 4px 8px; border-radius: 12px; cursor: pointer;
      border: 1.5px solid #e2e8f0; background: white;
      transition: all .12s;
      mat-icon { font-size: 20px; width: 20px; height: 20px; color: #94a3b8; }
      span { font-size: 10px; color: #78909c; text-align: center; line-height: 1.2; }
      &:hover {
        border-color: var(--fg); background: var(--bg);
        mat-icon { color: var(--fg); }
        span { color: var(--fg); }
      }
      &.selected {
        border-color: var(--fg) !important; background: var(--bg) !important;
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--fg) 15%, transparent);
        mat-icon { color: var(--fg); }
        span { color: var(--fg); font-weight: 700; }
      }
    }

    /* ── Récurrence ── */
    .rec-row { display: flex; gap: 8px; flex-wrap: wrap; }
    .rec-btn {
      display: flex; align-items: center; gap: 6px;
      height: 36px; padding: 0 14px; border-radius: 10px; cursor: pointer;
      border: 1.5px solid #e2e8f0; background: white;
      font-size: 13px; font-weight: 500; color: #546e7a;
      transition: all .15s;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &:hover { border-color: #90a4ae; background: #f5f7fa; }
      &.selected { border-color: #1565c0; background: #e3f2fd; color: #1565c0; font-weight: 700; }
    }

    /* ── Statut ── */
    .statut-row { display: flex; gap: 8px; }
    .statut-btn {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
      height: 38px; border-radius: 10px; cursor: pointer;
      border: 1.5px solid #e2e8f0; background: white;
      font-size: 13px; font-weight: 500; color: #546e7a;
      transition: all .15s;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &:hover { border-color: var(--fg); background: var(--bg); color: var(--fg); }
      &.selected {
        border-color: var(--fg); background: var(--bg); color: var(--fg); font-weight: 700;
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--fg) 12%, transparent);
      }
    }

    /* ── Footer ── */
    .dlg-footer {
      display: flex; justify-content: flex-end; gap: 10px;
      padding: 14px 24px 20px; border-top: 1px solid #f0f4f8; flex-shrink: 0;
    }
    .btn-cancel {
      height: 40px; padding: 0 18px; border-radius: 10px; cursor: pointer;
      border: 1.5px solid #e2e8f0; background: white;
      font-size: 14px; font-weight: 600; color: #546e7a;
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
  `],
})
export class EvenementFormComponent implements OnInit {
  private readonly fb         = inject(FormBuilder);
  private readonly service    = inject(EvenementService);
  private readonly alert      = inject(AlertService);
  private readonly dialogRef  = inject(MatDialogRef<EvenementFormComponent>);
  readonly data: { evenement?: Evenement } = inject(MAT_DIALOG_DATA) ?? {};

  saving    = signal(false);

  readonly catConfig        = CATEGORIE_CONFIG;
  readonly recurrenceConfig = RECURRENCE_CONFIG;
  readonly statutConfig     = STATUT_CONFIG;
  readonly allCats          = ALL_CATEGORIES;
  readonly allRecurrences: EvenementRecurrence[] = ['MENSUEL', 'HEBDOMADAIRE', 'ANNUEL', 'UNIQUE'];
  readonly allStatuts: EvenementStatut[]          = ['EN_ATTENTE', 'PAYE', 'EN_RETARD'];

  get titreCtrl()  { return this.form.get('titre')!; }
  get montantCtrl(){ return this.form.get('montant')!; }
  get dateCtrl()   { return this.form.get('dateEcheance')!; }

  form = this.fb.group({
    titre:        ['', Validators.required],
    categorie:    [null as EvenementCategorie | null, Validators.required],
    montant:      [null as number | null, [Validators.required, Validators.min(0)]],
    dateEcheance: ['', Validators.required],
    recurrence:   ['MENSUEL' as EvenementRecurrence],
    statut:       ['EN_ATTENTE' as EvenementStatut],
    notes:        [''],
  });

  ngOnInit(): void {
    const ev = this.data.evenement;
    if (ev) {
      this.form.patchValue({
        titre:        ev.titre,
        categorie:    ev.categorie,
        montant:      ev.montant / 100,   // centimes → Ariary
        dateEcheance: ev.dateEcheance,
        recurrence:   ev.recurrence,
        statut:       ev.statut,
        notes:        ev.notes ?? '',
      });
    }
  }

  cancel(): void { this.dialogRef.close(false); }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const v = this.form.getRawValue();
    const dto = {
      titre:        v.titre!,
      categorie:    v.categorie!,
      montant:      Math.round((v.montant ?? 0) * 100), // Ariary → centimes
      dateEcheance: v.dateEcheance!,
      recurrence:   v.recurrence!,
      statut:       v.statut!,
      notes:        v.notes || undefined,
    };

    const req$ = this.data.evenement
      ? this.service.update(this.data.evenement.id, dto)
      : this.service.create(dto);

    req$.subscribe({
      next: () => {
        this.alert.success(this.data.evenement ? 'Événement modifié' : 'Événement créé');
        this.dialogRef.close(true);
      },
      error: () => {
        this.alert.error('Erreur lors de l\'enregistrement');
        this.saving.set(false);
      },
    });
  }
}
