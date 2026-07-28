import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from '../../../core/services/user.service';
import { AlertService } from '../../../shared/components/alert/alert.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { UserFormComponent } from '../user-form/user-form.component';
import { UserProfile, Role } from '../../../core/models/auth.model';

interface RoleMeta { label: string; bg: string; fg: string; accent: string; }

const ROLE_META: Record<Role, RoleMeta> = {
  ADMIN:          { label: 'Admin',       bg: '#fee2e2', fg: '#b91c1c', accent: 'linear-gradient(135deg,#ef4444,#dc2626)' },
  DAF:            { label: 'DAF',         bg: '#ede9fe', fg: '#6d28d9', accent: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' },
  CHEF_COMPTABLE: { label: 'Chef compta', bg: '#dbeafe', fg: '#1d4ed8', accent: 'linear-gradient(135deg,#3b82f6,#2563eb)' },
  COMPTABLE:      { label: 'Comptable',   bg: '#e0f2fe', fg: '#0369a1', accent: 'linear-gradient(135deg,#0ea5e9,#0284c7)' },
  ASSISTANT:      { label: 'Assistant',   bg: '#f1f5f9', fg: '#475569', accent: 'linear-gradient(135deg,#64748b,#475569)' },
  AUDITEUR:       { label: 'Auditeur',    bg: '#fef3c7', fg: '#b45309', accent: 'linear-gradient(135deg,#f59e0b,#d97706)' },
};

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="page">

      <!-- ── Header ── -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon-wrap">
            <mat-icon class="header-icon">manage_accounts</mat-icon>
          </div>
          <div>
            <h1 class="page-title">Utilisateurs</h1>
            <p class="page-sub">Gestion des accès et des rôles</p>
          </div>
        </div>
        <button class="btn-new" (click)="openForm()">
          <mat-icon>person_add</mat-icon>
          Nouvel utilisateur
        </button>
      </div>

      <!-- ── KPI Cards ── -->
      <div class="kpi-row">
        <div class="kpi-card">
          <div class="kpi-icon kpi-icon--blue"><mat-icon>group</mat-icon></div>
          <div class="kpi-body">
            <span class="kpi-value">{{ users().length }}</span>
            <span class="kpi-label">Total utilisateurs</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon kpi-icon--green"><mat-icon>check_circle</mat-icon></div>
          <div class="kpi-body">
            <span class="kpi-value">{{ activeCount() }}</span>
            <span class="kpi-label">Actifs</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon kpi-icon--gray"><mat-icon>block</mat-icon></div>
          <div class="kpi-body">
            <span class="kpi-value">{{ inactiveCount() }}</span>
            <span class="kpi-label">Inactifs</span>
          </div>
        </div>
        <div class="kpi-card kpi-roles">
          @for (rm of roleDistribution(); track rm.role) {
            <span class="role-mini" [style.background]="rm.bg" [style.color]="rm.fg">
              {{ rm.label }} <strong>{{ rm.count }}</strong>
            </span>
          }
        </div>
      </div>

      <!-- ── Table Card ── -->
      <div class="table-card">

        <!-- Toolbar -->
        <div class="table-toolbar">
          <div class="search-wrap">
            <mat-icon class="search-icon">search</mat-icon>
            <input type="text" [(ngModel)]="filterQuery" (ngModelChange)="applyFilter()"
              placeholder="Rechercher par nom ou email…" class="search-input" />
            @if (filterQuery) {
              <button class="clear-btn" (click)="filterQuery=''; applyFilter()">
                <mat-icon>close</mat-icon>
              </button>
            }
          </div>
          <span class="table-count">
            <mat-icon>format_list_numbered</mat-icon>
            {{ filtered().length }} résultat{{ filtered().length > 1 ? 's' : '' }}
          </span>
        </div>

        @if (loading()) {
          <div class="skeleton-wrap">
            @for (i of [1,2,3,4]; track i) {
              <div class="skeleton-row">
                <div class="sk-avatar"></div>
                <div class="sk-lines"><div class="sk-line sk-name"></div><div class="sk-line sk-email"></div></div>
                <div class="sk-badge"></div>
                <div class="sk-status"></div>
                <div class="sk-actions"></div>
              </div>
            }
          </div>
        } @else if (filtered().length === 0) {
          <div class="empty-state">
            <div class="empty-icon-wrap"><mat-icon>person_search</mat-icon></div>
            <p class="empty-title">
              @if (filterQuery) { Aucun résultat pour « {{ filterQuery }} » }
              @else { Aucun utilisateur }
            </p>
            @if (filterQuery) {
              <button class="btn-ghost" (click)="filterQuery=''; applyFilter()">Effacer la recherche</button>
            }
          </div>
        } @else {
          <div class="table-wrap">
          <table mat-table [dataSource]="filtered()" class="users-table">

            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Utilisateur</th>
              <td mat-cell *matCellDef="let u">
                <div class="user-cell">
                  <div class="avatar" [style.background]="roleMeta(u.role).accent">
                    {{ initials(u.name) }}
                  </div>
                  <div>
                    <div class="user-name">{{ u.name }}</div>
                    <div class="user-email">{{ u.email }}</div>
                  </div>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="role">
              <th mat-header-cell *matHeaderCellDef>Rôle</th>
              <td mat-cell *matCellDef="let u">
                <span class="role-badge"
                  [style.background]="roleMeta(u.role).bg"
                  [style.color]="roleMeta(u.role).fg">
                  <span class="role-dot" [style.background]="roleMeta(u.role).fg"></span>
                  {{ roleMeta(u.role).label }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="statut">
              <th mat-header-cell *matHeaderCellDef>Statut</th>
              <td mat-cell *matCellDef="let u">
                <span class="status-badge" [class.active]="u.isActive" [class.inactive]="!u.isActive">
                  <span class="status-dot"></span>
                  {{ u.isActive ? 'Actif' : 'Inactif' }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let u">
                <div class="row-actions">
                  <button class="btn-icon" matTooltip="Modifier" (click)="openForm(u)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button class="btn-icon danger" [matTooltip]="u.isActive ? 'Désactiver' : 'Réactiver'"
                    (click)="toggleActive(u)">
                    <mat-icon>{{ u.isActive ? 'person_off' : 'person' }}</mat-icon>
                  </button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols;" [class.row-inactive]="!row.isActive"></tr>
          </table>
          </div>
        }
      </div>
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
      width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
      background: linear-gradient(135deg, var(--clr-primary), var(--clr-primary-dark));
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(21,101,192,.3);
    }
    .header-icon { color: #fff; font-size: 28px; width: 28px; height: 28px; }
    .page-title { font-size: 1.6rem; font-weight: 700; color: var(--clr-text-primary); margin: 0 0 2px; }
    .page-sub { font-size: 0.875rem; color: var(--clr-text-secondary); margin: 0; }

    .btn-new {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 11px 22px; border-radius: 12px; border: none; cursor: pointer;
      background: linear-gradient(135deg, var(--clr-primary), var(--clr-primary-dark));
      color: #fff; font-size: 0.875rem; font-weight: 600; font-family: inherit;
      box-shadow: 0 4px 14px rgba(21,101,192,.35); transition: all .2s;
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
      &:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(21,101,192,.45); }
    }

    /* ── KPI ── */
    .kpi-row { display: grid; grid-template-columns: repeat(3, 1fr) 2fr; gap: 16px; margin-bottom: 24px; flex-shrink: 0; }
    .kpi-card {
      background: var(--clr-card-bg); border: 1px solid var(--clr-border);
      border-radius: var(--radius-card); padding: 18px 20px;
      display: flex; align-items: center; gap: 14px;
      box-shadow: var(--shadow-card); transition: box-shadow .2s, transform .15s;
      &:hover { box-shadow: var(--shadow-card-hover); transform: translateY(-1px); }
    }
    .kpi-icon {
      width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 22px; width: 22px; height: 22px; }
    }
    .kpi-icon--blue  { background: #e8f0fe; mat-icon { color: var(--clr-primary); } }
    .kpi-icon--green { background: var(--clr-positive-bg); mat-icon { color: var(--clr-positive); } }
    .kpi-icon--gray  { background: #f1f5f9; mat-icon { color: var(--clr-text-secondary); } }
    .kpi-body { display: flex; flex-direction: column; }
    .kpi-value { font-size: 1.6rem; font-weight: 700; color: var(--clr-text-primary); line-height: 1.1; }
    .kpi-label { font-size: 0.75rem; color: var(--clr-text-secondary); margin-top: 2px; }
    .kpi-roles {
      flex-wrap: wrap; gap: 8px; align-items: center; justify-content: flex-start;
      padding: 14px 16px;
    }
    .role-mini {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 3px 10px; border-radius: 20px; font-size: 0.72rem;
      strong { font-weight: 700; }
    }

    /* ── Table card ── */
    .table-card {
      background: var(--clr-card-bg); border: 1px solid var(--clr-border);
      border-radius: var(--radius-card); box-shadow: var(--shadow-card); overflow: hidden;
      flex: 1; min-height: 0; display: flex; flex-direction: column;
    }
    .table-toolbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px; border-bottom: 1px solid var(--clr-border); background: #fafbfc;
      gap: 12px; flex-shrink: 0;
    }
    .search-wrap {
      display: flex; align-items: center; gap: 8px;
      background: var(--clr-card-bg); border: 1.5px solid var(--clr-border);
      border-radius: 10px; padding: 0 12px; flex: 1; max-width: 360px;
      transition: border-color .2s, box-shadow .2s;
      &:focus-within { border-color: var(--clr-primary); box-shadow: 0 0 0 3px rgba(21,101,192,.1); }
    }
    .search-icon { color: var(--clr-text-secondary); font-size: 18px; width: 18px; height: 18px; }
    .search-input {
      border: none; background: transparent; color: var(--clr-text-primary);
      font-size: 0.875rem; padding: 9px 0; outline: none; flex: 1;
      &::placeholder { color: #b0bec5; }
    }
    .clear-btn {
      border: none; background: none; cursor: pointer; padding: 0; display: flex; align-items: center;
      color: var(--clr-text-secondary);
      mat-icon { font-size: 15px; width: 15px; height: 15px; }
      &:hover { color: var(--clr-text-primary); }
    }
    .table-count {
      display: flex; align-items: center; gap: 5px; white-space: nowrap;
      font-size: 0.78rem; color: var(--clr-text-secondary); font-weight: 500;
      mat-icon { font-size: 15px; width: 15px; height: 15px; }
    }

    /* ── Skeleton ── */
    .skeleton-wrap { padding: 0 4px; flex: 1; min-height: 0; overflow-y: auto; }
    .skeleton-row {
      display: flex; align-items: center; gap: 16px;
      padding: 14px 20px; border-bottom: 1px solid var(--clr-border);
      &:last-child { border-bottom: none; }
    }
    .sk-avatar {
      width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
      background: linear-gradient(90deg,#e8edf3 25%,#f0f4f8 50%,#e8edf3 75%);
      background-size: 200% 100%; animation: shimmer 1.4s infinite;
    }
    .sk-lines { flex: 1; display: flex; flex-direction: column; gap: 6px; }
    .sk-line {
      height: 12px; border-radius: 6px;
      background: linear-gradient(90deg,#e8edf3 25%,#f0f4f8 50%,#e8edf3 75%);
      background-size: 200% 100%; animation: shimmer 1.4s infinite;
    }
    .sk-name { width: 40%; } .sk-email { width: 60%; }
    .sk-badge { width: 80px; height: 24px; border-radius: 20px; background: linear-gradient(90deg,#e8edf3 25%,#f0f4f8 50%,#e8edf3 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
    .sk-status { width: 60px; height: 16px; border-radius: 6px; background: linear-gradient(90deg,#e8edf3 25%,#f0f4f8 50%,#e8edf3 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
    .sk-actions { width: 70px; height: 34px; border-radius: 9px; background: linear-gradient(90deg,#e8edf3 25%,#f0f4f8 50%,#e8edf3 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    /* ── Empty ── */
    .empty-state {
      text-align: center; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 10px;
      flex: 1; min-height: 0; padding: 32px 24px;
    }
    .empty-icon-wrap {
      width: 64px; height: 64px; border-radius: 50%; background: var(--clr-primary-light);
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 32px; width: 32px; height: 32px; color: var(--clr-primary); }
    }
    .empty-title { font-size: 1rem; font-weight: 600; color: var(--clr-text-primary); margin: 0; }
    .btn-ghost {
      border: 1.5px solid var(--clr-primary); background: transparent; color: var(--clr-primary);
      padding: 7px 18px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 500;
      &:hover { background: var(--clr-primary-light); }
    }

    /* ── Table ── */
    .table-wrap { flex: 1; min-height: 0; overflow-y: auto; overflow-x: auto; }
    .users-table { width: 100%; }
    .user-cell { display: flex; align-items: center; gap: 14px; }
    .avatar {
      width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
      color: #fff; display: flex; align-items: center; justify-content: center;
      font-size: 0.78rem; font-weight: 700;
      box-shadow: 0 2px 8px rgba(0,0,0,.15);
    }
    .user-name  { font-size: 0.875rem; font-weight: 600; color: var(--clr-text-primary); }
    .user-email { font-size: 0.75rem; color: var(--clr-text-secondary); margin-top: 1px; }

    .role-badge {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 4px 11px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;
    }
    .role-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

    .status-badge {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 0.8rem; font-weight: 500;
    }
    .status-dot { width: 7px; height: 7px; border-radius: 50%; }
    .active  .status-dot { background: #22c55e; box-shadow: 0 0 0 3px #dcfce7; }
    .active  { color: #166534; }
    .inactive .status-dot { background: #94a3b8; }
    .inactive { color: #94a3b8; }

    .row-actions { display: flex; gap: 4px; justify-content: flex-end; opacity: 0; transition: opacity .15s; }
    .btn-icon {
      width: 34px; height: 34px; border-radius: 9px; border: none;
      background: #f1f5f9; color: var(--clr-text-secondary); cursor: pointer;
      display: flex; align-items: center; justify-content: center; transition: all .15s;
      mat-icon { font-size: 17px; width: 17px; height: 17px; }
      &:hover { background: var(--clr-primary-light); color: var(--clr-primary); }
      &.danger:hover { background: var(--clr-negative-bg); color: var(--clr-negative); }
    }
    .row-inactive { opacity: 0.45; }

    /* ── Material overrides ── */
    ::ng-deep .users-table .mat-mdc-header-row { background: #f5f7fa; border-bottom: 2px solid var(--clr-border); }
    ::ng-deep .users-table .mat-mdc-header-cell {
      font-size: 0.72rem; font-weight: 700; color: var(--clr-text-secondary);
      text-transform: uppercase; letter-spacing: .07em; border-bottom: none;
    }
    ::ng-deep .users-table .mat-mdc-cell { font-size: 0.875rem; padding: 14px 16px; border-bottom-color: var(--clr-border); }
    ::ng-deep .users-table .mat-mdc-row { transition: background .15s; }
    ::ng-deep .users-table .mat-mdc-row:hover { background: #f8fafc; }
    ::ng-deep .users-table .mat-mdc-row:hover .row-actions { opacity: 1; }
    ::ng-deep .users-table .mat-mdc-row:last-child .mat-mdc-cell { border-bottom: none; }

    @media (max-width: 900px) {
      .page { padding: 16px; }
      .kpi-row { grid-template-columns: 1fr 1fr; }
      .kpi-roles { grid-column: 1 / -1; }
    }
  `]
})
export class UserListComponent implements OnInit {
  private readonly svc    = inject(UserService);
  private readonly alert  = inject(AlertService);
  private readonly dialog = inject(MatDialog);

  users    = signal<UserProfile[]>([]);
  filtered = signal<UserProfile[]>([]);
  loading  = signal(true);
  cols     = ['name', 'role', 'statut', 'actions'];
  filterQuery = '';

  activeCount   = computed(() => this.users().filter(u =>  u.isActive).length);
  inactiveCount = computed(() => this.users().filter(u => !u.isActive).length);
  roleDistribution = computed(() =>
    (Object.keys(ROLE_META) as Role[])
      .map(r => ({ role: r, count: this.users().filter(u => u.role === r).length, ...ROLE_META[r] }))
      .filter(r => r.count > 0)
  );

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next:  list => { this.users.set(list); this.applyFilter(); this.loading.set(false); },
      error: ()   => this.loading.set(false),
    });
  }

  applyFilter(): void {
    const q = this.filterQuery.trim().toLowerCase();
    this.filtered.set(q
      ? this.users().filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      : this.users()
    );
  }

  roleMeta(role: Role): RoleMeta { return ROLE_META[role] ?? ROLE_META.ASSISTANT; }

  initials(name: string): string {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  openForm(user?: UserProfile): void {
    this.dialog.open(UserFormComponent, { data: { user }, width: '520px' })
      .afterClosed().subscribe(result => { if (result) this.load(); });
  }

  toggleActive(user: UserProfile): void {
    const action = user.isActive ? 'désactiver' : 'réactiver';
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `${user.isActive ? 'Désactiver' : 'Réactiver'} l'utilisateur`,
        message: `Voulez-vous ${action} ${user.name} ?`,
      }
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.svc.toggleActive(user.id).subscribe({
        next: updated => {
          this.alert.success(`Utilisateur ${updated.isActive ? 'réactivé' : 'désactivé'}`);
          this.load();
        },
        error: err => this.alert.error(err?.error?.message ?? 'Erreur lors de la mise à jour'),
      });
    });
  }
}
