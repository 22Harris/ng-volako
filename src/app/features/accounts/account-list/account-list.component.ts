import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { AccountService } from '../../../core/services/account.service';
import { AlertService } from '../../../shared/components/alert/alert.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AccountFormComponent } from '../account-form/account-form.component';
import { Account } from '../../../core/models/account.model';
import { CentsPipe } from '../../../shared/pipes/cents.pipe';

const CLASS_LABELS: Record<number, string> = {
  1: 'Capitaux permanents', 2: 'Immobilisations', 3: 'Stocks',
  4: 'Tiers', 5: 'Financiers', 6: 'Charges', 7: 'Produits', 8: 'Résultats',
};

@Component({
  selector: 'app-account-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatTooltipModule, CentsPipe,
  ],
  template: `
    <div class="page">

      <!-- ── Header ── -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Comptes</h1>
          <p class="page-sub">{{ filteredAccounts().length }} compte(s) · Plan comptable</p>
        </div>
        <button class="btn-new" (click)="openDialog()">
          <mat-icon>add</mat-icon>
          Nouveau compte
        </button>
      </div>

      <!-- ── Filtres ── -->
      <div class="filters-card">
        <form [formGroup]="filterForm" class="filters">

          <div class="filter-group">
            <mat-icon class="filter-icon">manage_search</mat-icon>
            <input class="filter-input" type="text" placeholder="Rechercher code ou nom…"
              formControlName="search" (input)="applyFilters()" />
          </div>

          <div class="filter-group">
            <mat-icon class="filter-icon">account_tree</mat-icon>
            <select class="filter-select" formControlName="cls" (change)="applyFilters()">
              <option [ngValue]="null">Toutes les classes</option>
              @for (cls of [1,2,3,4,5,6,7,8]; track cls) {
                <option [ngValue]="cls">Classe {{ cls }} — {{ classLabels[cls] }}</option>
              }
            </select>
          </div>

          <div class="filter-group">
            <mat-icon class="filter-icon">swap_vert</mat-icon>
            <select class="filter-select narrow" formControlName="solde" (change)="applyFilters()">
              <option value="tous">Tous les soldes</option>
              <option value="positif">Solde positif</option>
              <option value="negatif">Solde négatif</option>
              <option value="zero">Solde nul</option>
            </select>
          </div>

          @if (hasActiveFilters()) {
            <button class="btn-reset" type="button" (click)="resetFilters()"
              matTooltip="Effacer les filtres">
              <mat-icon>filter_alt_off</mat-icon>
              Effacer
            </button>
          }

        </form>
      </div>

      <!-- ── Tableau ── -->
      <div class="table-card">
        <div class="table-wrap">
          <table mat-table [dataSource]="filteredAccounts()" class="accounts-table">

            <ng-container matColumnDef="code">
              <th mat-header-cell *matHeaderCellDef>Code</th>
              <td mat-cell *matCellDef="let a">
                <span class="code-chip">{{ a.code }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Nom</th>
              <td mat-cell *matCellDef="let a">
                <a [routerLink]="['/accounts', a.id]" class="entry-link">{{ a.name }}</a>
              </td>
            </ng-container>

            <ng-container matColumnDef="class">
              <th mat-header-cell *matHeaderCellDef>Classe</th>
              <td mat-cell *matCellDef="let a">
                <span class="class-badge cls-{{ a.class }}">{{ a.class }}</span>
                <span class="class-name">{{ classLabels[a.class] }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="balance">
              <th mat-header-cell *matHeaderCellDef class="num">Solde</th>
              <td mat-cell *matCellDef="let a" class="num">
                <span class="amount"
                  [class.pos]="getBalance(a) > 0"
                  [class.neg]="getBalance(a) < 0"
                  [class.zero]="getBalance(a) === 0">
                  {{ getBalance(a) | cents }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="lines">
              <th mat-header-cell *matHeaderCellDef class="num">Lignes</th>
              <td mat-cell *matCellDef="let a" class="num">
                <span class="count-chip">{{ a.journalLines?.length ?? 0 }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="actions-col">Actions</th>
              <td mat-cell *matCellDef="let a" class="actions-col">
                <button mat-icon-button [routerLink]="['/accounts', a.id]"
                  matTooltip="Voir" class="action-btn">
                  <mat-icon>visibility</mat-icon>
                </button>
                <button mat-icon-button matTooltip="Modifier"
                  class="action-btn edit" (click)="$event.stopPropagation(); openDialog(a)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button matTooltip="Supprimer"
                  class="action-btn del" (click)="$event.stopPropagation(); confirmDelete(a)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"
              class="data-row" [routerLink]="['/accounts', row.id]"></tr>

          </table>

          @if (filteredAccounts().length === 0) {
            <div class="empty-state">
              <mat-icon>search_off</mat-icon>
              <p>Aucun compte ne correspond aux filtres</p>
              @if (hasActiveFilters()) {
                <button class="btn-reset" type="button" (click)="resetFilters()">
                  <mat-icon>filter_alt_off</mat-icon> Effacer les filtres
                </button>
              }
            </div>
          }
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
    .page { display: flex; flex-direction: column; flex: 1; min-height: 0; gap: 16px; }

    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      flex-wrap: wrap; gap: 12px; flex-shrink: 0;
    }
    .page-title { font-size: 26px; font-weight: 800; color: #0d1b2a; margin: 0 0 4px; }
    .page-sub   { font-size: 13px; color: #78909c; margin: 0; }

    .btn-new {
      display: flex; align-items: center; gap: 8px;
      height: 44px; padding: 0 22px; border: none; border-radius: 12px; cursor: pointer;
      background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
      color: white; font-size: 14px; font-weight: 700; letter-spacing: .3px;
      box-shadow: 0 4px 14px rgba(21,101,192,.45), inset 0 1px 0 rgba(255,255,255,.15);
      transition: box-shadow .2s, transform .15s;
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
      &:hover { box-shadow: 0 8px 24px rgba(21,101,192,.6); transform: translateY(-1px); }
      &:active { transform: translateY(0); }
    }

    .filters-card {
      background: white; border-radius: 16px;
      box-shadow: 0 2px 8px rgba(13,27,42,.07);
      padding: 16px 20px; flex-shrink: 0;
    }
    .filters { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }

    .filter-group {
      display: flex; align-items: center; gap: 6px;
      background: #f5f7fa; border: 1.5px solid #e8edf2;
      border-radius: 10px; padding: 0 10px; height: 38px;
      transition: border-color .15s;
      &:focus-within { border-color: #90caf9; background: #f0f7ff; }
    }
    .filter-icon { font-size: 16px; width: 16px; height: 16px; color: #90a4ae; flex-shrink: 0; }
    .filter-input {
      border: none; background: transparent; outline: none;
      font-size: 13px; color: #0d1b2a; min-width: 0; width: 190px;
      &::placeholder { color: #b0bec5; }
    }
    .filter-select { border: none; background: transparent; outline: none; font-size: 13px; color: #0d1b2a; cursor: pointer; width: 210px; }
    .filter-select.narrow { width: 150px; }

    .btn-reset {
      display: flex; align-items: center; gap: 6px;
      height: 38px; padding: 0 14px; border-radius: 10px; cursor: pointer;
      border: 1.5px solid #ffcdd2; background: #fff5f5;
      color: #c62828; font-size: 13px; font-weight: 600;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &:hover { background: #fde8e8; }
    }

    .table-card {
      background: white; border-radius: 16px;
      box-shadow: 0 2px 8px rgba(13,27,42,.07);
      overflow: hidden; flex: 1; min-height: 0; display: flex; flex-direction: column;
    }
    .table-wrap { overflow-y: auto; flex: 1; min-height: 0; }
    .accounts-table { width: 100%; }

    .mat-mdc-header-row {
      background: #f1f5f9 !important;
      position: sticky; top: 0; z-index: 3;
      border-bottom: 2px solid #dde6f0 !important;
    }
    .mat-mdc-header-cell {
      color: #475569 !important;
      font-size: 11px !important; font-weight: 700 !important;
      letter-spacing: .6px !important; text-transform: uppercase !important;
      border-bottom: none !important; padding: 0 16px !important; white-space: nowrap;
    }
    .mat-mdc-row {
      cursor: pointer; transition: background .1s;
      &:nth-child(even) { background: #fafbfc; }
      &:hover { background: #eef4fb !important; }
    }
    .mat-mdc-cell {
      font-size: 13px !important; color: #263238 !important;
      padding: 0 16px !important; border-bottom: 1px solid #f0f4f8 !important;
      height: 46px !important;
    }

    .code-chip {
      display: inline-block; padding: 2px 8px;
      background: #e8f0fe; color: #1a237e;
      border-radius: 6px; font-size: 12px; font-weight: 700; font-family: monospace;
    }
    .entry-link { color: #1565c0; text-decoration: none; font-weight: 500; &:hover { text-decoration: underline; } }

    .class-badge {
      display: inline-flex; align-items: center; justify-content: center;
      width: 22px; height: 22px; border-radius: 6px;
      font-size: 11px; font-weight: 800; margin-right: 6px;
    }
    .cls-1 { background: #e3f2fd; color: #1565c0; }
    .cls-2 { background: #e8f5e9; color: #2e7d32; }
    .cls-3 { background: #fff3e0; color: #bf360c; }
    .cls-4 { background: #fce4ec; color: #880e4f; }
    .cls-5 { background: #e0f7fa; color: #006064; }
    .cls-6 { background: #fde8e8; color: #b71c1c; }
    .cls-7 { background: #e8f5e9; color: #1b5e20; }
    .cls-8 { background: #f3e5f5; color: #4a148c; }
    .class-name { font-size: 12px; color: #78909c; }

    .amount { font-variant-numeric: tabular-nums; font-weight: 700; }
    .amount.pos  { color: #2e7d32; }
    .amount.neg  { color: #c62828; }
    .amount.zero { color: #b0bec5; }

    .count-chip {
      display: inline-flex; align-items: center; justify-content: center;
      width: 24px; height: 24px; border-radius: 50%;
      background: #e8f0fe; color: #1a237e; font-size: 12px; font-weight: 700;
    }

    .num { text-align: right !important; }
    .actions-col { text-align: right !important; white-space: nowrap; }
    .action-btn  { opacity: .55; transition: opacity .15s; &:hover { opacity: 1; } }
    .action-btn.edit { color: #1565c0 !important; }
    .action-btn.del  { color: #c62828 !important; }

    .empty-state {
      text-align: center; padding: 48px 24px; color: #90a4ae;
      display: flex; flex-direction: column; align-items: center; gap: 12px;
      mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: .4; }
      p { margin: 0; font-size: 14px; }
    }
  `]
})
export class AccountListComponent implements OnInit {
  private readonly accountService = inject(AccountService);
  private readonly alertService   = inject(AlertService);
  private readonly dialog         = inject(MatDialog);
  private readonly fb             = inject(FormBuilder);

  accounts  = signal<Account[]>([]);
  classLabels = CLASS_LABELS;
  displayedColumns = ['code', 'name', 'class', 'balance', 'lines', 'actions'];

  filterForm = this.fb.group({
    search: [''],
    cls:    [null as number | null],
    solde:  ['tous'],
  });

  filterValues = toSignal(this.filterForm.valueChanges, { initialValue: this.filterForm.value });

  filteredAccounts = computed(() => {
    const f     = this.filterValues();
    const term  = (f.search ?? '').toLowerCase().trim();
    return this.accounts().filter(a => {
      if (f.cls && a.class !== f.cls) return false;
      if (term && !a.code.toLowerCase().includes(term) && !a.name.toLowerCase().includes(term)) return false;
      if (f.solde !== 'tous') {
        const bal = this.getBalance(a);
        if (f.solde === 'positif' && bal <= 0) return false;
        if (f.solde === 'negatif' && bal >= 0) return false;
        if (f.solde === 'zero'    && bal !== 0) return false;
      }
      return true;
    });
  });

  hasActiveFilters = computed(() => {
    const f = this.filterValues();
    return !!(f.search || f.cls || f.solde !== 'tous');
  });

  ngOnInit(): void {
    this.accountService.getAll().subscribe(list => this.accounts.set(list));
  }

  applyFilters(): void { /* réactif via computed */ }

  resetFilters(): void {
    this.filterForm.reset({ search: '', cls: null, solde: 'tous' });
  }

  getBalance(account: Account): number {
    return (account.journalLines ?? []).reduce((s, l) => s + l.debit - l.credit, 0);
  }

  openDialog(account?: Account): void {
    const ref = this.dialog.open(AccountFormComponent, {
      data: { account },
      panelClass: 'volako-dialog',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
    ref.afterClosed().subscribe(saved => {
      if (saved) {
        this.accountService.getAll().subscribe(list => this.accounts.set(list));
      }
    });
  }

  confirmDelete(account: Account): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Supprimer le compte', message: `Supprimer le compte "${account.code} – ${account.name}" ?` }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.accountService.delete(account.id).subscribe({
          next: () => { this.alertService.success('Compte supprimé'); this.accountService.getAll().subscribe(l => this.accounts.set(l)); },
          error: () => this.alertService.error('Erreur lors de la suppression'),
        });
      }
    });
  }
}
