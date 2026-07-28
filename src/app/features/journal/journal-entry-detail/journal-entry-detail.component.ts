import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { JournalEntryService } from '../../../core/services/journal-entry.service';
import { AccountService } from '../../../core/services/account.service';
import { AlertService } from '../../../shared/components/alert/alert.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { JournalEntry, EntryStatus } from '../../../core/models/journal-entry.model';
import { JournalLine } from '../../../core/models/journal-line.model';
import { Account } from '../../../core/models/account.model';
import { CentsPipe } from '../../../shared/pipes/cents.pipe';
import { AccountCodePipe } from '../../../shared/pipes/account-code.pipe';

@Component({
  selector: 'app-journal-entry-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatTooltipModule, MatCheckboxModule,
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
            @if (entry()!.pieceNumber) {
              <span class="piece">{{ entry()!.pieceNumber }}</span>
            }
            @if (entry()!.operationId) {
              <a [routerLink]="['/operations', entry()!.operationId]" class="op-link">
                → Opération #{{ entry()!.operationId }}
              </a>
            }
          </div>
        </div>

        <div class="actions">
          @if (canValider()) {
            <button class="btn-action btn-valider" (click)="valider()" [disabled]="saving()">
              <mat-icon>check_circle</mat-icon> Valider
            </button>
          }
          @if (canRejeter()) {
            <button class="btn-action btn-rejeter" (click)="rejeter()" [disabled]="saving()">
              <mat-icon>undo</mat-icon> Rejeter
            </button>
          }
          @if (canVerrouiller()) {
            <button class="btn-action btn-verrouiller" (click)="verrouiller()" [disabled]="saving()">
              <mat-icon>lock</mat-icon> Verrouiller
            </button>
          }
          @if (canEdit()) {
            <button mat-stroked-button [routerLink]="['/journal', entry()!.id, 'edit']">
              <mat-icon>edit</mat-icon> Modifier
            </button>
          }
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

            <ng-container matColumnDef="select">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let l">
                @if (!l.lettre) {
                  <mat-checkbox
                    [checked]="isSelected(l)"
                    (change)="toggleLine(l)"
                    [disabled]="saving()">
                  </mat-checkbox>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="lettre">
              <th mat-header-cell *matHeaderCellDef>Lettre</th>
              <td mat-cell *matCellDef="let l">
                @if (l.lettre) {
                  <span class="lettre-badge">{{ l.lettre }}</span>
                }
              </td>
            </ng-container>

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

            <tr mat-header-row *matHeaderRowDef="displayedCols()"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedCols();"></tr>
          </table>

          <div class="balance" [class.balance-ok]="isBalanced()" [class.balance-error]="!isBalanced()">
            {{ isBalanced() ? '✓ Écriture équilibrée' : '✗ Écriture déséquilibrée' }}
            — Débit : {{ totalDebit() | cents }} | Crédit : {{ totalCredit() | cents }}
          </div>

          @if (canLettrer() && selectedLines().length >= 2) {
            <div class="lettrage-bar">
              <span>{{ selectedLines().length }} ligne(s) sélectionnée(s)</span>
              <button class="btn-action btn-lettrer" (click)="lettrer()" [disabled]="saving()">
                <mat-icon>link</mat-icon> Lettrer
              </button>
            </div>
          }
          @if (canLettrer() && selectedLettredLines().length > 0) {
            <div class="lettrage-bar lettrage-bar--secondary">
              <span>{{ selectedLettredLines().length }} ligne(s) lettrée(s) sélectionnée(s)</span>
              <button class="btn-action btn-delettrer" (click)="delettrer()" [disabled]="saving()">
                <mat-icon>link_off</mat-icon> Délettrer
              </button>
            </div>
          }
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
    .date, .piece { color: #666; }
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

    .lettre-badge {
      display: inline-block; padding: 1px 8px; border-radius: 4px;
      background: #dbeafe; color: #1d4ed8; font-size: 12px; font-weight: 700;
    }

    .btn-action {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 7px 16px; border-radius: 8px; border: none; cursor: pointer;
      font-size: 0.875rem; font-weight: 500; font-family: inherit;
      transition: all 0.15s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:disabled { opacity: 0.55; cursor: not-allowed; }
    }
    .btn-valider     { background: #dcfce7; color: #166534; &:hover:not(:disabled) { background: #bbf7d0; } }
    .btn-rejeter     { background: #fef3c7; color: #92400e; &:hover:not(:disabled) { background: #fde68a; } }
    .btn-verrouiller { background: #fee2e2; color: #b91c1c; &:hover:not(:disabled) { background: #fecaca; } }
    .btn-lettrer     { background: #dbeafe; color: #1d4ed8; &:hover:not(:disabled) { background: #bfdbfe; } }
    .btn-delettrer   { background: #f1f5f9; color: #475569; &:hover:not(:disabled) { background: #e2e8f0; } }

    .lettrage-bar {
      margin-top: 12px; padding: 10px 12px; border-radius: 8px;
      background: #f8fafc; border: 1px solid #e2e8f0;
      display: flex; align-items: center; gap: 12px;
      span { color: #475569; font-size: 0.875rem; }
    }
    .lettrage-bar--secondary { margin-top: 6px; }
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
  selectedLines = signal<JournalLine[]>([]);

  totalDebit  = computed(() => this.entry()?.lines.reduce((s, l) => s + l.debit,  0) ?? 0);
  totalCredit = computed(() => this.entry()?.lines.reduce((s, l) => s + l.credit, 0) ?? 0);
  isBalanced  = computed(() => this.totalDebit() === this.totalCredit());
  selectedLettredLines = computed(() => this.selectedLines().filter(l => l.lettre));

  private readonly statut     = computed(() => this.entry()?.statut ?? 'BROUILLON');
  private readonly role       = computed(() => this.auth.currentUser()?.role);
  private readonly isAuditeur = computed(() => this.role() === 'AUDITEUR');

  canEdit        = computed(() => !this.isAuditeur() && this.statut() !== 'VERROUILLE');
  canDelete      = computed(() => !this.isAuditeur() && this.statut() === 'BROUILLON');
  canLettrer     = computed(() => !this.isAuditeur() && this.statut() === 'VALIDE');
  canValider     = computed(() =>
    this.statut() === 'BROUILLON' &&
    ['ADMIN', 'DAF', 'CHEF_COMPTABLE', 'COMPTABLE'].includes(this.role() ?? '')
  );
  canRejeter     = computed(() =>
    this.statut() === 'VALIDE' &&
    ['ADMIN', 'DAF', 'CHEF_COMPTABLE', 'COMPTABLE'].includes(this.role() ?? '')
  );
  canVerrouiller = computed(() =>
    this.statut() === 'VALIDE' &&
    ['ADMIN', 'DAF', 'CHEF_COMPTABLE'].includes(this.role() ?? '')
  );
  displayedCols  = computed(() => {
    const base = ['lettre', 'account', 'debit', 'credit'];
    return this.canLettrer() ? ['select', ...base] : base;
  });

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

  isSelected(line: JournalLine): boolean {
    return this.selectedLines().some(l => l.id === line.id);
  }

  toggleLine(line: JournalLine): void {
    const current = this.selectedLines();
    const idx = current.findIndex(l => l.id === line.id);
    this.selectedLines.set(idx >= 0 ? current.filter(l => l.id !== line.id) : [...current, line]);
  }

  lettrer(): void {
    const ids = this.selectedLines().map(l => l.id!);
    this.saving.set(true);
    this.journalService.lettrer(ids).subscribe({
      next: ({ lettre }) => {
        this.alertSvc.success(`Lignes lettrées avec la lettre ${lettre}`);
        this.selectedLines.set([]);
        this.journalService.getById(this.entry()!.id).subscribe(e => this.entry.set(e));
        this.saving.set(false);
      },
      error: err => { this.alertSvc.error(err?.error?.message ?? 'Erreur de lettrage'); this.saving.set(false); },
    });
  }

  delettrer(): void {
    const ids = this.selectedLettredLines().map(l => l.id!);
    this.saving.set(true);
    this.journalService.delettrer(ids).subscribe({
      next: () => {
        this.alertSvc.success('Lignes delettrées');
        this.selectedLines.set([]);
        this.journalService.getById(this.entry()!.id).subscribe(e => this.entry.set(e));
        this.saving.set(false);
      },
      error: err => { this.alertSvc.error(err?.error?.message ?? 'Erreur'); this.saving.set(false); },
    });
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
