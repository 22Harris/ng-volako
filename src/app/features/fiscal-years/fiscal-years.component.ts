import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { FiscalYearService, FiscalYear } from '../../core/services/fiscal-year.service';
import { RapportsService } from '../../core/services/rapports.service';
import { AlertService } from '../../shared/components/alert/alert.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-fiscal-years',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Exercices fiscaux</h1>
          <p class="page-sub">Créez et clôturez les exercices comptables annuels</p>
        </div>
        <button class="btn-primary" (click)="showForm.set(!showForm())">
          <mat-icon>add</mat-icon> Nouvel exercice
        </button>
      </div>

      @if (showForm()) {
        <div class="form-card">
          <h3>Créer un exercice</h3>
          <div class="form-row">
            <input type="number" [(ngModel)]="newYear" placeholder="Année (ex: 2025)"
              class="input-field" min="2000" max="2099" />
            <button class="btn-primary" (click)="create()" [disabled]="saving()">
              <mat-icon>save</mat-icon> Créer
            </button>
            <button class="btn-secondary" (click)="showForm.set(false)">Annuler</button>
          </div>
        </div>
      }

      <div class="fy-list">
        @if (loading()) {
          <div class="loading">Chargement…</div>
        } @else if (fiscalYears().length === 0) {
          <div class="empty-state">
            <mat-icon>calendar_today</mat-icon>
            <p>Aucun exercice fiscal créé. Créez le premier exercice pour commencer.</p>
          </div>
        } @else {
          @for (fy of fiscalYears(); track fy.id) {
            <div class="fy-card" [class.fy-closed]="fy.statut === 'CLOTURE'">
              <div class="fy-info">
                <span class="fy-year">{{ fy.annee }}</span>
                <span class="fy-badge" [class.badge-open]="fy.statut === 'OUVERT'" [class.badge-closed]="fy.statut === 'CLOTURE'">
                  {{ fy.statut === 'OUVERT' ? 'Ouvert' : 'Clôturé' }}
                </span>
                @if (fy.closedAt) {
                  <span class="fy-date">Clôturé le {{ fy.closedAt | date:'dd/MM/yyyy' }}</span>
                } @else {
                  <span class="fy-date">Créé le {{ fy.createdAt | date:'dd/MM/yyyy' }}</span>
                }
              </div>
              <div class="fy-actions">
                <button class="btn-fec" (click)="exportFec(fy, 'txt')" [disabled]="exportingFec() === fy.id" title="Exporter le FEC (TXT — obligation DGFiP)">
                  <mat-icon>download</mat-icon> FEC
                </button>
                <button class="btn-fec btn-fec-xl" (click)="exportFec(fy, 'excel')" [disabled]="exportingFec() === fy.id" title="Exporter le FEC (Excel)">
                  <mat-icon>table_chart</mat-icon>
                </button>
                @if (fy.statut === 'OUVERT') {
                  <button class="btn-danger" (click)="confirmClose(fy)" [disabled]="saving()">
                    <mat-icon>lock</mat-icon> Clôturer
                  </button>
                }
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 24px; max-width: 800px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
    .page-title { margin: 0 0 4px; font-size: 1.5rem; font-weight: 600; color: #f1f5f9; }
    .page-sub { margin: 0; color: #94a3b8; font-size: 0.875rem; }
    .loading, .empty-state { text-align: center; padding: 48px; color: #94a3b8; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; display: block; margin: 0 auto 12px; opacity: 0.4; }

    .form-card {
      background: #1e2a3a; border: 1px solid #2d3f55; border-radius: 12px;
      padding: 20px; margin-bottom: 20px;
      h3 { margin: 0 0 16px; color: #f1f5f9; font-size: 1rem; }
    }
    .form-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .input-field {
      padding: 8px 12px; border-radius: 8px; border: 1px solid #2d3f55;
      background: #0d1b2a; color: #f1f5f9; font-size: 0.875rem; width: 160px;
      &:focus { outline: none; border-color: #3b82f6; }
    }

    .fy-list { display: flex; flex-direction: column; gap: 12px; }
    .fy-card {
      background: #1e2a3a; border: 1px solid #2d3f55; border-radius: 12px;
      padding: 16px 20px; display: flex; align-items: center; justify-content: space-between;
      &.fy-closed { opacity: 0.7; }
    }
    .fy-info { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
    .fy-year { font-size: 1.25rem; font-weight: 700; color: #f1f5f9; }
    .fy-date { color: #64748b; font-size: 0.8rem; }
    .fy-badge {
      padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;
      &.badge-open   { background: #dcfce7; color: #166534; }
      &.badge-closed { background: #f1f5f9; color: #475569; }
    }

    .btn-primary {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 18px; border-radius: 8px; border: none; cursor: pointer;
      background: #3b82f6; color: #fff; font-size: 0.875rem; font-weight: 500;
      &:hover:not(:disabled) { background: #2563eb; }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    .btn-secondary {
      padding: 8px 16px; border-radius: 8px; border: 1px solid #2d3f55;
      background: transparent; color: #94a3b8; cursor: pointer; font-size: 0.875rem;
      &:hover { background: #1e2a3a; }
    }
    .fy-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .btn-fec {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 7px 14px; border-radius: 8px; border: 1px solid #2d3f55; cursor: pointer;
      background: #1e2a3a; color: #60a5fa; font-size: 0.8rem; font-weight: 500;
      &:hover:not(:disabled) { background: #2d3f55; }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }
    .btn-fec-xl { padding: 7px 10px; }
    .btn-danger {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 7px 14px; border-radius: 8px; border: none; cursor: pointer;
      background: #fee2e2; color: #b91c1c; font-size: 0.875rem; font-weight: 500;
      &:hover:not(:disabled) { background: #fecaca; }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
  `]
})
export class FiscalYearsComponent implements OnInit {
  private readonly service  = inject(FiscalYearService);
  private readonly rapports = inject(RapportsService);
  private readonly alert    = inject(AlertService);
  private readonly dialog   = inject(MatDialog);

  fiscalYears  = signal<FiscalYear[]>([]);
  loading      = signal(true);
  saving       = signal(false);
  showForm     = signal(false);
  exportingFec = signal<number | null>(null);
  newYear      = new Date().getFullYear();

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.service.getAll().subscribe({
      next: list => { this.fiscalYears.set(list.sort((a, b) => b.annee - a.annee)); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  create(): void {
    if (!this.newYear || this.newYear < 2000) return;
    this.saving.set(true);
    this.service.create(this.newYear).subscribe({
      next: fy => {
        this.fiscalYears.update(list => [fy, ...list]);
        this.alert.success(`Exercice ${fy.annee} créé`);
        this.showForm.set(false);
        this.saving.set(false);
      },
      error: err => { this.alert.error(err?.error?.message ?? 'Erreur'); this.saving.set(false); },
    });
  }

  exportFec(fy: FiscalYear, format: 'txt' | 'excel'): void {
    this.exportingFec.set(fy.id);
    this.rapports.downloadFec(fy.id, format).subscribe({
      next: blob => {
        const ext = format === 'excel' ? 'xlsx' : 'txt';
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = `FEC_${fy.annee}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
        this.exportingFec.set(null);
      },
      error: () => {
        this.alert.error('Erreur lors de l\'export FEC');
        this.exportingFec.set(null);
      },
    });
  }

  confirmClose(fy: FiscalYear): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `Clôturer l'exercice ${fy.annee}`,
        message: `Cette opération est irréversible. Elle génère les écritures de clôture, le report à nouveau et verrouille toutes les périodes de ${fy.annee}. Continuer ?`,
      }
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.saving.set(true);
      this.service.close(fy.annee).subscribe({
        next: updated => {
          this.fiscalYears.update(list => list.map(f => f.id === updated.id ? updated : f));
          this.alert.success(`Exercice ${fy.annee} clôturé avec succès`);
          this.saving.set(false);
        },
        error: err => { this.alert.error(err?.error?.message ?? 'Erreur lors de la clôture'); this.saving.set(false); },
      });
    });
  }
}
