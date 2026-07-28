import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { AccountService } from '../../core/services/account.service';
import { OperationService } from '../../core/services/operation.service';
import { FactureService } from '../../core/services/facture.service';
import { EvenementService } from '../../core/services/evenement.service';
import { BudgetService } from '../../core/services/budget.service';
import { AuthService } from '../../core/services/auth.service';
import { AccountFormComponent } from '../accounts/account-form/account-form.component';
import { OperationFormComponent } from '../operations/operation-form/operation-form.component';
import { OperationViewDialogComponent } from '../operations/operation-view-dialog/operation-view-dialog.component';
import { Account } from '../../core/models/account.model';
import { Facture } from '../../core/models/facture.model';
import { Evenement } from '../../core/models/evenement.model';
import { BudgetLigne } from '../../core/models/budget.model';
import { Operation } from '../../core/models/operation.model';
import { Role } from '../../core/models/auth.model';
import { CentsPipe } from '../../shared/pipes/cents.pipe';
import { OperationTypePipe } from '../../shared/pipes/operation-type.pipe';
import { OPERATION_TYPE_CONFIG } from '../../core/utils/operation-type.utils';

// ── Static maps ──────────────────────────────────────────────────────────────

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

const ROLE_LABELS: Record<Role, string> = {
  ADMIN:          'Administrateur',
  DAF:            'DAF',
  CHEF_COMPTABLE: 'Chef comptable',
  COMPTABLE:      'Comptable',
  ASSISTANT:      'Assistant',
  AUDITEUR:       'Auditeur',
};

const MONTH_SHORT = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

// ── Local interfaces ──────────────────────────────────────────────────────────

interface SparkPoint { month: string; total: number; }
interface BudgetProgress { libelle: string; categorie: string; type: 'CHARGE' | 'PRODUIT'; prevu: number; reel: number; pct: number; }

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
          <div class="dash-greeting">
            Bonjour, <strong>{{ userName() }}</strong>
            <span class="role-pill role-{{ role() }}">{{ roleLabel() }}</span>
          </div>
          <p class="dash-date">{{ today | date:'EEEE dd MMMM yyyy' : '' : 'fr-FR' }}</p>
        </div>
        @if (canCreateOperation()) {
          <button mat-flat-button class="header-btn" (click)="openOperationDialog()">
            <mat-icon>add</mat-icon>
            Nouvelle opération
          </button>
        }
      </div>

      <!-- ── KPI Row 1 ── -->
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

      <!-- ── KPI Row 2 (enrichi) ── -->
      <div class="kpi-row kpi-row-2">

        <div class="kpi-card" [class.kpi-teal]="tresorerie() >= 0" [class.kpi-red]="tresorerie() < 0">
          <div class="kpi-icon-wrap">
            <mat-icon>savings</mat-icon>
          </div>
          <div class="kpi-body">
            <div class="kpi-value">{{ tresorerie() | cents }}</div>
            <div class="kpi-label">Trésorerie</div>
            <div class="kpi-sub">Classe 5</div>
          </div>
        </div>

        <div class="kpi-card" [class.kpi-amber]="facturesImpayees().length > 0" [class.kpi-green]="facturesImpayees().length === 0">
          <div class="kpi-icon-wrap">
            <mat-icon>request_quote</mat-icon>
          </div>
          <div class="kpi-body">
            <div class="kpi-value">{{ facturesImpayees().length }}</div>
            <div class="kpi-label">Factures impayées</div>
            <div class="kpi-sub">{{ facturesImpayeesTotal() | cents }}</div>
          </div>
        </div>

        <div class="kpi-card" [class.kpi-red]="facturesEnRetard().length > 0" [class.kpi-green]="facturesEnRetard().length === 0">
          <div class="kpi-icon-wrap">
            <mat-icon>warning</mat-icon>
          </div>
          <div class="kpi-body">
            <div class="kpi-value">{{ facturesEnRetard().length }}</div>
            <div class="kpi-label">Factures en retard</div>
            <div class="kpi-sub">Échéance dépassée</div>
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
              @if (canCreateOperation()) {
                <button mat-stroked-button (click)="openOperationDialog()">Créer une opération</button>
              }
            </div>
          } @else {
            <div class="op-list">
              @for (op of lastOperations(); track op.id) {
                <div class="op-row" (click)="openOperationDetail(op.id)">
                  <div class="op-dot" [ngClass]="getColorClass(op.type)"></div>
                  <div class="op-info">
                    <span class="op-label">{{ op.label }}</span>
                    <span class="op-badge badge" [ngClass]="getColorClass(op.type)">
                      {{ op.type | operationType }}
                    </span>
                  </div>
                  <span class="op-date">{{ op.date | date:'dd/MM/yy' }}</span>
                </div>
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

      <!-- ── Grille enrichie ── -->
      <div class="dash-grid dash-grid-enrich">

        <!-- Factures en retard -->
        <div class="card">
          <div class="card-header">
            <mat-icon class="header-icon icon-red">event_busy</mat-icon>
            <h2>Factures en retard</h2>
            <a routerLink="/factures" class="see-all">Voir tout →</a>
          </div>

          @if (facturesEnRetard().length === 0) {
            <div class="empty-state empty-state-sm">
              <mat-icon class="icon-green">check_circle</mat-icon>
              <p>Aucune facture en retard</p>
            </div>
          } @else {
            <div class="retard-list">
              @for (f of facturesEnRetard().slice(0, 4); track f.id) {
                <div class="retard-row">
                  <div class="retard-info">
                    <span class="retard-num">{{ f.numero }}</span>
                    <span class="retard-tiers">{{ f.tiersNom ?? '—' }}</span>
                  </div>
                  <div class="retard-right">
                    <span class="retard-amount">{{ f.resteAPayer | cents }}</span>
                    <span class="retard-days">{{ daysOverdue(f.dateEcheance) }}j</span>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Événements à venir -->
        <div class="card">
          <div class="card-header">
            <mat-icon class="header-icon icon-amber">event</mat-icon>
            <h2>Événements à venir</h2>
            <a routerLink="/evenements" class="see-all">Voir tout →</a>
          </div>

          @if (evenementsAVenir().length === 0) {
            <div class="empty-state empty-state-sm">
              <mat-icon>calendar_today</mat-icon>
              <p>Aucun événement à venir</p>
            </div>
          } @else {
            <div class="evt-list">
              @for (e of evenementsAVenir(); track e.id) {
                <div class="evt-row">
                  <div class="evt-date-badge">
                    <span class="evt-day">{{ e.dateEcheance | date:'dd' }}</span>
                    <span class="evt-mon">{{ e.dateEcheance | date:'MMM' : '' : 'fr-FR' }}</span>
                  </div>
                  <div class="evt-info">
                    <span class="evt-titre">{{ e.titre }}</span>
                    <span class="evt-cat">{{ e.categorie }}</span>
                  </div>
                  <span class="evt-amount">{{ e.montant | cents }}</span>
                </div>
              }
            </div>
          }
        </div>

        <!-- Budget du mois -->
        <div class="card">
          <div class="card-header">
            <mat-icon class="header-icon icon-purple">donut_large</mat-icon>
            <h2>Budget du mois</h2>
            <a routerLink="/budget" class="see-all">Gérer →</a>
          </div>

          @if (budgetProgress().length === 0) {
            <div class="empty-state empty-state-sm">
              <mat-icon>tune</mat-icon>
              <p>Aucun budget défini pour ce mois</p>
            </div>
          } @else {
            <div class="budget-list">
              @for (b of budgetProgress(); track b.libelle) {
                <div class="budget-row">
                  <div class="budget-meta">
                    <span class="budget-label">{{ b.libelle }}</span>
                    <span class="budget-pct" [class.over-budget]="b.pct >= 100">{{ b.pct }}%</span>
                  </div>
                  <div class="budget-track">
                    <div class="budget-bar"
                      [style.width.%]="b.pct"
                      [class.budget-bar-charge]="b.type === 'CHARGE'"
                      [class.budget-bar-produit]="b.type === 'PRODUIT'"
                      [class.budget-bar-over]="b.pct >= 100">
                    </div>
                  </div>
                  <div class="budget-amounts">
                    <span>{{ b.reel | cents }}</span>
                    <span class="budget-prevu">/ {{ b.prevu | cents }}</span>
                  </div>
                </div>
              }
            </div>
          }
        </div>

      </div>

      <!-- ── Sparkline tendance mensuelle ── -->
      <div class="card spark-card">
        <div class="card-header">
          <mat-icon class="header-icon">show_chart</mat-icon>
          <h2>Tendance mensuelle — montant des opérations</h2>
        </div>

        @if (sparklineData().length > 0 && sparklineHasData()) {
          <div class="spark-wrap">
            <svg class="spark-svg" viewBox="0 0 280 60" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#1565c0" stop-opacity="0.18"/>
                  <stop offset="100%" stop-color="#1565c0" stop-opacity="0"/>
                </linearGradient>
              </defs>
              <polygon [attr.points]="sparklineArea()" fill="url(#sparkGrad)"/>
              <polyline [attr.points]="sparklinePoints()" fill="none" stroke="#1565c0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              @for (pt of sparklineDots(); track $index) {
                <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="3" fill="#1565c0"/>
              }
            </svg>
            <div class="spark-labels">
              @for (lbl of sparklineLabels(); track $index) {
                <span>{{ lbl }}</span>
              }
            </div>
          </div>
        } @else {
          <div class="empty-state empty-state-sm">
            <mat-icon>show_chart</mat-icon>
            <p>Pas encore de données pour les 6 derniers mois</p>
          </div>
        }
      </div>

      <!-- ── Quick Actions ── -->
      <div class="quick-section">
        <h3 class="quick-title">Actions rapides</h3>
        <div class="quick-row">

          @if (canCreateOperation()) {
            <button mat-stroked-button class="quick-btn" (click)="openOperationDialog()">
              <div class="quick-icon blue-icon">
                <mat-icon>add_circle_outline</mat-icon>
              </div>
              <div>
                <div class="quick-label">Nouvelle opération</div>
                <div class="quick-sub">Saisir une entrée</div>
              </div>
            </button>
          }

          @if (canCreateAccount()) {
            <button mat-stroked-button class="quick-btn" (click)="openAccountDialog()">
              <div class="quick-icon green-icon">
                <mat-icon>add_card</mat-icon>
              </div>
              <div>
                <div class="quick-label">Nouveau compte</div>
                <div class="quick-sub">Plan comptable</div>
              </div>
            </button>
          }

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

          @if (isAdmin()) {
            <button mat-stroked-button routerLink="/users" class="quick-btn">
              <div class="quick-icon admin-icon">
                <mat-icon>manage_accounts</mat-icon>
              </div>
              <div>
                <div class="quick-label">Utilisateurs</div>
                <div class="quick-sub">Gérer les accès</div>
              </div>
            </button>
          }

        </div>
      </div>

      <!-- ── Message lecture seule (AUDITEUR) ── -->
      @if (isAuditeur()) {
        <div class="readonly-banner">
          <mat-icon>info</mat-icon>
          <span>Mode lecture seule — votre rôle Auditeur ne permet pas de créer ou modifier des données.</span>
        </div>
      }

    </div>
  `,
  styles: [`
    .dash { width: 100%; }

    /* ── Header ── */
    .dash-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 28px; flex-wrap: wrap; gap: 12px;
    }
    .dash-greeting {
      font-size: 22px; font-weight: 800; color: #0d1b2a; margin-bottom: 4px;
      display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    }
    .dash-date  { color: #78909c; margin: 0; font-size: 13px; }

    .role-pill {
      display: inline-block; padding: 3px 12px; border-radius: 20px;
      font-size: 12px; font-weight: 600; vertical-align: middle;
    }
    .role-ADMIN          { background: #fee2e2; color: #b91c1c; }
    .role-DAF            { background: #ede9fe; color: #6d28d9; }
    .role-CHEF_COMPTABLE { background: #dbeafe; color: #1d4ed8; }
    .role-COMPTABLE      { background: #e0f2fe; color: #0369a1; }
    .role-ASSISTANT      { background: #f1f5f9; color: #475569; }
    .role-AUDITEUR       { background: #fef3c7; color: #b45309; }

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
    .kpi-row-2 { margin-top: -12px; }
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
    .icon-red    { color:#c62828 !important; }
    .icon-amber  { color:#f57f17 !important; }
    .icon-purple { color:#7b1fa2 !important; }
    .icon-green  { color:#2e7d32 !important; }
    .see-all { font-size:13px; color:#1565c0; text-decoration:none; font-weight:600; &:hover{text-decoration:underline;} }

    /* ── Grid ── */
    .dash-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:20px; margin-bottom:24px; }
    .dash-grid-enrich { margin-top: 0; }

    /* ── Soldes par classe ── */
    .class-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .class-item { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:10px; background:#f8fafc; border:1px solid #e8edf2; }
    .class-badge { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:800; flex-shrink:0; }
    .class-body  { min-width:0; }
    .class-name  { font-size:11px; color:#78909c; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .class-balance { font-size:13px; font-weight:700; &.positive{color:#2e7d32} &.negative{color:#c62828} }

    /* ── Opérations ── */
    .op-list { display:flex; flex-direction:column; gap:4px; }
    .op-row  { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:10px; color:inherit; cursor:pointer; transition:background .12s; &:hover{background:#f5f7fa} }
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
    .empty-state-sm {
      padding: 20px 16px;
      mat-icon { font-size:28px; width:28px; height:28px; }
      p { margin:0; font-size:13px; }
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

    /* ── Factures en retard ── */
    .retard-list { display:flex; flex-direction:column; gap:6px; }
    .retard-row {
      display:flex; align-items:center; justify-content:space-between;
      padding:10px 12px; border-radius:10px; background:#fff5f5;
      border:1px solid #fecaca;
    }
    .retard-info { display:flex; flex-direction:column; min-width:0; }
    .retard-num  { font-size:13px; font-weight:600; color:#0d1b2a; }
    .retard-tiers{ font-size:11px; color:#78909c; }
    .retard-right{ display:flex; flex-direction:column; align-items:flex-end; gap:2px; }
    .retard-amount{ font-size:13px; font-weight:700; color:#c62828; }
    .retard-days { font-size:11px; font-weight:600; color:#ef5350; background:#fee2e2; padding:1px 6px; border-radius:8px; }

    /* ── Événements à venir ── */
    .evt-list { display:flex; flex-direction:column; gap:8px; }
    .evt-row  {
      display:flex; align-items:center; gap:12px;
      padding:10px 12px; border-radius:10px;
      background:#f8fafc; border:1px solid #e8edf2;
    }
    .evt-date-badge {
      width:36px; height:36px; border-radius:8px; background:#e3f2fd; color:#1565c0;
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      flex-shrink:0;
    }
    .evt-day { font-size:14px; font-weight:800; line-height:1; }
    .evt-mon { font-size:9px; font-weight:600; text-transform:uppercase; }
    .evt-info{ flex:1; min-width:0; display:flex; flex-direction:column; }
    .evt-titre{ font-size:13px; font-weight:600; color:#0d1b2a; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .evt-cat  { font-size:11px; color:#90a4ae; }
    .evt-amount{ font-size:13px; font-weight:700; color:#0d1b2a; flex-shrink:0; }

    /* ── Budget du mois ── */
    .budget-list { display:flex; flex-direction:column; gap:12px; }
    .budget-row  { display:flex; flex-direction:column; gap:4px; }
    .budget-meta { display:flex; justify-content:space-between; align-items:center; }
    .budget-label{ font-size:12px; font-weight:600; color:#0d1b2a; }
    .budget-pct  { font-size:11px; font-weight:700; color:#546e7a; &.over-budget{color:#c62828} }
    .budget-track{ background:#f0f4f8; border-radius:6px; height:7px; overflow:hidden; }
    .budget-bar  {
      height:100%; border-radius:6px;
      transition:width .5s cubic-bezier(.4,0,.2,1); min-width:3px;
    }
    .budget-bar-charge  { background:#f57f17; }
    .budget-bar-produit { background:#2e7d32; }
    .budget-bar-over    { background:#c62828 !important; }
    .budget-amounts { display:flex; gap:4px; font-size:11px; color:#546e7a; }
    .budget-prevu   { color:#b0bec5; }

    /* ── Sparkline ── */
    .spark-card { margin-bottom: 24px; }
    .spark-wrap { display:flex; flex-direction:column; gap:8px; }
    .spark-svg  { width:100%; height:64px; display:block; }
    .spark-labels {
      display:flex; justify-content:space-between;
      font-size:11px; color:#90a4ae; padding:0 2px;
    }

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
    .admin-icon { background:#fef3c7; color:#b45309; }
    .quick-label { font-size:13px; font-weight:600; color:#0d1b2a; }
    .quick-sub   { font-size:11px; color:#90a4ae; }

    /* ── Lecture seule banner ── */
    .readonly-banner {
      margin-top: 20px; display: flex; align-items: center; gap: 10px;
      padding: 12px 18px; border-radius: 12px;
      background: #fef3c7; color: #92400e;
      border: 1px solid #fde68a; font-size: 13px;
      mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }
    }

    @media (max-width:1200px) { .dash-grid { grid-template-columns:1fr 1fr; } }
    @media (max-width:900px)  { .dash-grid { grid-template-columns:1fr; } }
    @media (max-width:600px)  { .kpi-row { grid-template-columns:1fr 1fr; } .class-grid { grid-template-columns:1fr; } }
  `]
})
export class DashboardComponent implements OnInit {
  private readonly accountService   = inject(AccountService);
  private readonly operationService = inject(OperationService);
  private readonly factureService   = inject(FactureService);
  private readonly evenementService = inject(EvenementService);
  private readonly budgetService    = inject(BudgetService);
  private readonly auth             = inject(AuthService);
  private readonly dialog           = inject(MatDialog);

  accounts       = signal<Account[]>([]);
  allOperations  = signal<Operation[]>([]);
  lastOperations = signal<Operation[]>([]);
  factures       = signal<Facture[]>([]);
  evenements     = signal<Evenement[]>([]);
  budgetLignes   = signal<BudgetLigne[]>([]);

  today = new Date();

  // ── Profil utilisateur ──────────────────────────────────────────────────────
  userName  = computed(() => this.auth.currentUser()?.name ?? 'vous');
  role      = computed(() => this.auth.currentUser()?.role ?? 'ASSISTANT');
  roleLabel = computed(() => ROLE_LABELS[this.role()] ?? this.role());

  isAdmin    = computed(() => this.role() === 'ADMIN');
  isAuditeur = computed(() => this.role() === 'AUDITEUR');

  canCreateOperation = computed(() => this.role() !== 'AUDITEUR');
  canCreateAccount   = computed(() => this.role() === 'ADMIN');

  // ── KPI existants ───────────────────────────────────────────────────────────
  classItems = Object.entries(CLASS_META).map(([num, meta]) => ({ num: +num, ...meta }));

  // ── KPI enrichis ────────────────────────────────────────────────────────────
  tresorerie = computed(() => this.getBalanceByClass(5));

  facturesImpayees = computed(() =>
    this.factures().filter(f => f.statut !== 'PAYEE' && f.statut !== 'ANNULEE')
  );

  facturesImpayeesTotal = computed(() =>
    this.facturesImpayees().reduce((s, f) => s + f.resteAPayer, 0)
  );

  facturesEnRetard = computed(() => {
    const todayIso = this.today.toISOString().slice(0, 10);
    return this.facturesImpayees().filter(f => f.dateEcheance != null && f.dateEcheance < todayIso);
  });

  evenementsAVenir = computed(() => {
    const todayIso = this.today.toISOString().slice(0, 10);
    return this.evenements()
      .filter(e => e.statut === 'EN_ATTENTE' && e.dateEcheance >= todayIso)
      .sort((a, b) => a.dateEcheance.localeCompare(b.dateEcheance))
      .slice(0, 5);
  });

  budgetProgress = computed<BudgetProgress[]>(() =>
    this.budgetLignes().slice(0, 6).map(l => ({
      libelle:   l.libelle,
      categorie: l.categorie,
      type:      l.type,
      prevu:     l.montantPrevu,
      reel:      l.montantReel ?? 0,
      pct:       l.montantPrevu > 0
        ? Math.min(Math.round(((l.montantReel ?? 0) / l.montantPrevu) * 100), 100)
        : 0,
    }))
  );

  // ── Sparkline ───────────────────────────────────────────────────────────────
  sparklineData = computed<SparkPoint[]>(() => {
    const months = this.lastSixMonths();
    const ops    = this.allOperations();
    return months.map(m => ({
      month: m,
      total: ops
        .filter(o => o.date.slice(0, 7) === m)
        .reduce((s, o) => s + o.amount, 0),
    }));
  });

  sparklineHasData = computed(() => this.sparklineData().some(d => d.total > 0));
  sparklinePoints  = computed(() => this.computePolylinePoints(this.sparklineData()));
  sparklineArea    = computed(() => this.computeAreaPoints(this.sparklineData()));
  sparklineDots    = computed(() => this.computeDots(this.sparklineData()));
  sparklineLabels  = computed(() =>
    this.sparklineData().map(d => MONTH_SHORT[Number.parseInt(d.month.slice(5), 10) - 1] ?? d.month.slice(5))
  );

  // ── Chargement ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.accountService.getAll().subscribe({ next: list => this.accounts.set(list), error: () => {} });
    this.operationService.getAll().subscribe({
      next: list => { this.allOperations.set(list); this.lastOperations.set(list.slice(0, 5)); },
      error: () => {},
    });
    this.factureService.getAll().subscribe({ next: res => this.factures.set(res.data), error: () => {} });
    this.evenementService.getAll().subscribe({ next: list => this.evenements.set(list), error: () => {} });
    this.budgetService.getAll().subscribe({
      next: list => {
        const now    = this.today;
        const budget = list.find(b => b.exercice === now.getFullYear() && b.mois === now.getMonth() + 1);
        this.budgetLignes.set(budget?.lignes ?? []);
      },
      error: () => {},
    });
  }

  // ── Helpers comptables ───────────────────────────────────────────────────────
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

  daysOverdue(dateEcheance: string | undefined): number {
    if (dateEcheance == null) return 0;
    return Math.max(0, Math.floor((this.today.getTime() - new Date(dateEcheance).getTime()) / 86_400_000));
  }

  // ── Sparkline helpers ────────────────────────────────────────────────────────
  private lastSixMonths(): string[] {
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(this.today.getFullYear(), this.today.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return months;
  }

  private computePolylinePoints(data: SparkPoint[]): string {
    if (data.length < 2) return '';
    const max = Math.max(...data.map(d => d.total), 1);
    const W = 280, H = 48;
    return data.map((d, i) => {
      const x = Math.round(i * W / (data.length - 1));
      const y = Math.round(H - (Math.max(d.total, 0) / max * H));
      return `${x},${y}`;
    }).join(' ');
  }

  private computeAreaPoints(data: SparkPoint[]): string {
    if (data.length < 2) return '';
    const line = this.computePolylinePoints(data);
    return `0,48 ${line} 280,48`;
  }

  private computeDots(data: SparkPoint[]): { x: number; y: number }[] {
    if (data.length < 2) return [];
    const max = Math.max(...data.map(d => d.total), 1);
    const W = 280, H = 48;
    return data.map((d, i) => ({
      x: Math.round(i * W / (data.length - 1)),
      y: Math.round(H - (Math.max(d.total, 0) / max * H)),
    }));
  }

  // ── Dialogs ──────────────────────────────────────────────────────────────────
  openOperationDetail(operationId: number): void {
    this.dialog.open(OperationViewDialogComponent, {
      data: { operationId },
      panelClass: 'dlg-panel',
    });
  }

  openOperationDialog(): void {
    const ref = this.dialog.open(OperationFormComponent, {
      data: {},
      panelClass: 'dlg-panel',
    });
    ref.afterClosed().subscribe(saved => {
      if (saved) {
        this.operationService.getAll().subscribe(list => {
          this.allOperations.set(list);
          this.lastOperations.set(list.slice(0, 5));
        });
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
