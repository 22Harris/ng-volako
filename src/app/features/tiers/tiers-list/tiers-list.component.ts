import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { TiersService } from '../../../core/services/tiers.service';
import { AlertService } from '../../../shared/components/alert/alert.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { TiersFormComponent } from '../tiers-form/tiers-form.component';
import { Tiers, TiersSolde, TiersType } from '../../../core/models/tiers.model';
import { CentsPipe } from '../../../shared/pipes/cents.pipe';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-tiers-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatChipsModule, MatTooltipModule, CentsPipe, PaginationComponent],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div class="page-title">
          <mat-icon class="title-icon">people</mat-icon>
          <div>
            <h1>Tiers</h1>
            <p>Clients &amp; fournisseurs — {{ filtered().length }} enregistrement(s)</p>
          </div>
        </div>
        <button mat-flat-button color="primary" class="btn-new" (click)="openForm()">
          <mat-icon>add</mat-icon> Nouveau tiers
        </button>
      </div>

      <!-- KPIs créances / dettes -->
      <div class="kpi-row">
        <div class="kpi kpi-client">
          <mat-icon>trending_up</mat-icon>
          <div class="kpi-body">
            <span class="kpi-label">Créances clients</span>
            <span class="kpi-value">{{ totalCreances() | cents }}</span>
          </div>
        </div>
        <div class="kpi kpi-fournisseur">
          <mat-icon>trending_down</mat-icon>
          <div class="kpi-body">
            <span class="kpi-label">Dettes fournisseurs</span>
            <span class="kpi-value">{{ totalDettes() | cents }}</span>
          </div>
        </div>
        <div class="kpi kpi-net">
          <mat-icon>account_balance</mat-icon>
          <div class="kpi-body">
            <span class="kpi-label">Position nette</span>
            <span class="kpi-value" [class.positive]="totalCreances() > totalDettes()" [class.negative]="totalCreances() < totalDettes()">
              {{ (totalCreances() - totalDettes()) | cents }}
            </span>
          </div>
        </div>
      </div>

      <!-- Filtres type -->
      <div class="filter-row">
        <button class="filter-chip" [class.active]="activeType() === null" (click)="activeType.set(null)">
          Tous ({{ tiers().length }})
        </button>
        <button class="filter-chip filter-client" [class.active]="activeType() === 'CLIENT'" (click)="activeType.set('CLIENT')">
          <mat-icon>person</mat-icon> Clients ({{ countByType('CLIENT') }})
        </button>
        <button class="filter-chip filter-fournisseur" [class.active]="activeType() === 'FOURNISSEUR'" (click)="activeType.set('FOURNISSEUR')">
          <mat-icon>store</mat-icon> Fournisseurs ({{ countByType('FOURNISSEUR') }})
        </button>
      </div>

      <!-- Liste -->
      @if (loading()) {
        <div class="empty-state"><mat-icon class="spin">sync</mat-icon><p>Chargement…</p></div>
      } @else if (filtered().length === 0) {
        <div class="empty-state">
          <mat-icon>people_outline</mat-icon>
          <p>Aucun tiers enregistré</p>
          <button mat-stroked-button (click)="openForm()">Créer un tiers</button>
        </div>
      } @else {
        <div class="tiers-grid">
          @for (t of filtered(); track t.id) {
            <div class="tiers-card">
              <div class="card-top">
                <div class="type-badge" [class.badge-client]="t.type === 'CLIENT'" [class.badge-fournisseur]="t.type === 'FOURNISSEUR'">
                  <mat-icon>{{ t.type === 'CLIENT' ? 'person' : 'store' }}</mat-icon>
                  {{ t.type === 'CLIENT' ? 'Client' : 'Fournisseur' }}
                </div>
                <div class="card-actions">
                  <button mat-icon-button (click)="openForm(t)" matTooltip="Modifier">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button class="btn-delete" (click)="confirmDelete(t)" matTooltip="Supprimer">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>

              <div class="card-nom">{{ t.nom }}</div>
              @if (t.siret) { <div class="card-siret">SIRET : {{ t.siret }}</div> }

              <div class="card-infos">
                @if (t.email) {
                  <span class="info-item"><mat-icon>email</mat-icon> {{ t.email }}</span>
                }
                @if (t.telephone) {
                  <span class="info-item"><mat-icon>phone</mat-icon> {{ t.telephone }}</span>
                }
                @if (t.accountCode) {
                  <span class="info-item account-info"><mat-icon>account_balance_wallet</mat-icon> {{ t.accountCode }} — {{ t.accountName }}</span>
                }
              </div>

              <!-- Solde -->
              @if (getSolde(t.id); as s) {
                <div class="card-solde" [class.solde-zero]="s.solde === 0">
                  <div class="solde-row">
                    <span class="solde-label">Facturé</span>
                    <span class="solde-val">{{ s.montantFacture | cents }}</span>
                  </div>
                  <div class="solde-row">
                    <span class="solde-label">Payé</span>
                    <span class="solde-val solde-paye">{{ s.montantPaye | cents }}</span>
                  </div>
                  <div class="solde-row solde-total">
                    <span class="solde-label">{{ t.type === 'CLIENT' ? 'Créance' : 'Dette' }}</span>
                    <span class="solde-val" [class.solde-positive]="s.solde > 0">{{ s.solde | cents }}</span>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      <app-pagination
        [page]="page()" [pageSize]="pageSize()" [total]="total()" [totalPages]="totalPages()"
        (pageChange)="load($event)" (pageSizeChange)="onPageSizeChange($event)"
      />
    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 24px; }

    .page-header {
      display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
    }
    .page-title { display: flex; align-items: center; gap: 14px; }
    .title-icon { font-size: 32px; width: 32px; height: 32px; color: #1565c0; }
    h1 { margin: 0; font-size: 22px; font-weight: 700; color: #0d1b2a; }
    p  { margin: 2px 0 0; font-size: 13px; color: #78909c; }

    .kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .kpi {
      display: flex; align-items: center; gap: 14px;
      background: white; border-radius: 14px; padding: 16px 20px;
      box-shadow: 0 2px 8px rgba(13,27,42,.07); border-left: 4px solid transparent;
      mat-icon { font-size: 28px; width: 28px; height: 28px; }
    }
    .kpi-client { border-color: #1565c0; mat-icon { color: #1565c0; } }
    .kpi-fournisseur { border-color: #e53935; mat-icon { color: #e53935; } }
    .kpi-net { border-color: #2e7d32; mat-icon { color: #2e7d32; } }
    .kpi-body { display: flex; flex-direction: column; gap: 2px; }
    .kpi-label { font-size: 12px; color: #78909c; font-weight: 500; text-transform: uppercase; letter-spacing: .5px; }
    .kpi-value { font-size: 20px; font-weight: 700; color: #0d1b2a; }
    .positive { color: #2e7d32 !important; }
    .negative { color: #c62828 !important; }

    .filter-row { display: flex; gap: 8px; flex-wrap: wrap; }
    .filter-chip {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 14px; border-radius: 20px; border: 1.5px solid #e0e7ef;
      background: white; font-size: 13px; font-weight: 500; cursor: pointer;
      color: #455a64; transition: all .15s;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &:hover { background: #f0f4f8; }
      &.active { background: #e3f2fd; border-color: #1565c0; color: #1565c0; }
    }
    .filter-client.active { background: #e3f2fd; border-color: #1565c0; color: #1565c0; }
    .filter-fournisseur.active { background: #ffebee; border-color: #c62828; color: #c62828; }

    .tiers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }

    .tiers-card {
      background: white; border-radius: 14px; padding: 18px;
      box-shadow: 0 2px 8px rgba(13,27,42,.07);
      transition: box-shadow .15s;
      &:hover { box-shadow: 0 4px 16px rgba(13,27,42,.12); }
    }
    .card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .type-badge {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 4px 10px; border-radius: 10px; font-size: 11px; font-weight: 700; text-transform: uppercase;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }
    .badge-client { background: #e3f2fd; color: #1565c0; }
    .badge-fournisseur { background: #ffebee; color: #c62828; }
    .card-actions { display: flex; }
    .btn-delete mat-icon { color: #ef5350; }

    .card-nom { font-size: 16px; font-weight: 700; color: #0d1b2a; margin-bottom: 4px; }
    .card-siret { font-size: 12px; color: #90a4ae; margin-bottom: 10px; }

    .card-infos { display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px; }
    .info-item {
      display: flex; align-items: center; gap: 6px;
      font-size: 12px; color: #546e7a;
      mat-icon { font-size: 14px; width: 14px; height: 14px; color: #90a4ae; }
    }
    .account-info { font-weight: 500; color: #1565c0; mat-icon { color: #1565c0; } }

    .card-solde {
      background: #f8fbff; border-radius: 10px; padding: 10px 12px;
      border: 1px solid #e3f2fd; display: flex; flex-direction: column; gap: 4px;
      &.solde-zero { background: #f5f5f5; border-color: #e0e0e0; }
    }
    .solde-row { display: flex; justify-content: space-between; align-items: center; }
    .solde-label { font-size: 11px; color: #78909c; }
    .solde-val { font-size: 12px; font-weight: 600; color: #0d1b2a; }
    .solde-paye { color: #2e7d32; }
    .solde-total { border-top: 1px solid #e3f2fd; margin-top: 4px; padding-top: 4px; }
    .solde-total .solde-label { font-weight: 700; color: #455a64; font-size: 12px; }
    .solde-positive { color: #c62828; }

    .empty-state {
      display: flex; flex-direction: column; align-items: center; gap: 12px;
      padding: 48px; color: #90a4ae; text-align: center;
      mat-icon { font-size: 48px; width: 48px; height: 48px; }
      p { margin: 0; font-size: 15px; }
      .spin { animation: spin 1s linear infinite; }
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 768px) {
      .kpi-row { grid-template-columns: 1fr; }
    }
  `],
})
export class TiersListComponent implements OnInit {
  private readonly tiersService = inject(TiersService);
  private readonly alert = inject(AlertService);
  private readonly dialog = inject(MatDialog);

  tiers = signal<Tiers[]>([]);
  soldes = signal<TiersSolde[]>([]);
  activeType = signal<TiersType | null>(null);
  loading = signal(true);

  page      = signal(1);
  pageSize  = signal(50);
  total     = signal(0);
  totalPages = signal(0);

  filtered = computed(() => {
    const t = this.activeType();
    return t ? this.tiers().filter(x => x.type === t) : this.tiers();
  });

  totalCreances = computed(() =>
    this.soldes().filter(s => s.type === 'CLIENT').reduce((sum, s) => sum + s.solde, 0)
  );
  totalDettes = computed(() =>
    this.soldes().filter(s => s.type === 'FOURNISSEUR').reduce((sum, s) => sum + s.solde, 0)
  );

  ngOnInit(): void { this.load(1); }

  load(p: number): void {
    this.page.set(p);
    this.loading.set(true);
    this.tiersService.getAll(p, this.pageSize()).subscribe({
      next: res => {
        this.tiers.set(res.data);
        this.total.set(res.total);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.tiersService.getSoldes().subscribe({ next: s => this.soldes.set(s), error: () => {} });
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.load(1);
  }

  countByType(type: TiersType): number {
    return this.tiers().filter(t => t.type === type).length;
  }

  getSolde(tiersId: number): TiersSolde | undefined {
    return this.soldes().find(s => s.tiersId === tiersId);
  }

  openForm(tiers?: Tiers): void {
    const ref = this.dialog.open(TiersFormComponent, {
      width: '560px',
      maxWidth: '95vw',
      panelClass: 'no-padding-dialog',
      data: tiers ?? null,
    });
    ref.afterClosed().subscribe(saved => { if (saved) this.load(this.page()); });
  }

  confirmDelete(tiers: Tiers): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { message: `Supprimer le tiers "${tiers.nom}" ?` },
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.tiersService.delete(tiers.id).subscribe({
        next: () => { this.alert.success('Tiers supprimé'); this.load(this.page()); },
        error: () => this.alert.error('Erreur lors de la suppression'),
      });
    });
  }
}
