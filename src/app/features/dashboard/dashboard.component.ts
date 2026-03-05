import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { AccountService } from '../../core/services/account.service';
import { OperationService } from '../../core/services/operation.service';
import { AccountFormComponent } from '../accounts/account-form/account-form.component';
import { OperationFormComponent } from '../operations/operation-form/operation-form.component';
import { Account } from '../../core/models/account.model';
import { Operation } from '../../core/models/operation.model';
import { CentsPipe } from '../../shared/pipes/cents.pipe';
import { OperationTypePipe } from '../../shared/pipes/operation-type.pipe';
import { OPERATION_TYPE_CONFIG } from '../../core/utils/operation-type.utils';

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
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    CentsPipe,
    OperationTypePipe,
    DatePipe,
  ],
  template: `
    <div class="dash">

      <!-- ── Page Header ── -->
      <div class="dash-header">
        <div>
          <h1 class="dash-title">Tableau de bord</h1>
          <p class="dash-date">{{ today | date:'dd/MM/yyyy' }}</p>
        </div>
        <button mat-flat-button class="header-btn" (click)="openOperationDialog()">
          <mat-icon>add</mat-icon>
          Nouvelle opération
        </button>
      </div>

      <!-- ── KPI Cards ── -->
      <div class="kpi-row">

        <div class="kpi-card kpi-blue">
          <div class="kpi-icon-wrap">
            <mat-icon>account_balance</mat-icon>
          </div>
          <div class="kpi-body">
            <div class="kpi-value">{{ totalActif() | cents }}</div>
            <div class="kpi-label">Total Actif</div>
            <div class="kpi-sub">Classes 1 · 2 · 5</div>
          </div>
        </div>

        <div class="kpi-card kpi-amber">
          <div class="kpi-icon-wrap">
            <mat-icon>receipt_long</mat-icon>
          </div>
          <div class="kpi-body">
            <div class="kpi-value">{{ totalPassif() | cents }}</div>
            <div class="kpi-label">Total Passif</div>
            <div class="kpi-sub">Classes 1 · 3 · 4</div>
          </div>
        </div>

        <div class="kpi-card" [class.kpi-green]="resultatNet() >= 0" [class.kpi-red]="resultatNet() < 0">
          <div class="kpi-icon-wrap">
            <mat-icon>{{ resultatNet() >= 0 ? 'trending_up' : 'trending_down' }}</mat-icon>
          </div>
          <div class="kpi-body">
            <div class="kpi-value">{{ resultatNet() | cents }}</div>
            <div class="kpi-label">Résultat net</div>
            <div class="kpi-sub">Produits − Charges</div>
          </div>
        </div>

        <div class="kpi-card kpi-teal">
          <div class="kpi-icon-wrap">
            <mat-icon>folder_special</mat-icon>
          </div>
          <div class="kpi-body">
            <div class="kpi-value">{{ accounts().length }}</div>
            <div class="kpi-label">Comptes actifs</div>
            <div class="kpi-sub">Plan comptable</div>
          </div>
        </div>

      </div>

      <!-- ── Main Grid (3 colonnes) ── -->
      <div class="dash-grid">

        <!-- Soldes par classe -->
        <div class="card">
          <div class="card-header">
            <mat-icon class="header-icon">pie_chart</mat-icon>
            <h2>Soldes par classe</h2>
          </div>
          <div class="class-grid">
            @for (cls of classItems; track cls.num) {
              <div class="class-item">
                <div class="class-badge" [style.background]="cls.bg" [style.color]="cls.fg">
                  {{ cls.num }}
                </div>
                <div class="class-body">
                  <div class="class-name">{{ cls.name }}</div>
                  <div class="class-balance"
                    [class.positive]="getBalanceByClass(cls.num) >= 0"
                    [class.negative]="getBalanceByClass(cls.num) < 0">
                    {{ getBalanceByClass(cls.num) | cents }}
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Dernières opérations -->
        <div class="card">
          <div class="card-header">
            <mat-icon class="header-icon">history</mat-icon>
            <h2>Dernières opérations</h2>
            <a routerLink="/operations" class="see-all">Voir tout →</a>
          </div>

          @if (lastOperations().length === 0) {
            <div class="empty-state">
              <mat-icon>inbox</mat-icon>
              <p>Aucune opération pour le moment</p>
              <button mat-stroked-button (click)="openOperationDialog()">Créer une opération</button>
            </div>
          } @else {
            <div class="op-list">
              @for (op of lastOperations(); track op.id) {
                <a class="op-row" [routerLink]="['/operations', op.id]">
                  <div class="op-dot" [ngClass]="getColorClass(op.type)"></div>
                  <div class="op-info">
                    <span class="op-label">{{ op.label }}</span>
                    <span class="op-badge badge" [ngClass]="getColorClass(op.type)">
                      {{ op.type | operationType }}
                    </span>
                  </div>
                  <span class="op-date">{{ op.date | date:'dd/MM/yy' }}</span>
                </a>
              }
            </div>
          }
        </div>

        <!-- Répartition des soldes — graphique barres horizontales -->
        <div class="card">
          <div class="card-header">
            <mat-icon class="header-icon">bar_chart</mat-icon>
            <h2>Répartition des soldes</h2>
          </div>

          <div class="balance-chart">
            @for (item of balanceChartData; track item.num) {
              <div class="bc-row">
                <div class="bc-meta">
                  <span class="bc-badge" [style.background]="item.bg" [style.color]="item.fg">
                    {{ item.num }}
                  </span>
                  <span class="bc-name">{{ item.name }}</span>
                </div>
                <div class="bc-track">
                  <div class="bc-bar"
                    [style.width.%]="item.pct"
                    [style.background]="item.balance >= 0 ? item.fg : '#ef5350'">
                  </div>
                </div>
                <span class="bc-val" [class.bc-neg]="item.balance < 0">
                  {{ item.balance | cents }}
                </span>
              </div>
            }
          </div>

          <!-- Légende -->
          <div class="bc-legend">
            <span class="bc-leg-item bc-leg-pos">
              <span class="bc-leg-dot"></span>Positif
            </span>
            <span class="bc-leg-item bc-leg-neg">
              <span class="bc-leg-dot"></span>Négatif
            </span>
          </div>
        </div>

      </div>

      <!-- ── Quick Actions ── -->
      <div class="quick-section">
        <h3 class="quick-title">Actions rapides</h3>
        <div class="quick-row">

          <button mat-stroked-button class="quick-btn" (click)="openOperationDialog()">
            <div class="quick-icon blue-icon">
              <mat-icon>add_circle_outline</mat-icon>
            </div>
            <div>
              <div class="quick-label">Nouvelle opération</div>
              <div class="quick-sub">Saisir une entrée</div>
            </div>
          </button>

          <button mat-stroked-button class="quick-btn" (click)="openAccountDialog()">
            <div class="quick-icon green-icon">
              <mat-icon>add_card</mat-icon>
            </div>
            <div>
              <div class="quick-label">Nouveau compte</div>
              <div class="quick-sub">Plan comptable</div>
            </div>
          </button>

          <button mat-stroked-button routerLink="/accounts" class="quick-btn">
            <div class="quick-icon teal-icon">
              <mat-icon>account_tree</mat-icon>
            </div>
            <div>
              <div class="quick-label">Plan comptable</div>
              <div class="quick-sub">Tous les comptes</div>
            </div>
          </button>

          <button mat-stroked-button routerLink="/journal" class="quick-btn">
            <div class="quick-icon amber-icon">
              <mat-icon>menu_book</mat-icon>
            </div>
            <div>
              <div class="quick-label">Grand livre</div>
              <div class="quick-sub">Voir le journal</div>
            </div>
          </button>

        </div>
      </div>

    </div>
  `,
  styles: [`
    .dash { width: 100%; }

    /* ── Header ── */
    .dash-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 28px; flex-wrap: wrap; gap: 12px;
    }
    .dash-title { font-size: 26px; font-weight: 800; color: #0d1b2a; margin: 0 0 4px; }
    .dash-date  { color: #78909c; margin: 0; font-size: 13px; }

    .header-btn {
      height: 44px !important;
      padding: 0 22px !important;
      border-radius: 12px !important;
      background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%) !important;
      color: white !important;
      font-weight: 700 !important;
      font-size: 14px !important;
      letter-spacing: .3px !important;
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      box-shadow: 0 4px 14px rgba(21,101,192,.45), inset 0 1px 0 rgba(255,255,255,.15) !important;
      transition: box-shadow .2s, transform .15s !important;
      mat-icon { font-size: 20px !important; width: 20px !important; height: 20px !important; }
      &:hover {
        box-shadow: 0 8px 24px rgba(21,101,192,.6), inset 0 1px 0 rgba(255,255,255,.15) !important;
        transform: translateY(-1px) !important;
      }
      &:active { transform: translateY(0) !important; }
    }

    /* ── KPI ── */
    .kpi-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px,1fr)); gap: 16px; margin-bottom: 24px; }
    .kpi-card {
      background: white; border-radius: 16px; padding: 20px;
      display: flex; align-items: center; gap: 16px;
      box-shadow: 0 2px 8px rgba(13,27,42,.07);
      border-left: 4px solid transparent;
      transition: box-shadow .15s;
      &:hover { box-shadow: 0 4px 16px rgba(13,27,42,.12); }
    }
    .kpi-blue  { border-left-color:#1565c0; .kpi-icon-wrap{background:#e3f2fd;color:#1565c0} }
    .kpi-amber { border-left-color:#f9a825; .kpi-icon-wrap{background:#fff8e1;color:#f57f17} }
    .kpi-green { border-left-color:#2e7d32; .kpi-icon-wrap{background:#e8f5e9;color:#2e7d32} }
    .kpi-red   { border-left-color:#c62828; .kpi-icon-wrap{background:#fde8e8;color:#c62828} }
    .kpi-teal  { border-left-color:#00897b; .kpi-icon-wrap{background:#e0f7f4;color:#004d40} }
    .kpi-icon-wrap {
      width:48px; height:48px; border-radius:12px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center;
      mat-icon { font-size:24px; width:24px; height:24px; }
    }
    .kpi-body  { min-width:0; }
    .kpi-value { font-size:22px; font-weight:800; color:#0d1b2a; line-height:1.1; }
    .kpi-label { font-size:13px; font-weight:600; color:#546e7a; margin-top:2px; }
    .kpi-sub   { font-size:11px; color:#90a4ae; }

    /* ── Cards ── */
    .card { background:white; border-radius:16px; padding:24px; box-shadow:0 2px 8px rgba(13,27,42,.07); }
    .card-header {
      display:flex; align-items:center; gap:8px; margin-bottom:20px;
      h2 { font-size:15px; font-weight:700; color:#0d1b2a; margin:0; flex:1; }
    }
    .header-icon { color:#1565c0; font-size:20px; width:20px; height:20px; }
    .see-all { font-size:13px; color:#1565c0; text-decoration:none; font-weight:600; &:hover{text-decoration:underline;} }

    /* ── Grid 3 colonnes ── */
    .dash-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:20px; margin-bottom:24px; }

    /* ── Soldes par classe ── */
    .class-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .class-item { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:10px; background:#f8fafc; border:1px solid #e8edf2; }
    .class-badge { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:800; flex-shrink:0; }
    .class-body  { min-width:0; }
    .class-name  { font-size:11px; color:#78909c; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .class-balance { font-size:13px; font-weight:700; &.positive{color:#2e7d32} &.negative{color:#c62828} }

    /* ── Opérations ── */
    .op-list { display:flex; flex-direction:column; gap:4px; }
    .op-row  { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:10px; text-decoration:none; color:inherit; transition:background .12s; &:hover{background:#f5f7fa} }
    .op-dot  { width:8px; height:8px; border-radius:50%; background:#b0bec5; flex-shrink:0; }
    .op-info { flex:1; min-width:0; display:flex; align-items:center; gap:8px; }
    .op-label{ font-size:13px; font-weight:500; color:#0d1b2a; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .op-badge{ font-size:11px; flex-shrink:0; }
    .op-date { font-size:12px; color:#90a4ae; flex-shrink:0; }

    .empty-state {
      text-align:center; padding:32px 16px; color:#90a4ae;
      mat-icon { font-size:40px; width:40px; height:40px; margin-bottom:8px; }
      p { margin:0 0 16px; font-size:14px; }
    }

    /* ── Graphique barres ── */
    .balance-chart { display:flex; flex-direction:column; gap:9px; }
    .bc-row {
      display:grid;
      grid-template-columns: 110px 1fr 88px;
      align-items:center; gap:8px;
    }
    .bc-meta { display:flex; align-items:center; gap:6px; min-width:0; }
    .bc-badge {
      width:22px; height:22px; border-radius:6px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center;
      font-size:11px; font-weight:800;
    }
    .bc-name { font-size:11px; color:#78909c; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .bc-track { background:#f0f4f8; border-radius:6px; height:8px; overflow:hidden; }
    .bc-bar {
      height:100%; border-radius:6px;
      transition:width .5s cubic-bezier(.4,0,.2,1);
      min-width:3px;
    }
    .bc-val { font-size:11px; font-weight:700; text-align:right; color:#2e7d32; white-space:nowrap; }
    .bc-neg { color:#c62828 !important; }

    .bc-legend {
      display:flex; gap:16px; margin-top:12px;
      padding-top:12px; border-top:1px solid #f0f4f8;
    }
    .bc-leg-item { display:flex; align-items:center; gap:5px; font-size:11px; color:#90a4ae; }
    .bc-leg-dot  { width:8px; height:8px; border-radius:50%; }
    .bc-leg-pos  { .bc-leg-dot{ background:#2e7d32 } }
    .bc-leg-neg  { .bc-leg-dot{ background:#ef5350 } }

    /* ── Quick Actions ── */
    .quick-section { margin-top:4px; }
    .quick-title { font-size:14px; font-weight:700; color:#546e7a; margin:0 0 12px; text-transform:uppercase; letter-spacing:.5px; }
    .quick-row { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:12px; }
    .quick-btn {
      display:flex !important; align-items:center !important; gap:12px !important;
      padding:14px 16px !important; border-radius:14px !important; height:auto !important;
      text-align:left !important; border-color:#dde3ea !important; background:white !important;
      box-shadow:0 1px 4px rgba(13,27,42,.05);
      transition:box-shadow .15s,border-color .15s !important;
      &:hover { box-shadow:0 3px 12px rgba(13,27,42,.1) !important; border-color:#b0bec5 !important; }
    }
    .quick-icon {
      width:40px; height:40px; border-radius:10px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center;
      mat-icon { font-size:22px; width:22px; height:22px; }
    }
    .blue-icon  { background:#e3f2fd; color:#1565c0; }
    .teal-icon  { background:#e0f7f4; color:#004d40; }
    .green-icon { background:#e8f5e9; color:#2e7d32; }
    .amber-icon { background:#fff8e1; color:#f57f17; }
    .quick-label { font-size:13px; font-weight:600; color:#0d1b2a; }
    .quick-sub   { font-size:11px; color:#90a4ae; }

    @media (max-width:1200px) { .dash-grid { grid-template-columns:1fr 1fr; } }
    @media (max-width:900px)  { .dash-grid { grid-template-columns:1fr; } }
    @media (max-width:600px)  { .kpi-row { grid-template-columns:1fr 1fr; } .class-grid { grid-template-columns:1fr; } }
  `]
})
export class DashboardComponent implements OnInit {
  private readonly accountService   = inject(AccountService);
  private readonly operationService = inject(OperationService);
  private readonly dialog           = inject(MatDialog);

  accounts       = signal<Account[]>([]);
  lastOperations = signal<Operation[]>([]);

  today = new Date();

  classItems = Object.entries(CLASS_META).map(([num, meta]) => ({
    num: +num, ...meta
  }));

  ngOnInit(): void {
    this.accountService.getAll().subscribe(list => this.accounts.set(list));
    this.operationService.getAll().subscribe(list =>
      this.lastOperations.set(list.slice(0, 5))
    );
  }

  getBalanceByClass(cls: number): number {
    return this.accounts()
      .filter(a => a.class === cls)
      .reduce((sum, a) => {
        const debit  = (a.journalLines ?? []).reduce((s, l) => s + l.debit,  0);
        const credit = (a.journalLines ?? []).reduce((s, l) => s + l.credit, 0);
        return sum + (debit - credit);
      }, 0);
  }

  totalActif  = () => [1, 2, 5].reduce((s, c) => s + this.getBalanceByClass(c), 0);
  totalPassif = () => [1, 3, 4].reduce((s, c) => s + this.getBalanceByClass(c), 0);
  resultatNet = () => this.getBalanceByClass(7) - this.getBalanceByClass(6);

  get balanceChartData() {
    const absVals = [1,2,3,4,5,6,7,8].map(cls => Math.abs(this.getBalanceByClass(cls)));
    const max = Math.max(...absVals, 1);
    return [1,2,3,4,5,6,7,8].map(cls => {
      const balance = this.getBalanceByClass(cls);
      return {
        num: cls,
        name: CLASS_META[cls].name,
        fg:   CLASS_META[cls].fg,
        bg:   CLASS_META[cls].bg,
        balance,
        pct: Math.round(Math.abs(balance) / max * 100),
      };
    });
  }

  openOperationDialog(): void {
    const ref = this.dialog.open(OperationFormComponent, {
      data: {},
      panelClass: 'dlg-panel',
    });
    ref.afterClosed().subscribe(saved => {
      if (saved) {
        this.operationService.getAll().subscribe(list =>
          this.lastOperations.set(list.slice(0, 5))
        );
      }
    });
  }

  openAccountDialog(): void {
    const ref = this.dialog.open(AccountFormComponent, {
      data: {},
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

  getColorClass(type: string): string {
    return OPERATION_TYPE_CONFIG[type as keyof typeof OPERATION_TYPE_CONFIG]?.colorClass ?? 'badge-gray';
  }
}
