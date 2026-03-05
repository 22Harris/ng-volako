import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AccountService } from '../../core/services/account.service';
import { JournalEntryService } from '../../core/services/journal-entry.service';
import { OperationService } from '../../core/services/operation.service';
import { EvenementService } from '../../core/services/evenement.service';
import { Account } from '../../core/models/account.model';
import { JournalEntry } from '../../core/models/journal-entry.model';
import { Operation } from '../../core/models/operation.model';
import { Evenement } from '../../core/models/evenement.model';
import { CentsPipe } from '../../shared/pipes/cents.pipe';
import {
  OPERATION_TYPE_CONFIG,
  CATEGORY_LABELS,
  OperationCategory,
} from '../../core/utils/operation-type.utils';

const CHART_COLORS = [
  '#42a5f5', '#26c6da', '#66bb6a', '#ffa726',
  '#ef5350', '#ab47bc', '#ec407a', '#78909c',
];

interface MonthPoint { month: string; label: string; charges: number; produits: number; }
interface BreakdownItem { name: string; value: number; pct: number; color: string; }
interface OpCatItem { label: string; count: number; pct: number; }

interface SvgData {
  vb: string;
  W: number; H: number; padL: number; padT: number;
  chargesPath: string; produitsPath: string;
  chargesArea: string; produitsArea: string;
  yTicks: { y: number; label: string }[];
  xLabels: { x: number; label: string }[];
  chargesDots: { x: number; y: number }[];
  produitsDots: { x: number; y: number }[];
}

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule, CentsPipe],
  template: `
    <div class="page">

      <!-- ── Header ── -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Statistiques</h1>
          <p class="page-sub">Analyse financière globale</p>
        </div>
      </div>

      <!-- ── KPI Grid ── -->
      <div class="kpi-grid">

        <div class="kpi-card kpi-blue">
          <div class="kpi-icon"><mat-icon>account_balance_wallet</mat-icon></div>
          <div class="kpi-body">
            <p class="kpi-label">Trésorerie actuelle</p>
            <p class="kpi-value">{{ tresorerie() | cents }}</p>
            <p class="kpi-hint">Comptes financiers (Cl. 5)</p>
          </div>
        </div>

        <div class="kpi-card kpi-green">
          <div class="kpi-icon"><mat-icon>trending_up</mat-icon></div>
          <div class="kpi-body">
            <p class="kpi-label">Total Entrées</p>
            <p class="kpi-value">{{ totalProduits() | cents }}</p>
            <p class="kpi-hint">Produits (Cl. 7)</p>
          </div>
        </div>

        <div class="kpi-card kpi-red">
          <div class="kpi-icon"><mat-icon>trending_down</mat-icon></div>
          <div class="kpi-body">
            <p class="kpi-label">Total Dépenses</p>
            <p class="kpi-value">{{ totalCharges() | cents }}</p>
            <p class="kpi-hint">Charges (Cl. 6)</p>
          </div>
        </div>

        <div class="kpi-card" [class.kpi-profit]="resultatNet() >= 0" [class.kpi-loss]="resultatNet() < 0">
          <div class="kpi-icon">
            <mat-icon>{{ resultatNet() >= 0 ? 'north' : 'south' }}</mat-icon>
          </div>
          <div class="kpi-body">
            <p class="kpi-label">Résultat Net</p>
            <p class="kpi-value">{{ resultatNet() | cents }}</p>
            <p class="kpi-hint">Entrées − Dépenses</p>
          </div>
        </div>

      </div>

      <!-- ── Comparaison Entrées vs Dépenses ── -->
      <div class="section-card">
        <h3 class="section-title">
          <mat-icon>compare_arrows</mat-icon>
          Entrées vs Dépenses
        </h3>
        @if (totalProduits() + totalCharges() > 0) {
          <div class="cmp-wrap">
            <div class="cmp-bar">
              <div class="cmp-seg cmp-income" [style.flex]="totalProduits()"
                [matTooltip]="'Entrées : ' + incomePct() + '%'"></div>
              <div class="cmp-seg cmp-expense" [style.flex]="totalCharges()"
                [matTooltip]="'Dépenses : ' + expensePct() + '%'"></div>
            </div>
            <div class="cmp-labels">
              <div class="cmp-item">
                <span class="cmp-dot cmp-dot-income"></span>
                <div class="cmp-text">
                  <strong>Entrées</strong>
                  <span class="cmp-pct">{{ incomePct() }}%</span>
                </div>
                <span class="cmp-amount">{{ totalProduits() | cents }}</span>
              </div>
              <div class="cmp-divider"></div>
              <div class="cmp-item">
                <span class="cmp-dot cmp-dot-expense"></span>
                <div class="cmp-text">
                  <strong>Dépenses</strong>
                  <span class="cmp-pct">{{ expensePct() }}%</span>
                </div>
                <span class="cmp-amount">{{ totalCharges() | cents }}</span>
              </div>
            </div>
          </div>
        } @else {
          <p class="no-data">Aucune donnée disponible</p>
        }
      </div>

      <!-- ── Flux mensuel (SVG) ── -->
      <div class="section-card">
        <div class="section-header-row">
          <h3 class="section-title">
            <mat-icon>show_chart</mat-icon>
            Flux mensuel
          </h3>
          <div class="chart-legend">
            <span class="leg-item"><span class="leg-dot" style="background:#ef5350"></span>Dépenses</span>
            <span class="leg-item"><span class="leg-dot" style="background:#26c6da"></span>Entrées</span>
          </div>
        </div>

        @if (svgData(); as svg) {
          <div class="svg-wrap">
            <svg [attr.viewBox]="svg.vb" width="100%" style="display:block;overflow:visible">
              <defs>
                <linearGradient id="grad-charges" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stop-color="#ef5350" stop-opacity="0.22"/>
                  <stop offset="100%" stop-color="#ef5350" stop-opacity="0.02"/>
                </linearGradient>
                <linearGradient id="grad-produits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stop-color="#26c6da" stop-opacity="0.22"/>
                  <stop offset="100%" stop-color="#26c6da" stop-opacity="0.02"/>
                </linearGradient>
              </defs>

              <!-- Grid + Y labels -->
              @for (tick of svg.yTicks; track tick.y) {
                <line [attr.x1]="svg.padL" [attr.x2]="svg.W - 20"
                      [attr.y1]="tick.y"  [attr.y2]="tick.y"
                      stroke="#f0f4f8" stroke-width="1"/>
                <text [attr.x]="svg.padL - 8" [attr.y]="tick.y + 4"
                      text-anchor="end" font-size="10" fill="#90a4ae">{{ tick.label }}</text>
              }

              <!-- Areas -->
              <path [attr.d]="svg.chargesArea"  fill="url(#grad-charges)"/>
              <path [attr.d]="svg.produitsArea" fill="url(#grad-produits)"/>

              <!-- Lines -->
              <path [attr.d]="svg.chargesPath"  fill="none" stroke="#ef5350"
                    stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path [attr.d]="svg.produitsPath" fill="none" stroke="#26c6da"
                    stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>

              <!-- Dots charges -->
              @for (dot of svg.chargesDots; track dot.x) {
                <circle [attr.cx]="dot.x" [attr.cy]="dot.y" r="4"
                        fill="#ef5350" stroke="white" stroke-width="2"/>
              }
              <!-- Dots produits -->
              @for (dot of svg.produitsDots; track dot.x) {
                <circle [attr.cx]="dot.x" [attr.cy]="dot.y" r="4"
                        fill="#26c6da" stroke="white" stroke-width="2"/>
              }

              <!-- X labels -->
              @for (lbl of svg.xLabels; track lbl.x) {
                <text [attr.x]="lbl.x" [attr.y]="svg.H - 4"
                      text-anchor="middle" font-size="10" fill="#90a4ae">{{ lbl.label }}</text>
              }
            </svg>
          </div>
        } @else {
          <p class="no-data">Aucune donnée mensuelle disponible</p>
        }
      </div>

      <!-- ── Deux colonnes : charges + catégories ── -->
      <div class="two-col">

        <!-- Répartition des charges -->
        <div class="section-card">
          <h3 class="section-title"><mat-icon>pie_chart</mat-icon> Répartition des charges</h3>
          @if (chargesBreakdown().length > 0) {
            <div class="bars-list">
              @for (item of chargesBreakdown(); track item.name) {
                <div class="bar-row">
                  <div class="bar-meta">
                    <span class="bar-dot" [style.background]="item.color"></span>
                    <span class="bar-name">{{ item.name }}</span>
                    <span class="bar-val">{{ item.value | cents }}</span>
                  </div>
                  <div class="bar-track">
                    <div class="bar-fill" [style.width.%]="item.pct" [style.background]="item.color"></div>
                  </div>
                </div>
              }
            </div>
          } @else {
            <p class="no-data">Aucune charge enregistrée</p>
          }
        </div>

        <!-- Opérations par catégorie -->
        <div class="section-card">
          <h3 class="section-title"><mat-icon>donut_small</mat-icon> Opérations par catégorie</h3>
          @if (opsByCategory().length > 0) {
            <div class="bars-list">
              @for (item of opsByCategory(); track item.label; let i = $index) {
                <div class="bar-row">
                  <div class="bar-meta">
                    <span class="bar-dot" [style.background]="CHART_COLORS[i % CHART_COLORS.length]"></span>
                    <span class="bar-name">{{ item.label }}</span>
                    <span class="bar-val">{{ item.count }}</span>
                  </div>
                  <div class="bar-track">
                    <div class="bar-fill" [style.width.%]="item.pct"
                      [style.background]="CHART_COLORS[i % CHART_COLORS.length]"></div>
                  </div>
                </div>
              }
            </div>
          } @else {
            <p class="no-data">Aucune opération enregistrée</p>
          }
        </div>

      </div>

      <!-- ── Budget récurrent (Événements) ── -->
      <div class="section-card">
        <h3 class="section-title"><mat-icon>event_repeat</mat-icon> Budget récurrent — Événements</h3>

        <div class="budget-grid">
          <div class="budget-tile budget-paid">
            <div class="budget-tile-icon"><mat-icon>check_circle</mat-icon></div>
            <div class="budget-tile-body">
              <p class="bt-value">{{ evenStats().payeAmt | cents }}</p>
              <p class="bt-label">Payé</p>
              <p class="bt-count">{{ evenStats().payeCount }} événement(s)</p>
            </div>
          </div>
          <div class="budget-tile budget-pending">
            <div class="budget-tile-icon"><mat-icon>schedule</mat-icon></div>
            <div class="budget-tile-body">
              <p class="bt-value">{{ evenStats().attenteAmt | cents }}</p>
              <p class="bt-label">En attente</p>
              <p class="bt-count">{{ evenStats().attenteCount }} événement(s)</p>
            </div>
          </div>
          <div class="budget-tile budget-late">
            <div class="budget-tile-icon"><mat-icon>warning</mat-icon></div>
            <div class="budget-tile-body">
              <p class="bt-value">{{ evenStats().retardAmt | cents }}</p>
              <p class="bt-label">En retard</p>
              <p class="bt-count">{{ evenStats().retardCount }} événement(s)</p>
            </div>
          </div>
        </div>

        @if (evenStats().total > 0) {
          <div class="budget-progress-wrap">
            <div class="bpw-labels">
              <span class="bpw-label-left">
                <mat-icon>check_circle</mat-icon>
                {{ evenStats().paidPct }}% payé
              </span>
              <span class="bpw-label-right">Total : {{ evenStats().total | cents }}</span>
            </div>
            <div class="bpw-track">
              <div class="bpw-paid"   [style.width.%]="evenStats().paidPct"></div>
              <div class="bpw-retard" [style.width.%]="evenStats().retardPct"></div>
            </div>
            <div class="bpw-sub">
              <span class="bpw-leg paid-leg">Payé</span>
              <span class="bpw-leg retard-leg">En retard</span>
              <span class="bpw-leg pending-leg">En attente</span>
            </div>
          </div>
        }
      </div>

    </div>
  `,
  styles: [`
    .page {
      display: flex; flex-direction: column;
      gap: 20px; padding-bottom: 24px;
    }

    /* ── Header ── */
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-shrink: 0; }
    .page-title { font-size: 26px; font-weight: 800; color: #0d1b2a; margin: 0 0 4px; }
    .page-sub   { font-size: 13px; color: #78909c; margin: 0; }

    /* ── KPI Grid ── */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    .kpi-card {
      background: white; border-radius: 16px;
      box-shadow: 0 2px 8px rgba(13,27,42,.07);
      padding: 18px 20px;
      display: flex; align-items: center; gap: 16px;
      border-left: 4px solid transparent;
    }
    .kpi-blue   { border-color: #1565c0; }
    .kpi-green  { border-color: #2e7d32; }
    .kpi-red    { border-color: #c62828; }
    .kpi-profit { border-color: #2e7d32; }
    .kpi-loss   { border-color: #c62828; }

    .kpi-icon {
      width: 48px; height: 48px; border-radius: 12px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 24px; width: 24px; height: 24px; }
    }
    .kpi-blue   .kpi-icon { background: #e3f2fd; color: #1565c0; }
    .kpi-green  .kpi-icon { background: #e8f5e9; color: #2e7d32; }
    .kpi-red    .kpi-icon { background: #fde8e8; color: #c62828; }
    .kpi-profit .kpi-icon { background: #e8f5e9; color: #2e7d32; }
    .kpi-loss   .kpi-icon { background: #fde8e8; color: #c62828; }

    .kpi-body { min-width: 0; }
    .kpi-label { font-size: 12px; color: #78909c; font-weight: 600; margin: 0 0 4px; text-transform: uppercase; letter-spacing: .4px; }
    .kpi-value { font-size: 18px; font-weight: 800; color: #0d1b2a; margin: 0 0 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .kpi-hint  { font-size: 11px; color: #b0bec5; margin: 0; }

    /* ── Section card ── */
    .section-card {
      background: white; border-radius: 16px;
      box-shadow: 0 2px 8px rgba(13,27,42,.07);
      padding: 20px 24px;
    }
    .section-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 15px; font-weight: 700; color: #0d1b2a; margin: 0 0 18px;
      mat-icon { font-size: 18px; width: 18px; height: 18px; color: #90a4ae; }
    }
    .section-header-row {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 16px; flex-wrap: wrap; gap: 8px;
      .section-title { margin-bottom: 0; }
    }
    .chart-legend { display: flex; gap: 16px; }
    .leg-item {
      display: flex; align-items: center; gap: 6px;
      font-size: 12px; color: #546e7a; font-weight: 500;
    }
    .leg-dot { width: 10px; height: 10px; border-radius: 50%; }

    .no-data { font-size: 13px; color: #b0bec5; text-align: center; padding: 24px 0; margin: 0; }

    /* ── Comparaison ── */
    .cmp-wrap { display: flex; flex-direction: column; gap: 14px; }
    .cmp-bar {
      display: flex; height: 18px; border-radius: 9px; overflow: hidden;
      background: #f0f4f8;
    }
    .cmp-seg { min-width: 2px; transition: flex .4s cubic-bezier(.4,0,.2,1); }
    .cmp-income  { background: linear-gradient(90deg, #43a047, #66bb6a); }
    .cmp-expense { background: linear-gradient(90deg, #ef5350, #e53935); }

    .cmp-labels { display: flex; align-items: center; gap: 0; }
    .cmp-item {
      flex: 1; display: flex; align-items: center; gap: 10px; padding: 8px 0;
    }
    .cmp-divider {
      width: 1px; height: 40px; background: #e8edf2; flex-shrink: 0; margin: 0 16px;
    }
    .cmp-dot {
      width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0;
    }
    .cmp-dot-income  { background: #66bb6a; }
    .cmp-dot-expense { background: #ef5350; }
    .cmp-text { flex: 1; }
    .cmp-text strong { display: block; font-size: 13px; color: #0d1b2a; }
    .cmp-pct { font-size: 11px; color: #78909c; }
    .cmp-amount { font-size: 14px; font-weight: 700; color: #263238; white-space: nowrap; }

    /* ── SVG chart ── */
    .svg-wrap { padding: 4px 0; }

    /* ── Two columns ── */
    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    /* ── Horizontal bars ── */
    .bars-list { display: flex; flex-direction: column; gap: 10px; }
    .bar-row { display: flex; flex-direction: column; gap: 4px; }
    .bar-meta {
      display: flex; align-items: center; gap: 8px;
      font-size: 12px; color: #263238;
    }
    .bar-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .bar-name { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500; }
    .bar-val { font-weight: 700; color: #0d1b2a; white-space: nowrap; font-size: 11px; }
    .bar-track {
      background: #f0f4f8; border-radius: 6px; height: 7px; overflow: hidden;
    }
    .bar-fill {
      height: 100%; border-radius: 6px;
      transition: width .5s cubic-bezier(.4,0,.2,1);
      min-width: 3px;
    }

    /* ── Budget récurrent ── */
    .budget-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
      margin-bottom: 18px;
    }
    .budget-tile {
      display: flex; align-items: center; gap: 14px;
      padding: 16px; border-radius: 12px;
    }
    .budget-paid    { background: #f1f8f1; }
    .budget-pending { background: #fffde7; }
    .budget-late    { background: #fef0f0; }

    .budget-tile-icon {
      width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 22px; width: 22px; height: 22px; }
    }
    .budget-paid    .budget-tile-icon { background: #c8e6c9; color: #2e7d32; }
    .budget-pending .budget-tile-icon { background: #fff9c4; color: #f57f17; }
    .budget-late    .budget-tile-icon { background: #ffcdd2; color: #c62828; }

    .bt-value { font-size: 15px; font-weight: 800; color: #0d1b2a; margin: 0 0 2px; }
    .bt-label { font-size: 12px; font-weight: 700; color: #546e7a; margin: 0 0 1px; }
    .bt-count { font-size: 11px; color: #90a4ae; margin: 0; }

    .budget-progress-wrap {
      background: #f8fafc; border-radius: 12px; padding: 14px 18px;
    }
    .bpw-labels {
      display: flex; justify-content: space-between; align-items: center;
      font-size: 12px; color: #546e7a; margin-bottom: 10px;
    }
    .bpw-label-left {
      display: flex; align-items: center; gap: 5px; font-weight: 700; color: #2e7d32;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }
    .bpw-label-right { font-size: 12px; font-weight: 600; color: #263238; }
    .bpw-track {
      height: 10px; border-radius: 5px; background: #e8edf2;
      overflow: hidden; display: flex; margin-bottom: 8px;
    }
    .bpw-paid   { height: 100%; background: #43a047; transition: width .5s; }
    .bpw-retard { height: 100%; background: #ef5350; transition: width .5s; }
    .bpw-sub { display: flex; gap: 16px; }
    .bpw-leg {
      display: flex; align-items: center; gap: 4px;
      font-size: 11px; color: #78909c;
      &::before {
        content: ''; display: inline-block;
        width: 8px; height: 8px; border-radius: 50%;
      }
    }
    .paid-leg::before    { background: #43a047; }
    .retard-leg::before  { background: #ef5350; }
    .pending-leg::before { background: #b0bec5; }

    @media (max-width: 1200px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 900px)  { .two-col { grid-template-columns: 1fr; } }
    @media (max-width: 768px)  {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
      .budget-grid { grid-template-columns: 1fr; }
      .cmp-labels { flex-direction: column; }
      .cmp-divider { width: 100%; height: 1px; margin: 0; }
    }
    @media (max-width: 480px)  { .kpi-grid { grid-template-columns: 1fr; } }
  `],
})
export class StatsComponent implements OnInit {
  private readonly accountService  = inject(AccountService);
  private readonly journalService  = inject(JournalEntryService);
  private readonly opService       = inject(OperationService);
  private readonly evenService     = inject(EvenementService);

  accounts   = signal<Account[]>([]);
  entries    = signal<JournalEntry[]>([]);
  operations = signal<Operation[]>([]);
  evenements = signal<Evenement[]>([]);

  readonly CHART_COLORS = CHART_COLORS;

  ngOnInit(): void {
    this.accountService.getAll().subscribe(list => this.accounts.set(list));
    this.journalService.getAll().subscribe(list => this.entries.set(list));
    this.opService.getAll().subscribe(list => this.operations.set(list));
    this.evenService.getAll().subscribe(list => this.evenements.set(list));
  }

  /* ── Balance helpers (same pattern as dashboard) ── */
  private classBalance(cls: number): number {
    return this.accounts()
      .filter(a => a.class === cls)
      .reduce((sum, a) => {
        const debit  = (a.journalLines ?? []).reduce((s, l) => s + l.debit,  0);
        const credit = (a.journalLines ?? []).reduce((s, l) => s + l.credit, 0);
        return sum + (debit - credit);
      }, 0);
  }

  private classCredit(cls: number): number {
    return this.accounts()
      .filter(a => a.class === cls)
      .reduce((sum, a) =>
        sum + (a.journalLines ?? []).reduce((s, l) => s + l.credit, 0), 0
      );
  }

  private classDebit(cls: number): number {
    return this.accounts()
      .filter(a => a.class === cls)
      .reduce((sum, a) =>
        sum + (a.journalLines ?? []).reduce((s, l) => s + l.debit, 0), 0
      );
  }

  /* ── KPI computeds ── */
  tresorerie   = computed(() => this.classBalance(5));
  totalProduits = computed(() => this.classCredit(7));
  totalCharges  = computed(() => this.classDebit(6));
  resultatNet   = computed(() => this.totalProduits() - this.totalCharges());

  incomePct  = computed(() => {
    const total = this.totalProduits() + this.totalCharges();
    return total > 0 ? Math.round(this.totalProduits() / total * 100) : 50;
  });
  expensePct = computed(() => {
    const total = this.totalProduits() + this.totalCharges();
    return total > 0 ? Math.round(this.totalCharges() / total * 100) : 50;
  });

  /* ── Monthly trend data ── */
  monthlyData = computed<MonthPoint[]>(() => {
    const accMap = new Map(this.accounts().map(a => [a.id, a]));
    const byMonth = new Map<string, { charges: number; produits: number }>();

    this.entries().forEach(entry => {
      const month = entry.date.substring(0, 7);
      if (!byMonth.has(month)) byMonth.set(month, { charges: 0, produits: 0 });
      const d = byMonth.get(month)!;
      entry.lines.forEach(line => {
        const acc = accMap.get(line.accountId);
        if (!acc) return;
        if (acc.class === 6) d.charges += line.debit;
        if (acc.class === 7) d.produits += line.credit;
      });
    });

    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        label: new Intl.DateTimeFormat('fr-FR', { month: 'short', year: '2-digit' })
                 .format(new Date(month + '-15')),
        charges:  data.charges,
        produits: data.produits,
      }));
  });

  /* ── SVG chart data ── */
  svgData = computed<SvgData | null>(() => {
    const data = this.monthlyData();
    if (data.length === 0) return null;

    const W = 580, H = 165, padL = 80, padR = 20, padT = 15, padB = 32;
    const cW = W - padL - padR;
    const cH = H - padT - padB;
    const maxVal = Math.max(...data.flatMap(d => [d.charges, d.produits]), 1);

    const xAt = (i: number): number =>
      padL + (data.length > 1 ? (i / (data.length - 1)) * cW : cW / 2);
    const yAt = (v: number): number =>
      padT + cH - (v / maxVal) * cH;

    const chargesPath  = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xAt(i)},${yAt(d.charges)}`).join(' ');
    const produitsPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xAt(i)},${yAt(d.produits)}`).join(' ');
    const btm = padT + cH;
    const chargesArea  = `${chargesPath} L${xAt(data.length - 1)},${btm} L${padL},${btm} Z`;
    const produitsArea = `${produitsPath} L${xAt(data.length - 1)},${btm} L${padL},${btm} Z`;

    const yTicks = [0, 0.25, 0.5, 0.75, 1.0].map(t => ({
      y:     yAt(t * maxVal),
      label: this.shortAmt(Math.round(t * maxVal)),
    }));

    const xLabels    = data.map((d, i) => ({ x: xAt(i), label: d.label }));
    const chargesDots  = data.map((d, i) => ({ x: xAt(i), y: yAt(d.charges) }));
    const produitsDots = data.map((d, i) => ({ x: xAt(i), y: yAt(d.produits) }));

    return { vb: `0 0 ${W} ${H}`, W, H, padL, padT, chargesPath, produitsPath,
      chargesArea, produitsArea, yTicks, xLabels, chargesDots, produitsDots };
  });

  private shortAmt(v: number): string {
    const ar = v / 100;
    if (ar >= 1_000_000) return `${(ar / 1_000_000).toFixed(1)}M Ar`;
    if (ar >= 1_000)     return `${(ar / 1_000).toFixed(0)}k`;
    return ar.toFixed(0);
  }

  /* ── Charges breakdown by Class-6 account ── */
  chargesBreakdown = computed<BreakdownItem[]>(() => {
    const items = this.accounts()
      .filter(a => a.class === 6)
      .map((a, idx) => ({
        name:  `${a.code} ${a.name}`,
        value: (a.journalLines ?? []).reduce((s, l) => s + l.debit, 0),
        color: CHART_COLORS[idx % CHART_COLORS.length],
      }))
      .filter(i => i.value > 0)
      .sort((a, b) => b.value - a.value);

    const max = Math.max(...items.map(i => i.value), 1);
    return items.map(i => ({ ...i, pct: Math.round((i.value / max) * 100) }));
  });

  /* ── Operations by category ── */
  opsByCategory = computed<OpCatItem[]>(() => {
    const byCategory = new Map<string, { label: string; count: number }>();

    this.operations().forEach(op => {
      const config = OPERATION_TYPE_CONFIG[op.type];
      const cat    = config?.category ?? 'AUTRE';
      const label  = CATEGORY_LABELS[cat as OperationCategory] ?? cat;
      if (!byCategory.has(cat)) byCategory.set(cat, { label, count: 0 });
      byCategory.get(cat)!.count++;
    });

    const items = Array.from(byCategory.values()).sort((a, b) => b.count - a.count);
    const maxCount = Math.max(...items.map(i => i.count), 1);
    return items.map(i => ({ ...i, pct: Math.round((i.count / maxCount) * 100) }));
  });

  /* ── Événements budget stats ── */
  evenStats = computed(() => {
    const evts      = this.evenements();
    const paye      = evts.filter(e => e.statut === 'PAYE');
    const attente   = evts.filter(e => e.statut === 'EN_ATTENTE');
    const retard    = evts.filter(e => e.statut === 'EN_RETARD');
    const total     = evts.reduce((s, e) => s + e.montant, 0);
    const payeAmt   = paye.reduce((s, e) => s + e.montant, 0);
    const retardAmt = retard.reduce((s, e) => s + e.montant, 0);
    return {
      total, payeAmt,
      attenteAmt:   attente.reduce((s, e) => s + e.montant, 0),
      retardAmt,
      payeCount:    paye.length,
      attenteCount: attente.length,
      retardCount:  retard.length,
      paidPct:   total > 0 ? Math.round(payeAmt   / total * 100) : 0,
      retardPct: total > 0 ? Math.round(retardAmt / total * 100) : 0,
    };
  });
}
