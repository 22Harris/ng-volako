import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { JournalEntryService } from '../../../core/services/journal-entry.service';
import { AccountService } from '../../../core/services/account.service';
import { AlertService } from '../../../shared/components/alert/alert.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { JournalEntry, EntryStatus } from '../../../core/models/journal-entry.model';
import { Account } from '../../../core/models/account.model';
import { CentsPipe } from '../../../shared/pipes/cents.pipe';
import { AccountCodePipe } from '../../../shared/pipes/account-code.pipe';

@Component({
  selector: 'app-journal-entry-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatTooltipModule,
    CentsPipe, AccountCodePipe
  ],
  template: `
    @if (entry()) {
      <div class="page-header">
        <div class="header-left">
          <h1>{{ entry()!.label }}</h1>
          <div class="header-meta">
            <span class="date">{{ entry()!.date | date:'dd/MM/yyyy' }}</span>
            <span class="statut-badge statut-{{ entry()!.statut }}">{{ statutLabel(entry()!.statut) }}</span>
            @if (entry()!.operationId) {
              <a [routerLink]="['/operations', entry()!.operationId]" class="op-link">
                → Opération #{{ entry()!.operationId }}
              </a>
            }
          </div>
        </div>

        <div class="actions">
          <!-- Workflow : Valider -->
          @if (canValider()) {
            <button class="btn-action btn-valider" (click)="valider()" [disabled]="saving()">
              <mat-icon>check_circle</mat-icon> Valider
            </button>
          }
          <!-- Workflow : Rejeter -->
          @if (canRejeter()) {
            <button class="btn-action btn-rejeter" (click)="rejeter()" [disabled]="saving()">
              <mat-icon>undo</mat-icon> Rejeter
            </button>
          }
          <!-- Workflow : Verrouiller -->
          @if (canVerrouiller()) {
            <button class="btn-action btn-verrouiller" (click)="verrouiller()" [disabled]="saving()">
              <mat-icon>lock</mat-icon> Verrouiller
            </button>
          }

          <!-- Modifier -->
          @if (canEdit()) {
            <button mat-stroked-button [routerLink]="['/journal', entry()!.id, 'edit']">
              <mat-icon>edit</mat-icon> Modifier
            </button>
          }
          <!-- Supprimer -->
          @if (canDelete()) {
            <button mat-stroked-button color="warn" (click)="confirmDelete()">
              <mat-icon>delete</mat-icon> Supprimer
            </button>
          }
        </div>
      </div>

      <mat-card>
        <mat-card-content>
          <table mat-table [dataSource]="entry()!.lines" class="full-width">
            <ng-container matColumnDef="account">
              <th mat-header-cell *matHeaderCellDef>Compte</th>
              <td mat-cell *matCellDef="let l">{{ l.accountId | accountCode:accounts() }}</td>
            </ng-container>
            <ng-container matColumnDef="debit">
              <th mat-header-cell *matHeaderCellDef class="num">Débit</th>
              <td mat-cell *matCellDef="let l" class="num">{{ l.debit | cents }}</td>
            </ng-container>
            <ng-container matColumnDef="credit">
              <th mat-header-cell *matHeaderCellDef class="num">Crédit</th>
              <td mat-cell *matCellDef="let l" class="num">{{ l.credit | cents }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols;"></tr>
          </table>

          <div class="balance" [class.balance-ok]="isBalanced()" [class.balance-error]="!isBalanced()">
            {{ isBalanced() ? '✓ Écriture équilibrée' : '✗ Écriture déséquilibrée' }}
            — Débit : {{ totalDebit() | cents }} | Crédit : {{ totalCredit() | cents }}
          </div>
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: [`
    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 16px; gap: 16px; flex-wrap: wrap;
    }
    .header-left h1 { margin: 0 0 6px; font-size: 1.4rem; }
    .header-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .date { color: #666; }
    .op-link { color: #3f51b5; text-decoration: none; }
    .op-link:hover { text-decoration: underline; }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .num { text-align: right; }
    .balance { margin-top: 12px; font-weight: 500; padding: 8px; border-radius: 4px; }
    .balance-ok    { background: #e8f5e9; color: #2e7d32; }
    .balance-error { background: #ffebee; color: #c62828; }

    .statut-badge {
      display: inline-block; padding: 2px 10px; border-radius: 20px;
      font-size: 12px; font-weight: 600;
    }
    .statut-BROUILLON  { background: #f1f5f9; color: #64748b; }
    .statut-VALIDE     { background: #dcfce7; color: #166534; }
    .statut-VERROUILLE { background: #fee2e2; color: #b91c1c; }

    .btn-action {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 7px 16px; border-radius: 8px; border: none; cursor: pointer;
      font-size: 0.875rem; font-weight: 500; font-family: inherit;
      transition: all 0.15s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:disabled { opacity: 0.55; cursor: not-allowed; }
    }
    .btn-valider {
      background: #dcfce7; color: #166534;
      &:hover:not(:disabled) { background: #bbf7d0; }
    }
    .btn-rejeter {
      background: #fef3c7; color: #92400e;
      &:hover:not(:disabled) { background: #fde68a; }
    }
    .btn-verrouiller {
      background: #fee2e2; color: #b91c1c;
      &:hover:not(:disabled) { background: #fecaca; }
    }
  `]
})
export class JournalEntryDetailComponent implements OnInit {
  private readonly journalService = inject(JournalEntryService);
  private readonly accountService = inject(AccountService);
  private readonly alertSvc       = inject(AlertService);
  private readonly auth           = inject(AuthService);
  private readonly dialog         = inject(MatDialog);
  private readonly route          = inject(ActivatedRoute);
  private readonly router         = inject(Router);

  entry    = signal<JournalEntry | null>(null);
  accounts = signal<Account[]>([]);
  saving   = signal(false);
  cols = ['account', 'debit', 'credit'];

  totalDebit  = computed(() => this.entry()?.lines.reduce((s, l) => s + l.debit,  0) ?? 0);
  totalCredit = computed(() => this.entry()?.lines.reduce((s, l) => s + l.credit, 0) ?? 0);
  isBalanced  = computed(() => this.totalDebit() === this.totalCredit());

  // ── Permissions ─────────────────────────────────────────────────────────────
  private readonly statut     = computed(() => this.entry()?.statut ?? 'BROUILLON');
  private readonly role       = computed(() => this.auth.currentUser()?.role);
  private readonly isAuditeur = computed(() => this.role() === 'AUDITEUR');

  canEdit      = computed(() => !this.isAuditeur() && this.statut() !== 'VERROUILLE');
  canDelete    = computed(() => !this.isAuditeur() && this.statut() === 'BROUILLON');

  canValider   = computed(() =>
    this.statut() === 'BROUILLON' &&
    ['ADMIN', 'DAF', 'CHEF_COMPTABLE', 'COMPTABLE'].includes(this.role() ?? '')
  );
  canRejeter   = computed(() =>
    this.statut() === 'VALIDE' &&
    ['ADMIN', 'DAF', 'CHEF_COMPTABLE', 'COMPTABLE'].includes(this.role() ?? '')
  );
  canVerrouiller = computed(() =>
    this.statut() === 'VALIDE' &&
    ['ADMIN', 'DAF', 'CHEF_COMPTABLE'].includes(this.role() ?? '')
  );

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.journalService.getById(+id).subscribe(e => this.entry.set(e));
    this.accountService.getAll().subscribe(list => this.accounts.set(list));
  }

  statutLabel(s: EntryStatus): string {
    if (s === 'BROUILLON') return 'Brouillon';
    if (s === 'VALIDE') return 'Validé';
    return 'Verrouillé';
  }

  valider(): void {
    this.saving.set(true);
    this.journalService.valider(this.entry()!.id).subscribe({
      next: updated => { this.entry.set(updated); this.alertSvc.success('Écriture validée'); this.saving.set(false); },
      error: err    => { this.alertSvc.error(err?.error?.message ?? 'Erreur'); this.saving.set(false); },
    });
  }

  rejeter(): void {
    this.saving.set(true);
    this.journalService.rejeter(this.entry()!.id).subscribe({
      next: updated => { this.entry.set(updated); this.alertSvc.success('Écriture rejetée en brouillon'); this.saving.set(false); },
      error: err    => { this.alertSvc.error(err?.error?.message ?? 'Erreur'); this.saving.set(false); },
    });
  }

  verrouiller(): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Verrouiller l\'écriture', message: 'Cette action est irréversible. Verrouiller ?' }
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.saving.set(true);
      this.journalService.verrouiller(this.entry()!.id).subscribe({
        next: updated => { this.entry.set(updated); this.alertSvc.success('Écriture verrouillée'); this.saving.set(false); },
        error: err    => { this.alertSvc.error(err?.error?.message ?? 'Erreur'); this.saving.set(false); },
      });
    });
  }

  confirmDelete(): void {
    const e = this.entry()!;
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Supprimer l\'écriture', message: `Supprimer "${e.label}" ?` }
    }).afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.journalService.delete(e.id).subscribe({
          next: () => { this.alertSvc.success('Écriture supprimée'); this.router.navigate(['/journal']); }
        });
      }
    });
  }
}
