import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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

interface RoleMeta { label: string; bg: string; fg: string; }

const ROLE_META: Record<Role, RoleMeta> = {
  ADMIN:          { label: 'Admin',         bg: '#fee2e2', fg: '#b91c1c' },
  DAF:            { label: 'DAF',           bg: '#ede9fe', fg: '#6d28d9' },
  CHEF_COMPTABLE: { label: 'Chef compta',   bg: '#dbeafe', fg: '#1d4ed8' },
  COMPTABLE:      { label: 'Comptable',     bg: '#e0f2fe', fg: '#0369a1' },
  ASSISTANT:      { label: 'Assistant',     bg: '#f1f5f9', fg: '#475569' },
  AUDITEUR:       { label: 'Auditeur',      bg: '#fef3c7', fg: '#b45309' },
};

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="page">

      <!-- ── Header ── -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Utilisateurs</h1>
          <p class="page-sub">{{ users().length }} utilisateur(s) · Gestion des accès</p>
        </div>
        <button class="btn-new" (click)="openForm()">
          <mat-icon>person_add</mat-icon>
          Nouvel utilisateur
        </button>
      </div>

      <!-- ── Table ── -->
      <div class="table-card">
        @if (loading()) {
          <div class="empty-state">
            <mat-icon class="spin-icon">refresh</mat-icon>
            <p>Chargement…</p>
          </div>
        } @else if (users().length === 0) {
          <div class="empty-state">
            <mat-icon>group_off</mat-icon>
            <p>Aucun utilisateur</p>
          </div>
        } @else {
          <table mat-table [dataSource]="users()" class="users-table">

            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Nom</th>
              <td mat-cell *matCellDef="let u">
                <div class="user-cell">
                  <div class="avatar">{{ initials(u.name) }}</div>
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
                  <button class="btn-icon" [matTooltip]="u.isActive ? 'Désactiver' : 'Réactiver'"
                    (click)="toggleActive(u)">
                    <mat-icon>{{ u.isActive ? 'person_off' : 'person' }}</mat-icon>
                  </button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols;"
              [class.row-inactive]="!row.isActive"></tr>
          </table>
        }
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 28px 32px; max-width: 960px; margin: 0 auto; }

    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 24px;
    }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #1e293b; margin: 0 0 4px; }
    .page-sub   { font-size: 0.85rem; color: #94a3b8; margin: 0; }

    .btn-new {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 20px; border-radius: 12px; border: none; cursor: pointer;
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: #fff; font-size: 0.875rem; font-weight: 500;
      box-shadow: 0 4px 12px rgba(59,130,246,0.35); font-family: inherit;
      transition: all 0.2s;
    }
    .btn-new:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(59,130,246,0.45); }

    .table-card {
      background: #fff; border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
      overflow: hidden;
    }

    .users-table { width: 100%; }

    .user-cell { display: flex; align-items: center; gap: 12px; }
    .avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: #fff; display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 600; flex-shrink: 0;
    }
    .user-name  { font-size: 0.875rem; font-weight: 500; color: #1e293b; }
    .user-email { font-size: 0.75rem; color: #94a3b8; }

    .role-badge {
      display: inline-block; padding: 3px 10px; border-radius: 20px;
      font-size: 0.75rem; font-weight: 500;
    }

    .status-badge {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 0.8rem; font-weight: 500;
    }
    .status-dot {
      width: 7px; height: 7px; border-radius: 50%;
    }
    .active  .status-dot { background: #22c55e; }
    .active  { color: #166534; }
    .inactive .status-dot { background: #94a3b8; }
    .inactive { color: #64748b; }

    .row-actions { display: flex; gap: 4px; justify-content: flex-end; }
    .btn-icon {
      width: 32px; height: 32px; border-radius: 8px; border: none;
      background: transparent; color: #94a3b8; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.15s;
    }
    .btn-icon:hover { background: #f1f5f9; color: #3b82f6; }
    .btn-icon mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .row-inactive { opacity: 0.55; }

    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      padding: 60px; gap: 12px; color: #94a3b8;
    }
    .empty-state mat-icon { font-size: 40px; width: 40px; height: 40px; }
    .spin-icon { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    ::ng-deep .users-table .mat-mdc-header-cell {
      font-size: 0.75rem; font-weight: 600; color: #64748b;
      text-transform: uppercase; letter-spacing: 0.05em;
      background: #f8fafc;
    }
    ::ng-deep .users-table .mat-mdc-cell {
      font-size: 0.875rem; padding: 14px 16px;
    }
    ::ng-deep .users-table .mat-mdc-row:hover { background: #f8fafc; }
  `]
})
export class UserListComponent implements OnInit {
  private readonly svc   = inject(UserService);
  private readonly alert = inject(AlertService);
  private readonly dialog = inject(MatDialog);

  users   = signal<UserProfile[]>([]);
  loading = signal(true);
  cols    = ['name', 'role', 'statut', 'actions'];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next:  list => { this.users.set(list); this.loading.set(false); },
      error: ()   => this.loading.set(false),
    });
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
      data: { title: `${user.isActive ? 'Désactiver' : 'Réactiver'} l'utilisateur`, message: `Voulez-vous ${action} ${user.name} ?` }
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
