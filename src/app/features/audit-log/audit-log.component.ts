import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuditLogService, AuditLogEntry } from '../../core/services/audit-log.service';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTooltipModule, PaginationComponent],
  template: `
    <div class="page">

      <!-- ── Header ── -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon-wrap">
            <mat-icon class="header-icon">policy</mat-icon>
          </div>
          <div>
            <h1 class="page-title">Journal d'audit</h1>
            <p class="page-sub">Traçabilité des actions sensibles du système</p>
          </div>
        </div>
        <div class="header-actions">
          <div class="search-wrap">
            <mat-icon class="search-icon">search</mat-icon>
            <input type="text" [(ngModel)]="filterAction" (ngModelChange)="applyFilter()"
              placeholder="Filtrer par action…" class="input-filter" />
            @if (filterAction) {
              <button class="clear-btn" (click)="filterAction=''; applyFilter()">
                <mat-icon>close</mat-icon>
              </button>
            }
          </div>
          <button class="btn-refresh" (click)="refresh()" [class.spinning]="loading()"
            matTooltip="Actualiser">
            <mat-icon>refresh</mat-icon>
          </button>
        </div>
      </div>

      <!-- ── KPI Cards ── -->
      <div class="kpi-row">
        <div class="kpi-card">
          <div class="kpi-icon kpi-icon--total"><mat-icon>list_alt</mat-icon></div>
          <div class="kpi-body">
            <span class="kpi-value">{{ total() }}</span>
            <span class="kpi-label">Entrées affichées</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon kpi-icon--danger"><mat-icon>gpp_bad</mat-icon></div>
          <div class="kpi-body">
            <span class="kpi-value">{{ criticalCount() }}</span>
            <span class="kpi-label">Actions critiques</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon kpi-icon--auth"><mat-icon>login</mat-icon></div>
          <div class="kpi-body">
            <span class="kpi-value">{{ authCount() }}</span>
            <span class="kpi-label">Authentifications</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon kpi-icon--warn"><mat-icon>manage_accounts</mat-icon></div>
          <div class="kpi-body">
            <span class="kpi-value">{{ warnCount() }}</span>
            <span class="kpi-label">Modifications</span>
          </div>
        </div>
      </div>

      <!-- ── Table Card ── -->
      @if (loading() && logs().length === 0) {
        <div class="skeleton-wrap">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="skeleton-row">
              <div class="skeleton-cell sk-date"></div>
              <div class="skeleton-cell sk-badge"></div>
              <div class="skeleton-cell sk-entity"></div>
              <div class="skeleton-cell sk-user"></div>
              <div class="skeleton-cell sk-details"></div>
              <div class="skeleton-cell sk-ip"></div>
            </div>
          }
        </div>
      } @else if (filtered().length === 0) {
        <div class="empty-state">
          <div class="empty-icon-wrap"><mat-icon>manage_search</mat-icon></div>
          <p class="empty-title">Aucune entrée trouvée</p>
          <p class="empty-sub">
            @if (filterAction) { Aucune action ne correspond à « {{ filterAction }} ». }
            @else { Le journal d'audit est vide pour le moment. }
          </p>
          @if (filterAction) {
            <button class="btn-ghost" (click)="filterAction=''; applyFilter()">
              Effacer le filtre
            </button>
          }
        </div>
      } @else {
        <div class="table-card">
          <div class="table-toolbar">
            <span class="table-count">
              <mat-icon>format_list_numbered</mat-icon>
              {{ total() }} résultat{{ total() > 1 ? 's' : '' }}
            </span>
          </div>
          <div class="table-wrap">
            <table class="audit-table">
              <thead>
                <tr>
                  <th class="th-date">Date &amp; Heure</th>
                  <th>Action</th>
                  <th>Entité</th>
                  <th>Utilisateur</th>
                  <th>Détails</th>
                  <th>Adresse IP</th>
                </tr>
              </thead>
              <tbody>
                @for (log of filtered(); track log.id) {
                  <tr [class.row-critical]="isCritical(log.action)">
                    <td class="col-date">
                      <span class="date-day">{{ log.createdAt | date:'dd/MM/yyyy' }}</span>
                      <span class="date-time">{{ log.createdAt | date:'HH:mm:ss' }}</span>
                    </td>
                    <td>
                      <span class="action-badge" [ngClass]="actionClass(log.action)">
                        <mat-icon class="badge-icon">{{ actionIcon(log.action) }}</mat-icon>
                        {{ log.action }}
                      </span>
                    </td>
                    <td class="col-entity">
                      @if (log.entity) {
                        <span class="entity-chip">
                          <mat-icon>folder_open</mat-icon>
                          {{ log.entity }}@if (log.entityId) {<span class="entity-id">&nbsp;#{{ log.entityId }}</span>}
                        </span>
                      } @else {
                        <span class="dim">—</span>
                      }
                    </td>
                    <td class="col-user">
                      @if (log.userId) {
                        <span class="user-chip">
                          <mat-icon>person</mat-icon>
                          #{{ log.userId }}
                        </span>
                      } @else {
                        <span class="system-chip">
                          <mat-icon>memory</mat-icon>
                          système
                        </span>
                      }
                    </td>
                    <td class="col-details">
                      @if (log.details) {
                        <span [matTooltip]="log.details" matTooltipPosition="above">{{ log.details }}</span>
                      } @else {
                        <span class="dim">—</span>
                      }
                    </td>
                    <td class="col-ip">
                      @if (log.ip) {
                        <span class="ip-chip">
                          <mat-icon>router</mat-icon>
                          {{ log.ip }}
                        </span>
                      } @else {
                        <span class="dim">—</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="load-more">
            <app-pagination
              [page]="page()" [pageSize]="pageSize()" [total]="serverTotal()" [totalPages]="totalPages()"
              (pageChange)="load($event)" (pageSizeChange)="onPageSizeChange($event)"
            />
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
    .page { padding: 28px 32px; display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }

    /* ── Header ── */
    .page-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 28px; flex-wrap: wrap; gap: 16px; flex-shrink: 0;
    }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .header-icon-wrap {
      width: 52px; height: 52px; border-radius: 14px;
      background: linear-gradient(135deg, var(--clr-primary), var(--clr-primary-dark));
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(21,101,192,.3);
    }
    .header-icon { color: #fff; font-size: 28px; width: 28px; height: 28px; }
    .page-title { margin: 0 0 2px; font-size: 1.6rem; font-weight: 700; color: var(--clr-text-primary); }
    .page-sub { margin: 0; color: var(--clr-text-secondary); font-size: 0.875rem; }

    .header-actions { display: flex; gap: 10px; align-items: center; }
    .search-wrap {
      position: relative; display: flex; align-items: center;
      background: var(--clr-card-bg); border: 1.5px solid var(--clr-border);
      border-radius: 10px; padding: 0 12px; transition: border-color .2s, box-shadow .2s;
      &:focus-within {
        border-color: var(--clr-primary);
        box-shadow: 0 0 0 3px rgba(21,101,192,.1);
      }
    }
    .search-icon { color: var(--clr-text-secondary); font-size: 18px; width: 18px; height: 18px; margin-right: 8px; }
    .input-filter {
      border: none; background: transparent; color: var(--clr-text-primary);
      font-size: 0.875rem; min-width: 230px; padding: 10px 0; outline: none;
      &::placeholder { color: var(--clr-text-secondary); }
    }
    .clear-btn {
      border: none; background: none; cursor: pointer; padding: 0; display: flex; align-items: center;
      color: var(--clr-text-secondary); border-radius: 50%;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &:hover { color: var(--clr-text-primary); }
    }
    .btn-refresh {
      width: 42px; height: 42px; border-radius: 10px; border: 1.5px solid var(--clr-border);
      background: var(--clr-card-bg); cursor: pointer; display: flex; align-items: center;
      justify-content: center; color: var(--clr-text-secondary); transition: all .2s;
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
      &:hover { border-color: var(--clr-primary); color: var(--clr-primary); background: var(--clr-primary-light); }
    }

    /* ── KPI Cards ── */
    .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; flex-shrink: 0; }
    .kpi-card {
      background: var(--clr-card-bg); border: 1px solid var(--clr-border);
      border-radius: var(--radius-card); padding: 20px;
      display: flex; align-items: center; gap: 16px;
      box-shadow: var(--shadow-card); transition: box-shadow .2s, transform .15s;
      &:hover { box-shadow: var(--shadow-card-hover); transform: translateY(-1px); }
    }
    .kpi-icon {
      width: 48px; height: 48px; border-radius: 12px; display: flex;
      align-items: center; justify-content: center; flex-shrink: 0;
      mat-icon { font-size: 24px; width: 24px; height: 24px; }
    }
    .kpi-icon--total  { background: #e8f0fe; mat-icon { color: var(--clr-primary); } }
    .kpi-icon--danger { background: var(--clr-negative-bg); mat-icon { color: var(--clr-negative); } }
    .kpi-icon--auth   { background: #e8f5e9; mat-icon { color: var(--clr-positive); } }
    .kpi-icon--warn   { background: var(--clr-warn-bg); mat-icon { color: var(--clr-warn); } }
    .kpi-body { display: flex; flex-direction: column; }
    .kpi-value { font-size: 1.75rem; font-weight: 700; color: var(--clr-text-primary); line-height: 1.1; }
    .kpi-label { font-size: 0.75rem; color: var(--clr-text-secondary); margin-top: 2px; }

    /* ── Skeleton ── */
    .skeleton-wrap {
      background: var(--clr-card-bg); border: 1px solid var(--clr-border);
      border-radius: var(--radius-card); overflow-y: auto; box-shadow: var(--shadow-card);
      flex: 1; min-height: 0;
    }
    .skeleton-row {
      display: flex; gap: 16px; padding: 14px 20px; border-bottom: 1px solid var(--clr-border);
      &:last-child { border-bottom: none; }
    }
    .skeleton-cell {
      height: 16px; border-radius: 6px; background: linear-gradient(90deg, #e8edf3 25%, #f0f4f8 50%, #e8edf3 75%);
      background-size: 200% 100%; animation: shimmer 1.4s infinite;
    }
    .sk-date { width: 110px; } .sk-badge { width: 120px; } .sk-entity { width: 100px; }
    .sk-user { width: 70px; } .sk-details { flex: 1; } .sk-ip { width: 90px; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    /* ── Empty state ── */
    .empty-state {
      background: var(--clr-card-bg); border: 1px solid var(--clr-border);
      border-radius: var(--radius-card); text-align: center; box-shadow: var(--shadow-card);
      flex: 1; min-height: 0; display: flex; flex-direction: column;
      align-items: center; justify-content: center; padding: 32px 24px;
    }
    .empty-icon-wrap {
      width: 72px; height: 72px; border-radius: 50%; background: var(--clr-primary-light);
      display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;
      mat-icon { font-size: 36px; width: 36px; height: 36px; color: var(--clr-primary); }
    }
    .empty-title { font-size: 1.1rem; font-weight: 600; color: var(--clr-text-primary); margin: 0 0 8px; }
    .empty-sub { color: var(--clr-text-secondary); font-size: 0.875rem; margin: 0 0 20px; }
    .btn-ghost {
      border: 1.5px solid var(--clr-primary); background: transparent; color: var(--clr-primary);
      padding: 8px 20px; border-radius: 8px; cursor: pointer; font-size: 0.875rem; font-weight: 500;
      &:hover { background: var(--clr-primary-light); }
    }

    /* ── Table card ── */
    .table-card {
      background: var(--clr-card-bg); border: 1px solid var(--clr-border);
      border-radius: var(--radius-card); box-shadow: var(--shadow-card); overflow: hidden;
      flex: 1; min-height: 0; display: flex; flex-direction: column;
    }
    .table-toolbar {
      display: flex; align-items: center; justify-content: flex-end;
      padding: 12px 20px; border-bottom: 1px solid var(--clr-border);
      background: #fafbfc; flex-shrink: 0;
    }
    .table-count {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.8rem; color: var(--clr-text-secondary); font-weight: 500;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }
    .table-wrap { flex: 1; min-height: 0; overflow-y: auto; overflow-x: auto; }
    .audit-table {
      width: 100%; border-collapse: collapse; font-size: 0.8rem;
      th {
        background: #f5f7fa; color: var(--clr-text-secondary); padding: 11px 16px;
        text-align: left; white-space: nowrap; font-weight: 600; font-size: 0.75rem;
        text-transform: uppercase; letter-spacing: .04em;
        border-bottom: 2px solid var(--clr-border);
      }
      td {
        padding: 12px 16px; border-bottom: 1px solid var(--clr-border);
        color: var(--clr-text-primary); vertical-align: middle;
      }
      tbody tr:last-child td { border-bottom: none; }
      tbody tr { transition: background .12s; }
      tbody tr:hover td { background: #f8fafc; }
      tbody tr.row-critical td { border-left: 3px solid var(--clr-negative); background: #fffafa; }
      tbody tr.row-critical:hover td { background: #fff0f0; }
    }

    /* ── Date column ── */
    .col-date { white-space: nowrap; }
    .date-day { display: block; font-weight: 500; color: var(--clr-text-primary); }
    .date-time { display: block; font-size: 0.75rem; color: var(--clr-text-secondary); margin-top: 1px; }
    .th-date { min-width: 130px; }

    /* ── Action badge ── */
    .action-badge {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 700;
      font-family: 'Roboto Mono', monospace; white-space: nowrap;
      background: #f0f4f8; color: var(--clr-text-secondary); border: 1px solid var(--clr-border);
    }
    .badge-icon { font-size: 12px !important; width: 12px !important; height: 12px !important; }
    .action-auth   { background: #e8f5e9; color: #2e7d32; border-color: #c8e6c9; }
    .action-danger { background: var(--clr-negative-bg); color: var(--clr-negative); border-color: #ffcdd2; }
    .action-warn   { background: var(--clr-warn-bg); color: var(--clr-warn); border-color: #ffe0b2; }

    /* ── Entity / User / IP chips ── */
    .entity-chip, .user-chip, .system-chip, .ip-chip {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 0.78rem; white-space: nowrap;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }
    .entity-chip { color: var(--clr-primary); mat-icon { color: var(--clr-primary); opacity: .7; } }
    .entity-id { color: var(--clr-text-secondary); font-size: 0.72rem; }
    .user-chip { color: var(--clr-text-primary); font-weight: 500; mat-icon { color: var(--clr-text-secondary); } }
    .system-chip { color: var(--clr-text-secondary); font-style: italic; mat-icon { color: var(--clr-text-secondary); } }
    .ip-chip {
      color: var(--clr-text-secondary); font-family: 'Roboto Mono', monospace; font-size: 0.75rem;
      mat-icon { color: var(--clr-text-secondary); opacity: .7; }
    }

    .col-details { max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--clr-text-secondary); font-size: 0.78rem; }
    .dim { color: #b0bec5; }

    /* ── Load more ── */
    .load-more { padding: 16px; text-align: center; border-top: 1px solid var(--clr-border); background: #fafbfc; flex-shrink: 0; }
    .btn-load-more {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 24px; border-radius: 10px;
      border: 1.5px solid var(--clr-border); background: var(--clr-card-bg);
      color: var(--clr-text-secondary); cursor: pointer; font-size: 0.875rem; font-weight: 500;
      transition: all .2s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover:not(:disabled) { border-color: var(--clr-primary); color: var(--clr-primary); background: var(--clr-primary-light); }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }

    /* ── Spin animation ── */
    .spinning mat-icon, mat-icon.spinning { animation: spin .8s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    /* ── Responsive ── */
    @media (max-width: 900px) {
      .page { padding: 16px; }
      .kpi-row { grid-template-columns: repeat(2, 1fr); }
      .input-filter { min-width: 160px; }
    }
    @media (max-width: 600px) {
      .kpi-row { grid-template-columns: 1fr 1fr; gap: 10px; }
      .page-header { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class AuditLogComponent implements OnInit {
  private readonly service = inject(AuditLogService);

  logs     = signal<AuditLogEntry[]>([]);
  filtered = signal<AuditLogEntry[]>([]);
  loading  = signal(true);
  filterAction = '';

  page       = signal(1);
  pageSize   = signal(50);
  serverTotal = signal(0);
  totalPages  = signal(0);

  total        = computed(() => this.serverTotal());
  criticalCount = computed(() => this.filtered().filter(l => this.isCritical(l.action)).length);
  authCount     = computed(() => this.filtered().filter(l => ['LOGIN_SUCCESS', 'REGISTER', 'TOKEN_REFRESH'].includes(l.action)).length);
  warnCount     = computed(() => this.filtered().filter(l => ['PASSWORD_CHANGED', 'USER_CREATED', 'USER_UPDATED', 'USER_ACTIVATED'].includes(l.action)).length);

  ngOnInit(): void { this.load(1); }

  refresh(): void { this.load(1); }

  load(p: number): void {
    this.page.set(p);
    this.loading.set(true);
    this.service.getAll(p, this.pageSize()).subscribe({
      next: res => {
        this.logs.set(res.data);
        this.serverTotal.set(res.total);
        this.totalPages.set(res.totalPages);
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.load(1);
  }

  applyFilter(): void {
    const q = this.filterAction.trim().toLowerCase();
    this.filtered.set(q ? this.logs().filter(l => l.action.toLowerCase().includes(q)) : this.logs());
  }

  isCritical(action: string): boolean {
    return ['FEC_EXPORT', 'FISCAL_YEAR_CLOSED', 'USER_DEACTIVATED', 'PASSWORD_CHANGED', 'ENTRY_VERROUILLE'].includes(action);
  }

  actionClass(action: string): string {
    if (['LOGIN_SUCCESS', 'REGISTER', 'TOKEN_REFRESH'].includes(action)) return 'action-auth';
    if (['FEC_EXPORT', 'FISCAL_YEAR_CLOSED', 'USER_DEACTIVATED', 'ENTRY_VERROUILLE'].includes(action)) return 'action-danger';
    if (['PASSWORD_CHANGED', 'USER_CREATED', 'USER_UPDATED', 'USER_ACTIVATED'].includes(action)) return 'action-warn';
    return '';
  }

  actionIcon(action: string): string {
    if (['LOGIN_SUCCESS', 'REGISTER', 'TOKEN_REFRESH'].includes(action)) return 'verified_user';
    if (['FEC_EXPORT', 'FISCAL_YEAR_CLOSED', 'USER_DEACTIVATED', 'ENTRY_VERROUILLE'].includes(action)) return 'report';
    if (['PASSWORD_CHANGED', 'USER_CREATED', 'USER_UPDATED', 'USER_ACTIVATED'].includes(action)) return 'edit_note';
    if (action === 'LOGIN_FAILED') return 'block';
    return 'info';
  }
}
