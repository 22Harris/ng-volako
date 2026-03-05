import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { JournalEntryService } from '../../../core/services/journal-entry.service';
import { AccountService } from '../../../core/services/account.service';
import { AlertService } from '../../../shared/components/alert/alert.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { JournalEntry } from '../../../core/models/journal-entry.model';
import { Account } from '../../../core/models/account.model';
import { CentsPipe } from '../../../shared/pipes/cents.pipe';
import { AccountCodePipe } from '../../../shared/pipes/account-code.pipe';

@Component({
  selector: 'app-journal-entry-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule, MatTableModule,
    CentsPipe, AccountCodePipe
  ],
  template: `
    @if (entry()) {
      <div class="page-header">
        <div>
          <h1>{{ entry()!.label }}</h1>
          <span class="date">{{ entry()!.date | date:'dd/MM/yyyy' }}</span>
          @if (entry()!.operationId) {
            <a [routerLink]="['/operations', entry()!.operationId]" class="op-link">
              → Opération #{{ entry()!.operationId }}
            </a>
          }
        </div>
        <div class="actions">
          <button mat-stroked-button [routerLink]="['/journal', entry()!.id, 'edit']">
            <mat-icon>edit</mat-icon> Modifier
          </button>
          <button mat-stroked-button color="warn" (click)="confirmDelete()">
            <mat-icon>delete</mat-icon> Supprimer
          </button>
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
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
    .date { color: #666; margin-right: 12px; }
    .op-link { color: #3f51b5; text-decoration: none; }
    .op-link:hover { text-decoration: underline; }
    .actions { display: flex; gap: 8px; }
    .num { text-align: right; }
    .balance { margin-top: 12px; font-weight: 500; padding: 8px; border-radius: 4px; }
    .balance-ok    { background: #e8f5e9; color: #2e7d32; }
    .balance-error { background: #ffebee; color: #c62828; }
  `]
})
export class JournalEntryDetailComponent implements OnInit {
  private journalService = inject(JournalEntryService);
  private accountService = inject(AccountService);
  private alertSvc       = inject(AlertService);
  private dialog         = inject(MatDialog);
  private route          = inject(ActivatedRoute);
  private router         = inject(Router);

  entry    = signal<JournalEntry | null>(null);
  accounts = signal<Account[]>([]);
  cols = ['account', 'debit', 'credit'];

  totalDebit  = computed(() => this.entry()?.lines.reduce((s, l) => s + l.debit,  0) ?? 0);
  totalCredit = computed(() => this.entry()?.lines.reduce((s, l) => s + l.credit, 0) ?? 0);
  isBalanced  = computed(() => this.totalDebit() === this.totalCredit());

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.journalService.getById(+id).subscribe(e => this.entry.set(e));
    this.accountService.getAll().subscribe(list => this.accounts.set(list));
  }

  confirmDelete(): void {
    const e = this.entry()!;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Supprimer l\'écriture', message: `Supprimer "${e.label}" ?` }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.journalService.delete(e.id).subscribe({
          next: () => {
            this.alertSvc.success('Écriture supprimée');
            this.router.navigate(['/journal']);
          }
        });
      }
    });
  }
}
