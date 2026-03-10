import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { JournalEntryService } from '../../../core/services/journal-entry.service';
import { AccountService } from '../../../core/services/account.service';
import { JournalEntry } from '../../../core/models/journal-entry.model';
import { Account } from '../../../core/models/account.model';
import { CentsPipe } from '../../../shared/pipes/cents.pipe';
import { AccountCodePipe } from '../../../shared/pipes/account-code.pipe';
import { AppDateInputComponent } from '../../../shared/components/date-input/date-input.component';

interface FlatLine {
  date: string;
  entryLabel: string;
  entryId: number;
  accountId: number;
  debit: number;
  credit: number;
}

@Component({
  selector: 'app-journal-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    CentsPipe,
    AccountCodePipe,
    AppDateInputComponent,
  ],
  template: `
    <div class="page">

      <!-- ── Header ── -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Grand Livre</h1>
          <p class="page-sub">{{ filteredLines().length }} ligne(s) · Journal des écritures</p>
        </div>
        <button class="btn-export" (click)="exportCsv()">
          <mat-icon>download</mat-icon>
          Exporter CSV
        </button>
      </div>

      <!-- ── Filtres ── -->
      <div class="filters-card">
        <form [formGroup]="filterForm" class="filters">

          <div class="filter-group">
            <mat-icon class="filter-icon">manage_search</mat-icon>
            <input class="filter-input" type="text" placeholder="Rechercher un libellé…"
              formControlName="label" (input)="applyFilters()" />
          </div>

          <div class="filter-group">
            <mat-icon class="filter-icon">account_tree</mat-icon>
            <select class="filter-select" formControlName="accountId" (change)="applyFilters()">
              <option [ngValue]="null">Tous les comptes</option>
              @for (acc of accounts(); track acc.id) {
                <option [ngValue]="acc.id">{{ acc.code }} – {{ acc.name }}</option>
              }
            </select>
          </div>

          <div class="filter-group">
            <mat-icon class="filter-icon">swap_vert</mat-icon>
            <select class="filter-select" formControlName="sens" (change)="applyFilters()">
              <option value="tous">Débit & Crédit</option>
              <option value="debit">Débit uniquement</option>
              <option value="credit">Crédit uniquement</option>
            </select>
          </div>

          <!-- Date range moderne -->
          <div class="date-range-group" [class.active]="filterForm.value.dateFrom || filterForm.value.dateTo">
            <div class="date-slot">
              <span class="date-slot-label">Du</span>
              <app-date-input formControlName="dateFrom" (dateSelect)="applyFilters()"></app-date-input>
            </div>
            <div class="date-range-sep">
              <mat-icon>arrow_forward</mat-icon>
            </div>
            <div class="date-slot">
              <span class="date-slot-label">Au</span>
              <app-date-input formControlName="dateTo" (dateSelect)="applyFilters()"></app-date-input>
            </div>
          </div>

          <!-- Tri par date -->
          <button class="btn-sort" type="button" (click)="toggleSort()"
            [matTooltip]="sortOrder === 'desc' ? 'Afficher les plus anciens en premier' : 'Afficher les plus récents en premier'">
            <mat-icon>{{ sortOrder === 'desc' ? 'arrow_downward' : 'arrow_upward' }}</mat-icon>
            {{ sortOrder === 'desc' ? 'Récent' : 'Ancien' }}
          </button>

          @if (hasActiveFilters()) {
            <button class="btn-reset" type="button" (click)="resetFilters()" matTooltip="Effacer les filtres">
              <mat-icon>filter_alt_off</mat-icon> Effacer
            </button>
          }
        </form>

        <!-- Barre de synthèse -->
        <div class="summary-bar">
          <div class="summary-item">
            <span class="summary-label">Lignes affichées</span>
            <span class="summary-value">{{ filteredLines().length }}</span>
          </div>
          <div class="summary-sep"></div>
          <div class="summary-item">
            <span class="summary-label">Total débit</span>
            <span class="summary-value debit-color">{{ totalDebit() | cents }}</span>
          </div>
          <div class="summary-sep"></div>
          <div class="summary-item">
            <span class="summary-label">Total crédit</span>
            <span class="summary-value credit-color">{{ totalCredit() | cents }}</span>
          </div>
          <div class="summary-sep"></div>
          <div class="summary-item">
            <span class="summary-label">Solde net</span>
            <span class="summary-value"
              [class.debit-color]="soldeNet() > 0"
              [class.credit-color]="soldeNet() < 0"
              [class.zero-color]="soldeNet() === 0">
              {{ soldeNet() | cents }}
            </span>
          </div>
          <div class="summary-sep"></div>
          <div class="summary-item">
            <span class="summary-label">Équilibre</span>
            @if (totalDebit() === totalCredit()) {
              <span class="balance-ok"><mat-icon>check_circle</mat-icon>Équilibré</span>
            } @else {
              <span class="balance-ko"><mat-icon>warning</mat-icon>Écart {{ (totalDebit() - totalCredit()) | cents }}</span>
            }
          </div>
        </div>
      </div>

      <!-- ── Zone principale : tableau + panneau détail ── -->
      <div class="main-area">

        <!-- Tableau -->
        <div class="table-card">
          <div class="table-wrap">
            <table mat-table [dataSource]="paginatedLines()" class="journal-table">

              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let row">{{ row.date | date: 'dd/MM/yyyy' }}</td>
              </ng-container>

              <ng-container matColumnDef="label">
                <th mat-header-cell *matHeaderCellDef>Libellé</th>
                <td mat-cell *matCellDef="let row">
                  <span class="entry-link">{{ row.entryLabel }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="account">
                <th mat-header-cell *matHeaderCellDef>Compte</th>
                <td mat-cell *matCellDef="let row">
                  <span class="account-chip">{{ row.accountId | accountCode: accounts() }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="debit">
                <th mat-header-cell *matHeaderCellDef class="num">Débit</th>
                <td mat-cell *matCellDef="let row" class="num">
                  @if (row.debit > 0) {
                    <span class="amount debit-amount">{{ row.debit | cents }}</span>
                  } @else {
                    <span class="amount zero">—</span>
                  }
                </td>
              </ng-container>

              <ng-container matColumnDef="credit">
                <th mat-header-cell *matHeaderCellDef class="num">Crédit</th>
                <td mat-cell *matCellDef="let row" class="num">
                  @if (row.credit > 0) {
                    <span class="amount credit-amount">{{ row.credit | cents }}</span>
                  } @else {
                    <span class="amount zero">—</span>
                  }
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                class="data-row"
                [class.row-selected]="selectedEntryId() === row.entryId"
                (click)="selectLine(row)"></tr>
            </table>

            @if (filteredLines().length === 0) {
              <div class="empty-state">
                <mat-icon>search_off</mat-icon>
                <p>Aucune ligne ne correspond aux filtres</p>
                <button class="btn-reset" type="button" (click)="resetFilters()">
                  <mat-icon>filter_alt_off</mat-icon> Effacer les filtres
                </button>
              </div>
            }
          </div>

          <!-- Barre Total fixe -->
          <div class="total-bar">
            <strong class="total-bar-label">Total</strong>
            <span class="total-bar-spacer"></span>
            <span class="total-bar-col debit-amount">{{ totalDebit() | cents }}</span>
            <span class="total-bar-col credit-amount">{{ totalCredit() | cents }}</span>
          </div>

          <!-- Pagination -->
          <div class="paginator-wrap">
            <div class="pag-info">
              <span class="pag-count">
                {{ filteredLines().length === 0 ? 0 : pageIndex() * pageSize() + 1 }}–{{ min((pageIndex() + 1) * pageSize(), filteredLines().length) }}
                <span class="pag-total">sur {{ filteredLines().length }}</span>
              </span>
            </div>
            <div class="pag-size">
              <span class="pag-size-label">Lignes :</span>
              <select class="pag-size-select" [value]="pageSize()" (change)="changePageSize($event)">
                <option [value]="10">10</option>
                <option [value]="25">25</option>
                <option [value]="50">50</option>
              </select>
            </div>
            <div class="pag-nav">
              <button class="pag-btn" (click)="goPage(0)" [disabled]="pageIndex() === 0" matTooltip="Première page">
                <mat-icon>first_page</mat-icon>
              </button>
              <button class="pag-btn" (click)="goPage(pageIndex() - 1)" [disabled]="pageIndex() === 0" matTooltip="Précédent">
                <mat-icon>chevron_left</mat-icon>
              </button>
              <span class="pag-page">{{ pageIndex() + 1 }} / {{ totalPages() }}</span>
              <button class="pag-btn" (click)="goPage(pageIndex() + 1)" [disabled]="pageIndex() >= totalPages() - 1" matTooltip="Suivant">
                <mat-icon>chevron_right</mat-icon>
              </button>
              <button class="pag-btn" (click)="goPage(totalPages() - 1)" [disabled]="pageIndex() >= totalPages() - 1" matTooltip="Dernière page">
                <mat-icon>last_page</mat-icon>
              </button>
            </div>
          </div>
        </div>

        <!-- Panneau détail (droite) -->
        @if (selectedEntry()) {
          <div class="detail-panel">

            <div class="dp-header">
              <span class="dp-tag">
                <mat-icon>menu_book</mat-icon>
                Écriture comptable
              </span>
              <button class="dp-close" (click)="selectedEntryId.set(null)" matTooltip="Fermer">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="dp-title-block">
              <h2 class="dp-title">{{ selectedEntry()!.label }}</h2>
              <span class="dp-date">
                <mat-icon>calendar_today</mat-icon>
                {{ selectedEntry()!.date | date: 'dd/MM/yyyy' }}
              </span>
            </div>

            <div class="dp-lines-section">
              <div class="dp-lines-header">
                <span class="col-account">Compte</span>
                <span class="col-num">Débit</span>
                <span class="col-num">Crédit</span>
              </div>

              @for (line of selectedEntry()!.lines; track $index) {
                <div class="dp-line">
                  <span class="col-account">
                    <span class="acct-chip">{{ line.accountId | accountCode: accounts() }}</span>
                  </span>
                  <span class="col-num" [class.pos-val]="line.debit > 0">
                    {{ line.debit > 0 ? (line.debit | cents) : '—' }}
                  </span>
                  <span class="col-num" [class.neg-val]="line.credit > 0">
                    {{ line.credit > 0 ? (line.credit | cents) : '—' }}
                  </span>
                </div>
              }

              <div class="dp-subtotal">
                <span class="col-account">Total</span>
                <span class="col-num debit-amount">{{ selectedEntryDebit() | cents }}</span>
                <span class="col-num credit-amount">{{ selectedEntryCredit() | cents }}</span>
              </div>
            </div>

            <div class="dp-balance-wrap">
              <div class="dp-balance"
                [class.ok]="selectedEntryDebit() === selectedEntryCredit()"
                [class.err]="selectedEntryDebit() !== selectedEntryCredit()">
                <mat-icon>{{ selectedEntryDebit() === selectedEntryCredit() ? 'check_circle' : 'warning' }}</mat-icon>
                {{ selectedEntryDebit() === selectedEntryCredit() ? 'Équilibré' : 'Déséquilibré' }}
              </div>
            </div>

          </div>
        }

      </div><!-- /main-area -->
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
    .page { display: flex; flex-direction: column; flex: 1; min-height: 0; gap: 16px; }

    /* ── Header ── */
    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      flex-wrap: wrap; gap: 12px; flex-shrink: 0;
    }
    .page-title { font-size: 26px; font-weight: 800; color: #0d1b2a; margin: 0 0 4px; }
    .page-sub   { font-size: 13px; color: #78909c; margin: 0; }

    .btn-export {
      display: flex; align-items: center; gap: 8px;
      height: 44px; padding: 0 18px; border-radius: 12px; cursor: pointer;
      border: 1.5px solid #dde6f0; background: white; color: #546e7a;
      font-size: 14px; font-weight: 600;
      box-shadow: 0 1px 4px rgba(13,27,42,.06);
      transition: border-color .15s, box-shadow .15s, color .15s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover { border-color: #90caf9; color: #1565c0; box-shadow: 0 2px 8px rgba(21,101,192,.12); }
    }

    /* ── Filtres ── */
    .filters-card {
      background: white; border-radius: 16px;
      box-shadow: 0 2px 8px rgba(13,27,42,.07);
      padding: 16px 20px; flex-shrink: 0;
    }
    .filters { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-bottom: 14px; }

    .filter-group {
      display: flex; align-items: center; gap: 6px;
      background: #f5f7fa; border: 1.5px solid #e8edf2;
      border-radius: 10px; padding: 0 10px; height: 38px;
      transition: border-color .15s;
      &:focus-within { border-color: #90caf9; background: #f0f7ff; }
    }
    .filter-icon { font-size: 16px; width: 16px; height: 16px; color: #90a4ae; flex-shrink: 0; }
    .filter-input {
      border: none; background: transparent; outline: none;
      font-size: 13px; color: #0d1b2a; min-width: 0;
      &::placeholder { color: #b0bec5; }
      &[type='text'] { width: 180px; }
    }
    .filter-select {
      border: none; background: transparent; outline: none;
      font-size: 13px; color: #0d1b2a; cursor: pointer;
      &:first-of-type { width: 200px; }
      width: 160px;
    }

    /* ── Date range moderne ── */
    .date-range-group {
      display: flex; align-items: center;
      background: #f5f7fa; border: 1.5px solid #e8edf2;
      border-radius: 12px; overflow: hidden;
      transition: border-color .2s, box-shadow .2s;
      &:focus-within, &.active {
        border-color: #90caf9;
        box-shadow: 0 0 0 3px rgba(144,202,249,.15);
        background: white;
      }
    }
    .date-slot { display: flex; flex-direction: column; padding: 5px 12px; min-width: 120px; }
    .date-slot-label {
      font-size: 9px; font-weight: 800; color: #90a4ae;
      text-transform: uppercase; letter-spacing: .6px; line-height: 1;
    }
    .date-slot-input {
      border: none; background: transparent; outline: none;
      font-size: 12px; color: #0d1b2a; cursor: pointer; padding: 0; font-weight: 500;
      &::-webkit-calendar-picker-indicator { opacity: .4; cursor: pointer; }
    }
    .date-range-sep {
      display: flex; align-items: center; padding: 0 6px; color: #cbd5e1;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }

    /* ── Bouton tri ── */
    .btn-sort {
      display: flex; align-items: center; gap: 6px;
      height: 38px; padding: 0 14px; border-radius: 10px; cursor: pointer;
      border: 1.5px solid #b3d9ff; background: #e3f2fd;
      color: #1565c0; font-size: 13px; font-weight: 600;
      transition: background .15s;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &:hover { background: #bbdefb; }
    }

    .btn-reset {
      display: flex; align-items: center; gap: 6px;
      height: 38px; padding: 0 14px; border-radius: 10px; cursor: pointer;
      border: 1.5px solid #ffcdd2; background: #fff5f5;
      color: #c62828; font-size: 13px; font-weight: 600;
      transition: background .15s;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &:hover { background: #fde8e8; }
    }

    /* ── Barre synthèse ── */
    .summary-bar {
      display: flex; align-items: center; gap: 0;
      background: #f8fafc; border-radius: 10px;
      border: 1px solid #e8edf2; overflow: hidden;
    }
    .summary-item {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; padding: 8px 16px; gap: 2px;
    }
    .summary-sep { width: 1px; height: 36px; background: #e8edf2; flex-shrink: 0; }
    .summary-label { font-size: 11px; color: #90a4ae; font-weight: 500; white-space: nowrap; }
    .summary-value { font-size: 13px; font-weight: 700; color: #0d1b2a; white-space: nowrap; }

    .balance-ok {
      display: flex; align-items: center; gap: 4px;
      font-size: 12px; font-weight: 700; color: #2e7d32;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }
    .balance-ko {
      display: flex; align-items: center; gap: 4px;
      font-size: 12px; font-weight: 700; color: #c62828;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }

    /* ── Zone principale ── */
    .main-area { display: flex; gap: 16px; flex: 1; min-height: 0; }

    /* ── Tableau ── */
    .table-card {
      background: white; border-radius: 16px;
      box-shadow: 0 2px 8px rgba(13,27,42,.07);
      overflow: hidden; flex: 1; min-height: 0; min-width: 0;
      display: flex; flex-direction: column;
    }
    .table-wrap { overflow-y: auto; flex: 1; min-height: 0; }
    .journal-table { width: 100%; }

    .mat-mdc-header-row {
      background: #f1f5f9 !important; position: sticky; top: 0; z-index: 3;
      border-bottom: 2px solid #dde6f0 !important;
    }
    .mat-mdc-header-cell {
      color: #475569 !important; font-size: 11px !important; font-weight: 700 !important;
      letter-spacing: .6px !important; text-transform: uppercase !important;
      border-bottom: none !important; padding: 0 16px !important; white-space: nowrap;
    }
    .mat-mdc-footer-row {
      background: #f0f4f8 !important; position: sticky; bottom: 0; z-index: 2;
      border-top: 2px solid #dde6f0 !important;
    }
    .mat-mdc-footer-cell {
      font-size: 13px !important; border-top: none !important; padding: 0 16px !important;
    }
    .mat-mdc-row {
      cursor: pointer; transition: background .1s;
      &:nth-child(even) { background: #fafbfc; }
      &:hover { background: #eef4fb !important; }
      &.row-selected {
        background: #e3f2fd !important;
        border-right: 3px solid #1565c0;
      }
    }
    .mat-mdc-cell {
      font-size: 13px !important; color: #263238 !important;
      padding: 0 16px !important; border-bottom: 1px solid #f0f4f8 !important;
      height: 46px !important;
    }

    .entry-link { color: #1565c0; font-weight: 500; }
    .account-chip {
      display: inline-block; padding: 2px 8px;
      background: #e8f0fe; color: #1a237e;
      border-radius: 6px; font-size: 12px; font-weight: 600; white-space: nowrap;
    }
    .amount { font-variant-numeric: tabular-nums; font-weight: 600; }
    .debit-amount  { color: #1b5e20; }
    .credit-amount { color: #0d47a1; }
    .debit-color   { color: #2e7d32; }
    .credit-color  { color: #1565c0; }
    .zero-color    { color: #90a4ae; }
    .zero          { color: #cfd8dc; }
    .num           { text-align: right !important; }

    /* ── Barre Total ── */
    .total-bar {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 16px; flex-shrink: 0;
      background: #f0f4f8; border-top: 2px solid #dde6f0;
      font-size: 13px; font-variant-numeric: tabular-nums;
    }
    .total-bar-label { font-weight: 700; color: #475569; }
    .total-bar-spacer { flex: 1; }
    .total-bar-col { width: 120px; text-align: right; font-weight: 700; flex-shrink: 0; }

    /* ── Pagination ── */
    .paginator-wrap {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 16px; border-top: 1px solid #f0f4f8; flex-shrink: 0;
      background: #fafbfc; gap: 12px; flex-wrap: wrap;
    }
    .pag-count { font-size: 13px; font-weight: 700; color: #0d1b2a; font-variant-numeric: tabular-nums; }
    .pag-total { font-weight: 400; color: #90a4ae; }
    .pag-size  { display: flex; align-items: center; gap: 8px; }
    .pag-size-label { font-size: 12px; color: #78909c; white-space: nowrap; }
    .pag-size-select {
      height: 32px; padding: 0 10px; border-radius: 8px;
      border: 1.5px solid #e2e8f0; background: white;
      font-size: 13px; font-weight: 600; color: #0d1b2a; cursor: pointer;
      outline: none; transition: border-color .15s;
      &:focus { border-color: #90caf9; }
    }
    .pag-nav { display: flex; align-items: center; gap: 4px; }
    .pag-btn {
      width: 32px; height: 32px; border-radius: 8px;
      border: 1.5px solid #e2e8f0; background: white; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #546e7a; transition: all .15s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover:not(:disabled) { border-color: #90caf9; background: #e3f2fd; color: #1565c0; }
      &:disabled { opacity: .35; cursor: not-allowed; }
    }
    .pag-page { font-size: 12px; font-weight: 700; color: #475569; padding: 0 10px; white-space: nowrap; }

    /* ── État vide ── */
    .empty-state {
      text-align: center; padding: 48px 24px; color: #90a4ae;
      display: flex; flex-direction: column; align-items: center; gap: 12px;
      mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: .4; }
      p { margin: 0; font-size: 14px; }
    }

    /* ── Panneau détail (droite) ── */
    .detail-panel {
      width: 360px; min-width: 360px; flex-shrink: 0;
      background: white; border-radius: 16px;
      box-shadow: 0 4px 24px rgba(13,27,42,.14);
      display: flex; flex-direction: column; overflow: hidden;
      animation: slideIn .22s cubic-bezier(.22,.68,0,1.2);
    }
    @keyframes slideIn {
      from { transform: translateX(20px); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }

    .dp-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 16px 0; flex-shrink: 0;
    }
    .dp-tag {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 4px 10px; background: #e8f0fe; color: #1a237e;
      border-radius: 8px; font-size: 12px; font-weight: 700;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }
    .dp-close {
      width: 30px; height: 30px; border-radius: 8px;
      border: 1.5px solid #e8edf2; background: white; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #90a4ae; transition: all .15s; flex-shrink: 0;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &:hover { border-color: #cfd8dc; color: #546e7a; background: #f5f7fa; }
    }

    .dp-title-block {
      padding: 12px 16px 14px; border-bottom: 1px solid #f0f4f8; flex-shrink: 0;
    }
    .dp-title { font-size: 15px; font-weight: 800; color: #0d1b2a; margin: 0 0 6px; line-height: 1.3; }
    .dp-date {
      display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: #78909c;
      mat-icon { font-size: 13px; width: 13px; height: 13px; }
    }

    .dp-lines-section {
      flex: 1; overflow-y: auto; display: flex; flex-direction: column;
    }
    .dp-lines-header {
      display: flex; padding: 8px 16px;
      font-size: 10px; font-weight: 700; color: #90a4ae;
      text-transform: uppercase; letter-spacing: .5px;
      background: #f8fafc; border-bottom: 1px solid #e8edf2;
      flex-shrink: 0;
    }
    .dp-line {
      display: flex; padding: 8px 16px; font-size: 12px; color: #263238;
      border-bottom: 1px solid #f5f7fa;
      transition: background .1s;
      &:hover { background: #eef4fb; }
    }
    .dp-subtotal {
      display: flex; padding: 8px 16px;
      font-size: 12px; font-weight: 700; color: #475569;
      background: #f1f5f9; border-top: 2px solid #dde6f0;
      flex-shrink: 0;
    }
    .col-account {
      flex: 1; min-width: 0; display: flex; align-items: center;
      gap: 6px; overflow: hidden;
    }
    .col-num {
      width: 96px; text-align: right; font-variant-numeric: tabular-nums;
      flex-shrink: 0; font-size: 11px;
    }
    .acct-chip {
      display: inline-block; padding: 2px 6px; background: #e8f0fe; color: #1a237e;
      border-radius: 5px; font-size: 11px; font-weight: 700; font-family: monospace;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;
    }
    .pos-val { color: #1b5e20; font-weight: 700; }
    .neg-val { color: #b71c1c; font-weight: 700; }

    .dp-balance-wrap {
      padding: 12px 16px; border-top: 1px solid #f0f4f8; flex-shrink: 0;
    }
    .dp-balance {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; font-weight: 700; padding: 10px 14px;
      border-radius: 10px;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &.ok  { color: #2e7d32; background: #f1f8f1; }
      &.err { color: #c62828; background: #fef0f0; }
    }

    @media (max-width: 900px) {
      .main-area { flex-direction: column; }
      .detail-panel { width: 100%; min-width: 0; }
    }
    @media (max-width: 768px) {
      .filters { gap: 8px; }
      .filter-input[type='text'] { width: 140px; }
      .filter-select { width: 130px; }
      .summary-item { padding: 6px 10px; }
    }
  `],
})
export class JournalListComponent implements OnInit {
  private readonly journalService = inject(JournalEntryService);
  private readonly accountService = inject(AccountService);
  private readonly fb = inject(FormBuilder);

  entries  = signal<JournalEntry[]>([]);
  accounts = signal<Account[]>([]);
  filteredLines   = signal<FlatLine[]>([]);
  selectedEntryId = signal<number | null>(null);

  sortOrder: 'desc' | 'asc' = 'desc';
  pageSize  = signal(10);
  pageIndex = signal(0);

  displayedColumns = ['date', 'label', 'account', 'debit', 'credit'];

  filterForm = this.fb.group({
    accountId: [null as number | null],
    dateFrom:  [''],
    dateTo:    [''],
    label:     [''],
    sens:      ['tous'],
  });

  filterValues = toSignal(this.filterForm.valueChanges, { initialValue: this.filterForm.value });

  paginatedLines = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredLines().slice(start, start + this.pageSize());
  });

  selectedEntry = computed(() =>
    this.entries().find(e => e.id === this.selectedEntryId()) ?? null
  );

  selectedEntryDebit  = computed(() =>
    this.selectedEntry()?.lines.reduce((s, l) => s + l.debit, 0) ?? 0
  );
  selectedEntryCredit = computed(() =>
    this.selectedEntry()?.lines.reduce((s, l) => s + l.credit, 0) ?? 0
  );

  totalDebit  = computed(() => this.filteredLines().reduce((s, r) => s + r.debit,  0));
  totalCredit = computed(() => this.filteredLines().reduce((s, r) => s + r.credit, 0));
  soldeNet    = computed(() => this.totalDebit() - this.totalCredit());
  totalPages  = computed(() => Math.max(1, Math.ceil(this.filteredLines().length / this.pageSize())));

  hasActiveFilters = computed(() => {
    const f = this.filterValues();
    return !!(f.accountId || f.dateFrom || f.dateTo || f.label || f.sens !== 'tous');
  });

  ngOnInit(): void {
    this.journalService.getAll().subscribe(list => {
      this.entries.set(list);
      this.applyFilters();
    });
    this.accountService.getAll().subscribe(list => this.accounts.set(list));
  }

  applyFilters(): void {
    const f = this.filterForm.value;
    const labelSearch = (f.label ?? '').toLowerCase().trim();

    const result = this.entries()
      .slice()
      .sort((a, b) =>
        this.sortOrder === 'desc'
          ? b.date.localeCompare(a.date)
          : a.date.localeCompare(b.date)
      )
      .flatMap(entry =>
        entry.lines.map(l => ({
          date:       entry.date,
          entryLabel: entry.label,
          entryId:    entry.id,
          accountId:  l.accountId,
          debit:      l.debit,
          credit:     l.credit,
        } as FlatLine))
      )
      .filter(row => {
        if (f.accountId && row.accountId !== f.accountId)               return false;
        if (f.dateFrom  && row.date < f.dateFrom)                        return false;
        if (f.dateTo    && row.date > f.dateTo)                         return false;
        if (labelSearch && !row.entryLabel.toLowerCase().includes(labelSearch)) return false;
        if (f.sens === 'debit'  && row.debit  === 0)                    return false;
        if (f.sens === 'credit' && row.credit === 0)                    return false;
        return true;
      });

    this.filteredLines.set(result);
    this.pageIndex.set(0);
  }

  toggleSort(): void {
    this.sortOrder = this.sortOrder === 'desc' ? 'asc' : 'desc';
    this.applyFilters();
  }

  resetFilters(): void {
    this.filterForm.reset({ accountId: null, dateFrom: '', dateTo: '', label: '', sens: 'tous' });
    this.applyFilters();
  }

  selectLine(row: FlatLine): void {
    this.selectedEntryId.set(
      this.selectedEntryId() === row.entryId ? null : row.entryId
    );
  }

  goPage(index: number): void {
    this.pageIndex.set(index);
  }

  changePageSize(event: Event): void {
    this.pageSize.set(+(event.target as HTMLSelectElement).value);
    this.pageIndex.set(0);
  }

  min(a: number, b: number): number { return Math.min(a, b); }

  exportCsv(): void {
    const rows = [['Date', 'Libellé', 'Compte', 'Débit', 'Crédit']];
    this.filteredLines().forEach(r => {
      const acc = this.accounts().find(a => a.id === r.accountId);
      rows.push([
        r.date,
        r.entryLabel,
        acc ? `${acc.code} – ${acc.name}` : String(r.accountId),
        (r.debit  / 100).toFixed(2),
        (r.credit / 100).toFixed(2),
      ]);
    });
    const csv  = rows.map(r => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'grand-livre.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
