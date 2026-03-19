import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PeriodeLockService } from '../../core/services/periode-lock.service';
import { AlertService } from '../../shared/components/alert/alert.service';
import { PeriodeLock } from '../../core/models/periode-lock.model';

const MOIS_LABELS = [
  '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

@Component({
  selector: 'app-periode-locks',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule,
  ],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Verrouillage mensuel</h1>
        <p class="page-sub">Verrouillez une période pour empêcher toute saisie, modification ou suppression d'écritures.</p>
      </div>
    </div>

    <div class="layout">

      <!-- ── Formulaire de verrouillage ── -->
      <div class="lock-card">
        <h2 class="section-title"><mat-icon>lock</mat-icon> Verrouiller une période</h2>
        <form [formGroup]="form" (ngSubmit)="lock()" class="lock-form">
          <div class="form-row">
            <div class="field-group">
              <label class="field-label">Année</label>
              <select class="field-select" formControlName="annee">
                @for (y of years; track y) {
                  <option [value]="y">{{ y }}</option>
                }
              </select>
            </div>
            <div class="field-group">
              <label class="field-label">Mois</label>
              <select class="field-select" formControlName="mois">
                @for (m of moisOptions; track m.value) {
                  <option [value]="m.value">{{ m.label }}</option>
                }
              </select>
            </div>
            <button class="btn-lock" type="submit" [disabled]="form.invalid || saving()">
              @if (saving()) { <mat-spinner diameter="16"></mat-spinner> }
              @else { <mat-icon>lock</mat-icon> }
              Verrouiller
            </button>
          </div>
        </form>

        <div class="warning-info">
          <mat-icon>warning_amber</mat-icon>
          <span>Une période verrouillée bloque la création, modification et suppression d'écritures pour ce mois.
            Vous pouvez déverrouiller à tout moment.</span>
        </div>
      </div>

      <!-- ── Liste des périodes verrouillées ── -->
      <div class="locks-list-card">
        <h2 class="section-title"><mat-icon>lock_clock</mat-icon> Périodes verrouillées ({{ locks().length }})</h2>

        @if (locks().length === 0) {
          <div class="empty-state">
            <mat-icon>lock_open</mat-icon>
            <p>Aucune période verrouillée</p>
          </div>
        } @else {
          <div class="locks-grid">
            @for (lock of locksSorted(); track lock.id) {
              <div class="lock-item">
                <div class="lock-icon-wrap">
                  <mat-icon>lock</mat-icon>
                </div>
                <div class="lock-body">
                  <span class="lock-period">{{ moisLabel(lock.mois) }} {{ lock.annee }}</span>
                  <span class="lock-date">Verrouillé le {{ lock.lockedAt | date: 'dd/MM/yyyy à HH:mm' }}</span>
                </div>
                <button class="btn-unlock" (click)="unlock(lock)"
                  [disabled]="unlocking() === lock.id"
                  matTooltip="Déverrouiller cette période">
                  @if (unlocking() === lock.id) {
                    <mat-spinner diameter="14"></mat-spinner>
                  } @else {
                    <mat-icon>lock_open</mat-icon>
                  }
                </button>
              </div>
            }
          </div>
        }
      </div>

    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    .page-title { font-size: 26px; font-weight: 800; color: #0d1b2a; margin: 0 0 4px; }
    .page-sub   { font-size: 13px; color: #78909c; margin: 0; }

    .layout { display: flex; flex-direction: column; gap: 20px; }

    .lock-card, .locks-list-card {
      background: white; border-radius: 16px;
      box-shadow: 0 2px 8px rgba(13,27,42,.07);
      padding: 24px;
    }

    .section-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 16px; font-weight: 700; color: #0d1b2a; margin: 0 0 20px;
      mat-icon { font-size: 20px; width: 20px; height: 20px; color: #546e7a; }
    }

    .lock-form { margin-bottom: 16px; }
    .form-row {
      display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap;
    }
    .field-group { display: flex; flex-direction: column; gap: 6px; }
    .field-label { font-size: 12px; font-weight: 600; color: #546e7a; }
    .field-select {
      height: 40px; padding: 0 12px; border-radius: 10px;
      border: 1.5px solid #e2e8f0; background: white;
      font-size: 14px; color: #0d1b2a; cursor: pointer; outline: none;
      transition: border-color .15s;
      &:focus { border-color: #90caf9; }
    }

    .btn-lock {
      display: inline-flex; align-items: center; gap: 6px;
      height: 40px; padding: 0 20px; border-radius: 10px; cursor: pointer;
      border: none; background: #1565c0; color: white;
      font-size: 14px; font-weight: 600;
      transition: background .15s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover:not(:disabled) { background: #0d47a1; }
      &:disabled { opacity: .5; cursor: not-allowed; }
    }

    .warning-info {
      display: flex; align-items: flex-start; gap: 8px;
      background: #fff8e1; border: 1px solid #ffe082;
      border-radius: 10px; padding: 12px 16px;
      font-size: 12px; color: #f57f17;
      mat-icon { font-size: 16px; width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }
    }

    .empty-state {
      text-align: center; padding: 32px; color: #90a4ae;
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      mat-icon { font-size: 40px; width: 40px; height: 40px; opacity: .4; }
      p { margin: 0; font-size: 14px; }
    }

    .locks-grid { display: flex; flex-direction: column; gap: 8px; }

    .lock-item {
      display: flex; align-items: center; gap: 12px;
      background: #fef9f9; border: 1px solid #fde8e8;
      border-radius: 12px; padding: 12px 16px;
    }

    .lock-icon-wrap {
      width: 36px; height: 36px; border-radius: 10px;
      background: #fce4ec; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      mat-icon { font-size: 18px; width: 18px; height: 18px; color: #c62828; }
    }

    .lock-body { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .lock-period { font-size: 14px; font-weight: 700; color: #0d1b2a; }
    .lock-date   { font-size: 11px; color: #90a4ae; }

    .btn-unlock {
      width: 34px; height: 34px; border-radius: 8px;
      border: 1.5px solid #ffcdd2; background: white; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #c62828; transition: all .15s; flex-shrink: 0;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover:not(:disabled) { background: #fce4ec; border-color: #ef9a9a; }
      &:disabled { opacity: .4; cursor: not-allowed; }
    }
  `],
})
export class PeriodeLocksComponent implements OnInit {
  private readonly svc      = inject(PeriodeLockService);
  private readonly alertSvc = inject(AlertService);
  private readonly fb       = inject(FormBuilder);

  locks     = signal<PeriodeLock[]>([]);
  saving    = signal(false);
  unlocking = signal<number | null>(null);

  locksSorted = computed(() =>
    [...this.locks()].sort((a, b) => b.annee - a.annee || b.mois - a.mois)
  );

  currentYear = new Date().getFullYear();
  years = Array.from({ length: 5 }, (_, i) => this.currentYear - i);
  moisOptions = MOIS_LABELS.slice(1).map((label, i) => ({ value: i + 1, label }));

  form = this.fb.group({
    annee: [this.currentYear, Validators.required],
    mois:  [new Date().getMonth() + 1, Validators.required],
  });

  ngOnInit(): void {
    this.svc.getAll().subscribe(list => this.locks.set(list));
  }

  moisLabel(mois: number): string {
    return MOIS_LABELS[mois] ?? String(mois);
  }

  lock(): void {
    if (this.form.invalid) return;
    const { annee, mois } = this.form.getRawValue();
    this.saving.set(true);
    this.svc.lock(annee!, mois!).subscribe({
      next: (l) => {
        this.locks.update(list => [...list, l]);
        this.alertSvc.success(`${this.moisLabel(mois!)} ${annee} verrouillé`);
        this.saving.set(false);
      },
      error: () => {
        this.alertSvc.error('Erreur ou période déjà verrouillée');
        this.saving.set(false);
      },
    });
  }

  unlock(lock: PeriodeLock): void {
    this.unlocking.set(lock.id);
    this.svc.unlock(lock.id).subscribe({
      next: () => {
        this.locks.update(list => list.filter(l => l.id !== lock.id));
        this.alertSvc.success(`${this.moisLabel(lock.mois)} ${lock.annee} déverrouillé`);
        this.unlocking.set(null);
      },
      error: () => {
        this.alertSvc.error('Erreur lors du déverrouillage');
        this.unlocking.set(null);
      },
    });
  }
}
