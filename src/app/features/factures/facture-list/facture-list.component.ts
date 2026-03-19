import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FactureService } from '../../../core/services/facture.service';
import { AlertService } from '../../../shared/components/alert/alert.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { FactureFormComponent } from '../facture-form/facture-form.component';
import { Facture, FactureStatut } from '../../../core/models/facture.model';
import { CentsPipe } from '../../../shared/pipes/cents.pipe';

const STATUT_CONFIG: Record<FactureStatut, { label: string; color: string; bg: string; icon: string }> = {
  EN_ATTENTE:         { label: 'En attente',          color: '#e65100', bg: '#fff3e0', icon: 'schedule' },
  PARTIELLEMENT_PAYEE:{ label: 'Partiellement payée', color: '#1565c0', bg: '#e3f2fd', icon: 'payments' },
  PAYEE:              { label: 'Payée',                color: '#2e7d32', bg: '#e8f5e9', icon: 'check_circle' },
  ANNULEE:            { label: 'Annulée',              color: '#757575', bg: '#f5f5f5', icon: 'cancel' },
};

@Component({
  selector: 'app-facture-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatTooltipModule, CentsPipe],
  template: `
    <div class="page">

      <div class="page-header">
        <div class="page-title">
          <mat-icon class="title-icon">receipt_long</mat-icon>
          <div>
            <h1>Factures</h1>
            <p>{{ filtered().length }} facture(s)</p>
          </div>
        </div>
        <button mat-flat-button color="primary" (click)="openForm()">
          <mat-icon>add</mat-icon> Nouvelle facture
        </button>
      </div>

      <!-- KPIs -->
      <div class="kpi-row">
        <div class="kpi">
          <mat-icon style="color:#e65100">schedule</mat-icon>
          <div class="kpi-body">
            <span class="kpi-label">En attente</span>
            <span class="kpi-value">{{ totalByStatut('EN_ATTENTE') | cents }}</span>
            <span class="kpi-count">{{ countByStatut('EN_ATTENTE') }} facture(s)</span>
          </div>
        </div>
        <div class="kpi">
          <mat-icon style="color:#1565c0">payments</mat-icon>
          <div class="kpi-body">
            <span class="kpi-label">Partiellement payées</span>
            <span class="kpi-value">{{ totalByStatut('PARTIELLEMENT_PAYEE') | cents }}</span>
            <span class="kpi-count">{{ countByStatut('PARTIELLEMENT_PAYEE') }} facture(s)</span>
          </div>
        </div>
        <div class="kpi">
          <mat-icon style="color:#2e7d32">check_circle</mat-icon>
          <div class="kpi-body">
            <span class="kpi-label">Payées</span>
            <span class="kpi-value">{{ totalByStatut('PAYEE') | cents }}</span>
            <span class="kpi-count">{{ countByStatut('PAYEE') }} facture(s)</span>
          </div>
        </div>
      </div>

      <!-- Filtres statut -->
      <div class="filter-row">
        <button class="filter-chip" [class.active]="activeStatut() === null" (click)="activeStatut.set(null)">
          Toutes ({{ factures().length }})
        </button>
        @for (s of statuts; track s) {
          <button class="filter-chip" [class.active]="activeStatut() === s"
            [style.--chip-color]="cfg(s).color" [style.--chip-bg]="cfg(s).bg"
            (click)="activeStatut.set(s)">
            <mat-icon>{{ cfg(s).icon }}</mat-icon>
            {{ cfg(s).label }} ({{ countByStatut(s) }})
          </button>
        }
      </div>

      <!-- Table -->
      @if (loading()) {
        <div class="empty-state"><mat-icon class="spin">sync</mat-icon><p>Chargement…</p></div>
      } @else if (filtered().length === 0) {
        <div class="empty-state">
          <mat-icon>receipt_long</mat-icon>
          <p>Aucune facture</p>
          <button mat-stroked-button (click)="openForm()">Créer une facture</button>
        </div>
      } @else {
        <div class="table-wrap">
          <table class="factures-table">
            <thead>
              <tr>
                <th>N°</th>
                <th>Date</th>
                <th>Tiers</th>
                <th>Montant</th>
                <th>Payé</th>
                <th>Reste</th>
                <th>Statut</th>
                <th>Échéance</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (f of filtered(); track f.id) {
                <tr [class.row-retard]="isRetard(f)">
                  <td class="td-numero">{{ f.numero }}</td>
                  <td class="td-date">{{ f.date | date:'dd/MM/yyyy' }}</td>
                  <td class="td-tiers">
                    <span class="tiers-type" [class.type-client]="f.tiersType === 'CLIENT'" [class.type-fournisseur]="f.tiersType === 'FOURNISSEUR'">
                      {{ f.tiersType === 'CLIENT' ? 'C' : 'F' }}
                    </span>
                    {{ f.tiersNom }}
                  </td>
                  <td class="td-amount">{{ f.montant | cents }}</td>
                  <td class="td-paye" [class.full-paye]="f.montantPaye > 0">{{ f.montantPaye | cents }}</td>
                  <td class="td-reste" [class.reste-zero]="f.resteAPayer === 0">{{ f.resteAPayer | cents }}</td>
                  <td>
                    <span class="statut-badge"
                      [style.color]="cfg(f.statut).color"
                      [style.background]="cfg(f.statut).bg">
                      <mat-icon>{{ cfg(f.statut).icon }}</mat-icon>
                      {{ cfg(f.statut).label }}
                    </span>
                  </td>
                  <td class="td-echeance" [class.echeance-retard]="isRetard(f)">
                    {{ f.dateEcheance ? (f.dateEcheance | date:'dd/MM/yyyy') : '—' }}
                    @if (isRetard(f)) { <mat-icon class="warn-icon">warning</mat-icon> }
                  </td>
                  <td class="td-actions">
                    <a mat-icon-button [routerLink]="['/factures', f.id]" matTooltip="Détail / paiement">
                      <mat-icon>open_in_new</mat-icon>
                    </a>
                    <button mat-icon-button (click)="openForm(f)" matTooltip="Modifier">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button class="btn-delete" (click)="confirmDelete(f)" matTooltip="Supprimer">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 24px; }

    .page-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
    .page-title { display: flex; align-items: center; gap: 14px; }
    .title-icon { font-size: 32px; width: 32px; height: 32px; color: #1565c0; }
    h1 { margin: 0; font-size: 22px; font-weight: 700; color: #0d1b2a; }
    p  { margin: 2px 0 0; font-size: 13px; color: #78909c; }

    .kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .kpi {
      display: flex; align-items: center; gap: 14px;
      background: white; border-radius: 14px; padding: 16px 20px;
      box-shadow: 0 2px 8px rgba(13,27,42,.07);
      mat-icon { font-size: 28px; width: 28px; height: 28px; }
    }
    .kpi-body { display: flex; flex-direction: column; gap: 2px; }
    .kpi-label { font-size: 11px; color: #78909c; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; }
    .kpi-value { font-size: 18px; font-weight: 700; color: #0d1b2a; }
    .kpi-count { font-size: 11px; color: #90a4ae; }

    .filter-row { display: flex; gap: 8px; flex-wrap: wrap; }
    .filter-chip {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 6px 14px; border-radius: 20px; border: 1.5px solid #e0e7ef;
      background: white; font-size: 13px; font-weight: 500; cursor: pointer; color: #455a64;
      transition: all .15s;
      mat-icon { font-size: 15px; width: 15px; height: 15px; }
      &:hover { background: #f0f4f8; }
      &.active { background: var(--chip-bg, #e3f2fd); border-color: var(--chip-color, #1565c0); color: var(--chip-color, #1565c0); }
    }

    .table-wrap { background: white; border-radius: 14px; overflow: hidden; box-shadow: 0 2px 8px rgba(13,27,42,.07); }
    .factures-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead { background: #f8fbff; }
    th { padding: 12px 14px; text-align: left; font-size: 11px; font-weight: 700; color: #78909c; text-transform: uppercase; letter-spacing: .5px; border-bottom: 1px solid #e8edf2; white-space: nowrap; }
    td { padding: 12px 14px; border-bottom: 1px solid #f5f7fa; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #f8fbff; }
    tr.row-retard td { background: #fff8f5 !important; }

    .td-numero { font-weight: 700; color: #1565c0; }
    .td-date, .td-echeance { color: #546e7a; white-space: nowrap; }
    .td-tiers { display: flex; align-items: center; gap: 8px; font-weight: 500; }
    .tiers-type {
      width: 20px; height: 20px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 10px; font-weight: 800;
    }
    .type-client { background: #e3f2fd; color: #1565c0; }
    .type-fournisseur { background: #ffebee; color: #c62828; }
    .td-amount { font-weight: 600; }
    .td-paye { color: #78909c; }
    .full-paye { color: #2e7d32; }
    .td-reste { font-weight: 700; }
    .reste-zero { color: #2e7d32; }
    .statut-badge {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 3px 8px; border-radius: 8px; font-size: 11px; font-weight: 700;
      white-space: nowrap;
      mat-icon { font-size: 13px; width: 13px; height: 13px; }
    }
    .echeance-retard { color: #c62828; display: flex; align-items: center; gap: 4px; }
    .warn-icon { font-size: 15px; width: 15px; height: 15px; color: #e53935; }
    .td-actions { display: flex; gap: 2px; }
    .btn-delete mat-icon { color: #ef5350; }

    .empty-state {
      display: flex; flex-direction: column; align-items: center; gap: 12px;
      padding: 48px; color: #90a4ae; text-align: center;
      mat-icon { font-size: 48px; width: 48px; height: 48px; }
      p { margin: 0; font-size: 15px; }
      .spin { animation: spin 1s linear infinite; }
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 900px) {
      .kpi-row { grid-template-columns: 1fr; }
      .factures-table { font-size: 12px; }
      td, th { padding: 8px 10px; }
    }
  `],
})
export class FactureListComponent implements OnInit {
  private readonly factureService = inject(FactureService);
  private readonly alert = inject(AlertService);
  private readonly dialog = inject(MatDialog);

  factures = signal<Facture[]>([]);
  activeStatut = signal<FactureStatut | null>(null);
  loading = signal(true);

  readonly statuts: FactureStatut[] = ['EN_ATTENTE', 'PARTIELLEMENT_PAYEE', 'PAYEE', 'ANNULEE'];

  filtered = computed(() => {
    const s = this.activeStatut();
    return s ? this.factures().filter(f => f.statut === s) : this.factures();
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.factureService.getAll().subscribe({
      next: list => { this.factures.set(list); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  cfg(s: FactureStatut) { return STATUT_CONFIG[s]; }

  countByStatut(s: FactureStatut): number {
    return this.factures().filter(f => f.statut === s).length;
  }

  totalByStatut(s: FactureStatut): number {
    return this.factures().filter(f => f.statut === s).reduce((sum, f) => sum + f.montant, 0);
  }

  isRetard(f: Facture): boolean {
    if (!f.dateEcheance || f.statut === 'PAYEE' || f.statut === 'ANNULEE') return false;
    return new Date(f.dateEcheance) < new Date();
  }

  openForm(facture?: Facture): void {
    const ref = this.dialog.open(FactureFormComponent, { width: '560px', data: facture ?? null });
    ref.afterClosed().subscribe(saved => { if (saved) this.load(); });
  }

  confirmDelete(f: Facture): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { message: `Supprimer la facture "${f.numero}" ?` },
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.factureService.delete(f.id).subscribe({
        next: () => { this.alert.success('Facture supprimée'); this.load(); },
        error: () => this.alert.error('Erreur lors de la suppression'),
      });
    });
  }
}
