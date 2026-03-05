import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { AccountService } from '../../../core/services/account.service';
import { AlertService } from '../../../shared/components/alert/alert.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AccountFormComponent } from '../account-form/account-form.component';
import { Account } from '../../../core/models/account.model';
import { CentsPipe } from '../../../shared/pipes/cents.pipe';

const CLASS_META: Record<number, { name: string; bg: string; fg: string }> = {
  1: { name: 'Capitaux permanents', bg: '#e3f2fd', fg: '#1565c0' },
  2: { name: 'Immobilisations',     bg: '#e8f5e9', fg: '#2e7d32' },
  3: { name: 'Stocks',              bg: '#fff3e0', fg: '#bf360c' },
  4: { name: 'Tiers',               bg: '#fce4ec', fg: '#880e4f' },
  5: { name: 'Financiers',          bg: '#e0f7fa', fg: '#006064' },
  6: { name: 'Charges',             bg: '#fde8e8', fg: '#b71c1c' },
  7: { name: 'Produits',            bg: '#e8f5e9', fg: '#1b5e20' },
  8: { name: 'Résultats',           bg: '#f3e5f5', fg: '#4a148c' },
};

@Component({
  selector: 'app-account-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatButtonModule, MatIconModule, MatTableModule, MatTooltipModule,
    CentsPipe,
  ],
  template: `
    @if (account()) {
      <div class="page">

        <!-- ── Header ── -->
        <div class="page-header">
          <div class="header-left">
            <button class="btn-back" routerLink="/accounts" matTooltip="Retour aux comptes">
              <mat-icon>arrow_back</mat-icon>
            </button>
            <div>
              <h1 class="page-title">
                <span class="code-chip">{{ account()!.code }}</span>
                {{ account()!.name }}
              </h1>
              <p class="page-sub">
                <span class="class-badge"
                  [style.background]="classMeta.bg"
                  [style.color]="classMeta.fg">
                  {{ account()!.class }}
                </span>
                Classe {{ account()!.class }} — {{ classMeta.name }}
              </p>
            </div>
          </div>
          <div class="header-actions">
            <button class="btn-edit" (click)="openEdit()">
              <mat-icon>edit</mat-icon>
              Modifier
            </button>
            <button class="btn-delete" (click)="confirmDelete()">
              <mat-icon>delete</mat-icon>
              Supprimer
            </button>
          </div>
        </div>

        <!-- ── KPI du compte ── -->
        <div class="kpi-row">
          <div class="kpi-card">
            <div class="kpi-icon" [style.background]="classMeta.bg" [style.color]="classMeta.fg">
              <mat-icon>account_balance_wallet</mat-icon>
            </div>
            <div>
              <div class="kpi-value" [class.pos]="solde() > 0" [class.neg]="solde() < 0">
                {{ solde() | cents }}
              </div>
              <div class="kpi-label">Solde actuel</div>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon" style="background:#e8f5e9;color:#2e7d32">
              <mat-icon>arrow_upward</mat-icon>
            </div>
            <div>
              <div class="kpi-value pos">{{ totalDebit() | cents }}</div>
              <div class="kpi-label">Total débit</div>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon" style="background:#e3f2fd;color:#1565c0">
              <mat-icon>arrow_downward</mat-icon>
            </div>
            <div>
              <div class="kpi-value" style="color:#1565c0">{{ totalCredit() | cents }}</div>
              <div class="kpi-label">Total crédit</div>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon" style="background:#f3e5f5;color:#4a148c">
              <mat-icon>format_list_numbered</mat-icon>
            </div>
            <div>
              <div class="kpi-value">{{ account()!.journalLines?.length ?? 0 }}</div>
              <div class="kpi-label">Lignes de journal</div>
            </div>
          </div>
        </div>

        <!-- ── Tableau lignes de journal ── -->
        <div class="table-card">
          <div class="table-head-row">
            <div class="table-title">
              <mat-icon class="title-icon">receipt_long</mat-icon>
              <span>Lignes de journal</span>
            </div>
            @if ((account()!.journalLines?.length ?? 0) === 0) {
              <span class="empty-badge">Aucune écriture</span>
            }
          </div>
          <div class="table-wrap">
            <table mat-table [dataSource]="account()!.journalLines ?? []" class="lines-table">

              <ng-container matColumnDef="index">
                <th mat-header-cell *matHeaderCellDef>#</th>
                <td mat-cell *matCellDef="let l; let i = index">
                  <span class="row-num">{{ i + 1 }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="debit">
                <th mat-header-cell *matHeaderCellDef class="num">Débit</th>
                <td mat-cell *matCellDef="let l" class="num">
                  @if (l.debit > 0) {
                    <span class="amount pos">{{ l.debit | cents }}</span>
                  } @else {
                    <span class="amount zero">—</span>
                  }
                </td>
              </ng-container>

              <ng-container matColumnDef="credit">
                <th mat-header-cell *matHeaderCellDef class="num">Crédit</th>
                <td mat-cell *matCellDef="let l" class="num">
                  @if (l.credit > 0) {
                    <span class="amount" style="color:#1565c0;font-weight:700">{{ l.credit | cents }}</span>
                  } @else {
                    <span class="amount zero">—</span>
                  }
                </td>
              </ng-container>

              <ng-container matColumnDef="net">
                <th mat-header-cell *matHeaderCellDef class="num">Net</th>
                <td mat-cell *matCellDef="let l" class="num">
                  <span class="amount"
                    [class.pos]="(l.debit - l.credit) > 0"
                    [class.neg]="(l.debit - l.credit) < 0"
                    [class.zero]="(l.debit - l.credit) === 0">
                    {{ (l.debit - l.credit) | cents }}
                  </span>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="data-row"></tr>
              <tr mat-footer-row *matFooterRowDef="displayedColumns; sticky: true"></tr>

            </table>

            @if ((account()!.journalLines?.length ?? 0) === 0) {
              <div class="empty-state">
                <mat-icon>inbox</mat-icon>
                <p>Aucune écriture pour ce compte</p>
              </div>
            }
          </div>
        </div>

      </div>
    } @else {
      <div class="loading">
        <mat-icon>hourglass_empty</mat-icon>
        <p>Chargement…</p>
      </div>
    }
  `,
  styles: [`
    .page { display: flex; flex-direction: column; height: calc(100vh - 64px); gap: 16px; }

    /* ── Header ── */
    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      flex-wrap: wrap; gap: 12px; flex-shrink: 0;
    }
    .header-left { display: flex; align-items: flex-start; gap: 12px; }
    .page-title {
      font-size: 22px; font-weight: 800; color: #0d1b2a;
      margin: 0 0 4px; display: flex; align-items: center; gap: 8px;
    }
    .page-sub { font-size: 13px; color: #78909c; margin: 0; display: flex; align-items: center; gap: 6px; }

    .code-chip {
      padding: 2px 8px; background: #e8f0fe; color: #1a237e;
      border-radius: 6px; font-size: 14px; font-weight: 700; font-family: monospace;
    }
    .class-badge {
      display: inline-flex; align-items: center; justify-content: center;
      width: 20px; height: 20px; border-radius: 5px;
      font-size: 11px; font-weight: 800;
    }

    .btn-back {
      display: flex; align-items: center; justify-content: center;
      width: 38px; height: 38px; border: 1.5px solid #e8edf2;
      border-radius: 10px; background: white; cursor: pointer;
      color: #546e7a; transition: border-color .15s, color .15s;
      flex-shrink: 0; margin-top: 2px;
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
      &:hover { border-color: #90caf9; color: #1565c0; }
    }
    .header-actions { display: flex; gap: 8px; }
    .btn-edit {
      display: flex; align-items: center; gap: 6px;
      height: 38px; padding: 0 16px; border-radius: 10px; cursor: pointer;
      border: 1.5px solid #dde6f0; background: white; color: #1565c0;
      font-size: 13px; font-weight: 600;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover { background: #f0f7ff; border-color: #90caf9; }
    }
    .btn-delete {
      display: flex; align-items: center; gap: 6px;
      height: 38px; padding: 0 16px; border-radius: 10px; cursor: pointer;
      border: 1.5px solid #ffcdd2; background: #fff5f5; color: #c62828;
      font-size: 13px; font-weight: 600;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover { background: #fde8e8; }
    }

    /* ── KPIs ── */
    .kpi-row {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 12px; flex-shrink: 0;
    }
    .kpi-card {
      background: white; border-radius: 14px; padding: 16px 20px;
      display: flex; align-items: center; gap: 14px;
      box-shadow: 0 2px 8px rgba(13,27,42,.07);
    }
    .kpi-icon {
      width: 42px; height: 42px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 22px; width: 22px; height: 22px; }
    }
    .kpi-value { font-size: 18px; font-weight: 800; color: #0d1b2a; line-height: 1.1; }
    .kpi-value.pos { color: #2e7d32; }
    .kpi-value.neg { color: #c62828; }
    .kpi-label { font-size: 12px; color: #90a4ae; margin-top: 2px; }

    /* ── Table card ── */
    .table-card {
      background: white; border-radius: 16px;
      box-shadow: 0 2px 8px rgba(13,27,42,.07);
      overflow: hidden; flex: 1; min-height: 0; display: flex; flex-direction: column;
    }
    .table-head-row {
      display: flex; align-items: center; gap: 8px;
      padding: 16px 20px 12px; flex-shrink: 0;
      border-bottom: 1px solid #f0f4f8;
    }
    .table-title {
      display: flex; align-items: center; gap: 8px; flex: 1;
      font-size: 15px; font-weight: 700; color: #0d1b2a;
    }
    .title-icon { color: #1565c0; font-size: 20px; width: 20px; height: 20px; }
    .empty-badge {
      font-size: 12px; color: #90a4ae; background: #f5f7fa;
      padding: 3px 10px; border-radius: 20px;
    }

    .table-wrap { overflow-y: auto; flex: 1; min-height: 0; }
    .lines-table { width: 100%; }

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
    .mat-mdc-footer-row {
      background: #f0f4f8 !important;
      position: sticky; bottom: 0; z-index: 2;
      border-top: 2px solid #dde6f0 !important;
    }
    .mat-mdc-footer-cell {
      font-size: 13px !important; border-top: none !important; padding: 0 16px !important;
    }
    .mat-mdc-row {
      transition: background .1s;
      &:nth-child(even) { background: #fafbfc; }
      &:hover { background: #eef4fb !important; }
    }
    .mat-mdc-cell {
      font-size: 13px !important; color: #263238 !important;
      padding: 0 16px !important; border-bottom: 1px solid #f0f4f8 !important;
      height: 44px !important;
    }

    .row-num {
      display: inline-flex; align-items: center; justify-content: center;
      width: 22px; height: 22px; border-radius: 50%;
      background: #f0f4f8; color: #78909c; font-size: 11px; font-weight: 600;
    }
    .amount { font-variant-numeric: tabular-nums; font-weight: 700; }
    .amount.pos  { color: #2e7d32; }
    .amount.neg  { color: #c62828; }
    .amount.zero { color: #cfd8dc; font-weight: 400; }
    .num { text-align: right !important; }

    .empty-state {
      text-align: center; padding: 40px 24px; color: #90a4ae;
      display: flex; flex-direction: column; align-items: center; gap: 12px;
      mat-icon { font-size: 40px; width: 40px; height: 40px; opacity: .4; }
      p { margin: 0; font-size: 14px; }
    }

    .loading {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; height: 200px; color: #90a4ae; gap: 8px;
      mat-icon { font-size: 40px; width: 40px; height: 40px; }
    }
  `]
})
export class AccountDetailComponent implements OnInit {
  private readonly accountService = inject(AccountService);
  private readonly alertService   = inject(AlertService);
  private readonly dialog         = inject(MatDialog);
  private readonly route          = inject(ActivatedRoute);
  private readonly router         = inject(Router);

  account = signal<Account | null>(null);
  displayedColumns = ['index', 'debit', 'credit', 'net'];

  get classMeta() {
    const cls = this.account()?.class ?? 1;
    return CLASS_META[cls] ?? { name: '', bg: '#e3f2fd', fg: '#1565c0' };
  }

  solde = computed(() =>
    (this.account()?.journalLines ?? []).reduce((s, l) => s + l.debit - l.credit, 0)
  );
  totalDebit  = computed(() => (this.account()?.journalLines ?? []).reduce((s, l) => s + l.debit,  0));
  totalCredit = computed(() => (this.account()?.journalLines ?? []).reduce((s, l) => s + l.credit, 0));

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.accountService.getById(+id).subscribe(a => this.account.set(a));
    }
  }

  openEdit(): void {
    const ref = this.dialog.open(AccountFormComponent, {
      data: { account: this.account() },
      panelClass: 'volako-dialog',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
    ref.afterClosed().subscribe(saved => {
      if (saved) {
        const id = this.account()!.id;
        this.accountService.getById(id).subscribe(a => this.account.set(a));
      }
    });
  }

  confirmDelete(): void {
    const acc = this.account()!;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Supprimer le compte', message: `Supprimer "${acc.code} – ${acc.name}" ?` }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.accountService.delete(acc.id).subscribe({
          next: () => {
            this.alertService.success('Compte supprimé');
            this.router.navigate(['/accounts']);
          }
        });
      }
    });
  }
}
