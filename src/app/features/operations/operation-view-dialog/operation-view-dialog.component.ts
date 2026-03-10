import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OperationService } from '../../../core/services/operation.service';
import { Operation } from '../../../core/models/operation.model';
import { CentsPipe } from '../../../shared/pipes/cents.pipe';
import { OperationTypePipe } from '../../../shared/pipes/operation-type.pipe';
import { OPERATION_TYPE_CONFIG } from '../../../core/utils/operation-type.utils';

@Component({
  selector: 'app-operation-view-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule, MatIconModule, MatDialogModule, MatProgressSpinnerModule,
    CentsPipe, OperationTypePipe,
  ],
  template: `
    <div class="dlg">
      <div class="dlg-header">
        @if (operation()) {
          <span class="badge" [ngClass]="typeConfig[operation()!.type]?.colorClass">
            <mat-icon>{{ typeConfig[operation()!.type]?.icon }}</mat-icon>
            {{ operation()!.type | operationType }}
          </span>
          <div class="dlg-title">{{ operation()!.label }}</div>
          <span class="dlg-date">{{ operation()!.date | date:'dd/MM/yyyy' }}</span>
          <span class="dlg-amount">{{ operation()!.amount | cents }}</span>
        } @else {
          <div class="dlg-title">Opération</div>
        }
        <button mat-icon-button (click)="close()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="dlg-body">
        @if (!operation()) {
          <div class="loading"><mat-spinner diameter="36"></mat-spinner></div>
        } @else {
          @if (!operation()!.entries?.length) {
            <div class="no-entries">
              <mat-icon>inbox</mat-icon>
              <span>Aucune écriture associée</span>
            </div>
          }
          @for (entry of (operation()!.entries ?? []); track entry.id; let ei = $index) {
            <div class="entry-block">
              <div class="entry-title">Écriture {{ ei + 1 }} — {{ entry.label }}</div>
              <table class="lines-table">
                <thead>
                  <tr><th>Compte</th><th class="num">Débit</th><th class="num">Crédit</th></tr>
                </thead>
                <tbody>
                  @for (line of entry.lines; track line.id) {
                    <tr>
                      <td>{{ line.accountId }}</td>
                      <td class="num">{{ line.debit | cents }}</td>
                      <td class="num">{{ line.credit | cents }}</td>
                    </tr>
                  }
                  <tr class="subtotal">
                    <td><strong>Sous-total</strong></td>
                    <td class="num">{{ entryDebit(entry) | cents }}</td>
                    <td class="num">{{ entryCredit(entry) | cents }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          }

          <div class="totals">
            <span>Total Débit : <strong>{{ totalDebit() | cents }}</strong></span>
            <span>Total Crédit : <strong>{{ totalCredit() | cents }}</strong></span>
            <span [class.balance-ok]="totalDebit() === totalCredit()"
                  [class.balance-error]="totalDebit() !== totalCredit()">
              {{ totalDebit() === totalCredit() ? 'Équilibré' : 'Déséquilibré' }}
            </span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .dlg { min-width: 480px; max-width: 640px; display: flex; flex-direction: column; }

    .dlg-header {
      display: flex; align-items: center; gap: 10px; padding: 20px 20px 12px;
      border-bottom: 1px solid #eee; flex-wrap: wrap;
    }
    .dlg-title { font-size: 16px; font-weight: 700; color: #0d1b2a; flex: 1; }
    .dlg-date   { font-size: 13px; color: #78909c; }
    .dlg-amount { font-size: 14px; font-weight: 700; color: #1565c0; }
    .close-btn  { margin-left: auto; }
    .no-entries {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      padding: 32px; color: #b0bec5; font-size: 13px;
      mat-icon { font-size: 32px; width: 32px; height: 32px; opacity: .4; }
    }

    .dlg-body { padding: 16px 20px 20px; overflow-y: auto; max-height: 60vh; }

    .loading { display: flex; justify-content: center; padding: 32px; }

    .entry-block { margin-bottom: 16px; }
    .entry-title { font-size: 13px; font-weight: 600; color: #546e7a; margin-bottom: 8px; }

    .lines-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .lines-table th, .lines-table td {
      padding: 6px 10px; border-bottom: 1px solid #f0f4f8; text-align: left;
    }
    .lines-table th { font-size: 11px; color: #90a4ae; font-weight: 600; text-transform: uppercase; }
    .lines-table .num { text-align: right; }
    .subtotal td { font-weight: 600; background: #f8fafc; }

    .totals {
      display: flex; gap: 20px; padding: 12px 0 0; border-top: 2px solid #e8edf2;
      font-size: 13px; flex-wrap: wrap;
    }
    .balance-ok    { color: #2e7d32; font-weight: 700; }
    .balance-error { color: #c62828; font-weight: 700; }
  `],
})
export class OperationViewDialogComponent implements OnInit {
  private opService  = inject(OperationService);
  private dialogRef  = inject(MatDialogRef<OperationViewDialogComponent>);
  private data       = inject(MAT_DIALOG_DATA) as { operationId: number };

  operation  = signal<Operation | null>(null);
  typeConfig = OPERATION_TYPE_CONFIG;

  totalDebit  = computed(() => this.operation()?.entries?.flatMap(e => e.lines ?? []).reduce((s, l) => s + l.debit, 0) ?? 0);
  totalCredit = computed(() => this.operation()?.entries?.flatMap(e => e.lines ?? []).reduce((s, l) => s + l.credit, 0) ?? 0);

  ngOnInit(): void {
    this.opService.getById(this.data.operationId).subscribe(op => this.operation.set(op));
  }

  entryDebit(entry: any): number  { return entry.lines.reduce((s: number, l: any) => s + l.debit, 0); }
  entryCredit(entry: any): number { return entry.lines.reduce((s: number, l: any) => s + l.credit, 0); }

  close(): void { this.dialogRef.close(); }
}
