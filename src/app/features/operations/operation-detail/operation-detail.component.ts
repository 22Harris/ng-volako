import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { OperationService } from '../../../core/services/operation.service';
import { AlertService } from '../../../shared/components/alert/alert.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Operation } from '../../../core/models/operation.model';
import { CentsPipe } from '../../../shared/pipes/cents.pipe';
import { OperationTypePipe } from '../../../shared/pipes/operation-type.pipe';
import { OPERATION_TYPE_CONFIG } from '../../../core/utils/operation-type.utils';

@Component({
  selector: 'app-operation-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatDividerModule,
    CentsPipe, OperationTypePipe
  ],
  template: `
    @if (operation()) {
      <div class="page-header">
        <div class="title-row">
          <span class="badge" [ngClass]="typeConfig[operation()!.type]?.colorClass">
            <mat-icon>{{ typeConfig[operation()!.type]?.icon }}</mat-icon>
            {{ operation()!.type | operationType }}
          </span>
          <h1>{{ operation()!.label }}</h1>
          <span class="date">{{ operation()!.date | date:'dd/MM/yyyy' }}</span>
        </div>
        <div class="actions">
          <button mat-stroked-button [routerLink]="['/operations', operation()!.id, 'edit']">
            <mat-icon>edit</mat-icon> Modifier
          </button>
          <button mat-stroked-button color="warn" (click)="confirmDelete()">
            <mat-icon>delete</mat-icon> Supprimer
          </button>
          <button mat-stroked-button (click)="print()">
            <mat-icon>print</mat-icon> Imprimer
          </button>
        </div>
      </div>

      @for (entry of operation()!.entries; track entry.id; let ei = $index) {
        <mat-card class="entry-card">
          <mat-card-header>
            <mat-card-title>Écriture {{ ei + 1 }} — {{ entry.label }}</mat-card-title>
            <mat-card-subtitle>{{ entry.date | date:'dd/MM/yyyy' }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="entry.lines" class="full-width">
              <ng-container matColumnDef="accountId">
                <th mat-header-cell *matHeaderCellDef>Compte</th>
                <td mat-cell *matCellDef="let l">{{ l.accountId }}</td>
              </ng-container>
              <ng-container matColumnDef="debit">
                <th mat-header-cell *matHeaderCellDef class="num">Débit</th>
                <td mat-cell *matCellDef="let l" class="num">{{ l.debit | cents }}</td>
              </ng-container>
              <ng-container matColumnDef="credit">
                <th mat-header-cell *matHeaderCellDef class="num">Crédit</th>
                <td mat-cell *matCellDef="let l" class="num">{{ l.credit | cents }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="lineColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: lineColumns;"></tr>
              <tr class="mat-row totals-row">
                <td class="mat-cell"><strong>Sous-total</strong></td>
                <td class="mat-cell num">{{ entryDebit(entry) | cents }}</td>
                <td class="mat-cell num">{{ entryCredit(entry) | cents }}</td>
              </tr>
            </table>
          </mat-card-content>
        </mat-card>
      }

      <!-- Grand total -->
      <mat-card class="totals-card">
        <mat-card-content>
          <div class="totals">
            <span>Total Débit : <strong>{{ totalDebit() | cents }}</strong></span>
            <span>Total Crédit : <strong>{{ totalCredit() | cents }}</strong></span>
            <span [class.balance-ok]="totalDebit() === totalCredit()" [class.balance-error]="totalDebit() !== totalCredit()">
              {{ totalDebit() === totalCredit() ? 'Équilibré' : 'Déséquilibré' }}
            </span>
          </div>
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: [`
    .page-header { margin-bottom: 16px; }
    .title-row { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
    .title-row h1 { margin: 0; }
    .date { color: #666; }
    .actions { display: flex; gap: 8px; }
    .entry-card { margin-bottom: 16px; }
    .num { text-align: right; }
    .totals-row td { font-weight: 600; }
    .totals-card { background: #f5f5f5; }
    .totals { display: flex; gap: 24px; align-items: center; flex-wrap: wrap; }
  `]
})
export class OperationDetailComponent implements OnInit {
  private opService = inject(OperationService);
  private alertSvc  = inject(AlertService);
  private dialog    = inject(MatDialog);
  private route     = inject(ActivatedRoute);
  private router    = inject(Router);

  operation  = signal<Operation | null>(null);
  lineColumns = ['accountId', 'debit', 'credit'];
  typeConfig  = OPERATION_TYPE_CONFIG;

  totalDebit  = computed(() => this.operation()?.entries.flatMap(e => e.lines).reduce((s, l) => s + l.debit, 0) ?? 0);
  totalCredit = computed(() => this.operation()?.entries.flatMap(e => e.lines).reduce((s, l) => s + l.credit, 0) ?? 0);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.opService.getById(+id).subscribe(op => this.operation.set(op));
  }

  entryDebit(entry: any): number   { return entry.lines.reduce((s: number, l: any) => s + l.debit, 0); }
  entryCredit(entry: any): number  { return entry.lines.reduce((s: number, l: any) => s + l.credit, 0); }

  print(): void { window.print(); }

  confirmDelete(): void {
    const op = this.operation()!;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Supprimer l\'opération', message: `Supprimer "${op.label}" ?` }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.opService.delete(op.id).subscribe({
          next: () => {
            this.alertSvc.success('Opération supprimée');
            this.router.navigate(['/operations']);
          }
        });
      }
    });
  }
}
