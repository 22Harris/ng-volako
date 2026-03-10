import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { AppDateInputComponent } from '../../../shared/components/date-input/date-input.component';
import { OperationService } from '../../../core/services/operation.service';
import { Operation, OperationType } from '../../../core/models/operation.model';
import { OperationFormComponent } from '../operation-form/operation-form.component';
import { OperationViewDialogComponent } from '../operation-view-dialog/operation-view-dialog.component';
import { OperationTypePipe } from '../../../shared/pipes/operation-type.pipe';
import { CentsPipe } from '../../../shared/pipes/cents.pipe';
import { OPERATION_TYPE_CONFIG, CATEGORY_LABELS, OPERATION_TYPES_BY_CATEGORY, OperationCategory, OperationTypeConfig } from '../../../core/utils/operation-type.utils';

@Component({
  selector: 'app-operation-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatPaginatorModule, MatTooltipModule,
    OperationTypePipe, CentsPipe, AppDateInputComponent,
  ],
  template: `
    <div class="page">

      <!-- ── Header ── -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Opérations</h1>
          <p class="page-sub">{{ filtered().length }} opération(s)</p>
        </div>
        <button class="btn-new" (click)="openForm()">
          <mat-icon>add</mat-icon>
          Nouvelle opération
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
            <mat-icon class="filter-icon">category</mat-icon>
            <select class="filter-select" formControlName="category" (change)="applyFilters()">
              <option [ngValue]="null">Toutes catégories</option>
              @for (cat of categories; track cat) {
                <option [ngValue]="cat">{{ categoryLabels[cat] }}</option>
              }
            </select>
          </div>

          <div class="filter-group">
            <mat-icon class="filter-icon">label</mat-icon>
            <select class="filter-select" formControlName="type" (change)="applyFilters()">
              <option [ngValue]="null">Tous les types</option>
              @for (type of allTypes; track type) {
                <option [ngValue]="type">{{ typeConfig[type].label }}</option>
              }
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
      </div>

      <!-- ── Zone principale : tableau + panneau détail ── -->
      <div class="main-area">

        <!-- Tableau (gauche) -->
        <div class="table-card">
          <div class="table-wrap">
            <table mat-table [dataSource]="paginated()" class="ops-table">

              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let op">{{ op.date | date:'dd/MM/yyyy' }}</td>
              </ng-container>

              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef>Type</th>
                <td mat-cell *matCellDef="let op">
                  <span class="badge" [ngClass]="typeConfig[op.type]?.colorClass">
                    {{ op.type | operationType }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="label">
                <th mat-header-cell *matHeaderCellDef>Libellé</th>
                <td mat-cell *matCellDef="let op">
                  <span class="entry-link">{{ op.label }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef class="num">Montant</th>
                <td mat-cell *matCellDef="let op" class="num amount-cell">
                  {{ op.amount | cents }}
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                class="data-row"
                [class.row-selected]="selectedOp()?.id === row.id"
                (click)="selectOp(row)"></tr>

            </table>

            @if (filtered().length === 0) {
              <div class="empty-state">
                <mat-icon>search_off</mat-icon>
                <p>Aucune opération ne correspond aux filtres</p>
                @if (hasActiveFilters()) {
                  <button class="btn-reset" type="button" (click)="resetFilters()">
                    <mat-icon>filter_alt_off</mat-icon> Effacer les filtres
                  </button>
                }
              </div>
            }
          </div>

          <!-- Pagination moderne -->
          <div class="paginator-wrap">
            <div class="pag-info">
              <span class="pag-count">
                {{ pageIndex * pageSize + 1 }}–{{ min((pageIndex + 1) * pageSize, filtered().length) }}
                <span class="pag-total">sur {{ filtered().length }}</span>
              </span>
            </div>
            <div class="pag-size">
              <span class="pag-size-label">Lignes :</span>
              <select class="pag-size-select" [value]="pageSize" (change)="changePageSize($event)">
                <option [value]="10">10</option>
                <option [value]="25">25</option>
                <option [value]="50">50</option>
              </select>
            </div>
            <div class="pag-nav">
              <button class="pag-btn" (click)="goPage(0)" [disabled]="pageIndex === 0" matTooltip="Première page">
                <mat-icon>first_page</mat-icon>
              </button>
              <button class="pag-btn" (click)="goPage(pageIndex - 1)" [disabled]="pageIndex === 0" matTooltip="Précédent">
                <mat-icon>chevron_left</mat-icon>
              </button>
              <span class="pag-page">{{ pageIndex + 1 }} / {{ totalPages() }}</span>
              <button class="pag-btn" (click)="goPage(pageIndex + 1)" [disabled]="pageIndex >= totalPages() - 1" matTooltip="Suivant">
                <mat-icon>chevron_right</mat-icon>
              </button>
              <button class="pag-btn" (click)="goPage(totalPages() - 1)" [disabled]="pageIndex >= totalPages() - 1" matTooltip="Dernière page">
                <mat-icon>last_page</mat-icon>
              </button>
            </div>
          </div>
        </div>

        <!-- Panneau détail (droite) -->
        @if (selectedOp()) {
          <div class="detail-panel">

            <div class="dp-header">
              <span class="badge dp-badge" [ngClass]="typeConfig[selectedOp()!.type]?.colorClass">
                <mat-icon>{{ typeConfig[selectedOp()!.type]?.icon }}</mat-icon>
                {{ selectedOp()!.type | operationType }}
              </span>
              <div class="dp-actions">
                <button class="dp-btn" (click)="openViewDialog(selectedOp()!)" matTooltip="Voir en plein écran">
                  <mat-icon>open_in_new</mat-icon>
                </button>
                <button class="dp-close" (click)="selectedOp.set(null)" matTooltip="Fermer">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            </div>

            <div class="dp-title-block">
              <h2 class="dp-title">{{ selectedOp()!.label }}</h2>
              <div class="dp-meta">
                <span class="dp-date">
                  <mat-icon>calendar_today</mat-icon>
                  {{ selectedOp()!.date | date:'dd/MM/yyyy' }}
                </span>
                <span class="dp-amount">
                  <mat-icon>payments</mat-icon>
                  {{ selectedOp()!.amount | cents }}
                </span>
              </div>
            </div>

            <div class="dp-entries">
              @if (selectedOp()!.entries?.length) {
                @for (entry of selectedOp()!.entries; track entry.id; let ei = $index) {
                  <div class="dp-entry">
                    <div class="dp-entry-head">
                      <span class="dp-entry-num">Écriture {{ ei + 1 }}</span>
                      <span class="dp-entry-label">{{ entry.label }}</span>
                      <span class="dp-entry-date">{{ entry.date | date:'dd/MM' }}</span>
                    </div>
                    <div class="dp-lines-wrap">
                      <div class="dp-lines-header">
                        <span class="col-account">Compte</span>
                        <span class="col-num">Débit</span>
                        <span class="col-num">Crédit</span>
                      </div>
                      @for (line of entry.lines; track line.id) {
                        <div class="dp-line">
                          <span class="col-account">
                            <span class="acct-chip">{{ line.accountId }}</span>
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
                        <span class="col-account">Sous-total</span>
                        <span class="col-num">{{ entryDebit(entry) | cents }}</span>
                        <span class="col-num">{{ entryCredit(entry) | cents }}</span>
                      </div>
                    </div>
                  </div>
                }

                <div class="dp-total">
                  <div class="dp-total-row">
                    <span>Total débit</span>
                    <strong>{{ totalDebit() | cents }}</strong>
                  </div>
                  <div class="dp-total-row">
                    <span>Total crédit</span>
                    <strong>{{ totalCredit() | cents }}</strong>
                  </div>
                  <div class="dp-balance"
                    [class.ok]="totalDebit() === totalCredit()"
                    [class.err]="totalDebit() !== totalCredit()">
                    <mat-icon>{{ totalDebit() === totalCredit() ? 'check_circle' : 'warning' }}</mat-icon>
                    {{ totalDebit() === totalCredit() ? 'Équilibré' : 'Déséquilibré' }}
                  </div>
                </div>

              } @else {
                <div class="dp-no-entries">
                  <mat-icon>inbox</mat-icon>
                  <span>Aucune écriture associée</span>
                </div>
              }
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
    .btn-new {
      display: flex; align-items: center; gap: 8px;
      height: 44px; padding: 0 22px; border: none;
      border-radius: 12px; cursor: pointer;
      background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
      color: white; font-size: 14px; font-weight: 700; letter-spacing: .3px;
      box-shadow: 0 4px 14px rgba(21,101,192,.45), inset 0 1px 0 rgba(255,255,255,.15);
      transition: box-shadow .2s, transform .15s;
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
      &:hover { box-shadow: 0 8px 24px rgba(21,101,192,.6); transform: translateY(-1px); }
    }

    /* ── Filtres ── */
    .filters-card {
      background: white; border-radius: 16px;
      box-shadow: 0 2px 8px rgba(13,27,42,.07);
      padding: 16px 20px; flex-shrink: 0;
    }
    .filters { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }

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
      font-size: 13px; color: #0d1b2a; min-width: 0; width: 180px;
      &::placeholder { color: #b0bec5; }
    }
    .filter-select { border: none; background: transparent; outline: none; font-size: 13px; color: #0d1b2a; cursor: pointer; width: 170px; }

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
    .date-slot {
      display: flex; flex-direction: column;
      padding: 5px 12px; min-width: 120px;
    }
    .date-slot-label {
      font-size: 9px; font-weight: 800; color: #90a4ae;
      text-transform: uppercase; letter-spacing: .6px; line-height: 1;
    }
    .date-slot-input {
      border: none; background: transparent; outline: none;
      font-size: 12px; color: #0d1b2a; cursor: pointer; padding: 0;
      font-weight: 500;
      &::-webkit-calendar-picker-indicator { opacity: .4; cursor: pointer; }
    }
    .date-range-sep {
      display: flex; align-items: center; padding: 0 6px;
      color: #cbd5e1;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }

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
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &:hover { background: #fde8e8; }
    }

    /* ── Zone principale ── */
    .main-area {
      display: flex; gap: 16px;
      flex: 1; min-height: 0;
    }

    /* ── Tableau ── */
    .table-card {
      background: white; border-radius: 16px;
      box-shadow: 0 2px 8px rgba(13,27,42,.07);
      overflow: hidden;
      flex: 1; min-height: 0; min-width: 0; display: flex; flex-direction: column;
    }
    .table-wrap { overflow-y: auto; flex: 1; min-height: 0; }
    .ops-table  { width: 100%; }

    .mat-mdc-header-row {
      background: #f1f5f9 !important;
      position: sticky; top: 0; z-index: 3;
      border-bottom: 2px solid #dde6f0 !important;
    }
    .mat-mdc-header-cell {
      color: #475569 !important; font-size: 11px !important; font-weight: 700 !important;
      letter-spacing: .6px !important; text-transform: uppercase !important;
      border-bottom: none !important; padding: 0 16px !important; white-space: nowrap;
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

    .entry-link { color: #1565c0; font-weight: 500; cursor: pointer; }
    .amount-cell { font-weight: 600; color: #1565c0 !important; font-variant-numeric: tabular-nums; }
    .num { text-align: right !important; }

    /* ── Pagination moderne ── */
    .paginator-wrap {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 16px; border-top: 1px solid #f0f4f8; flex-shrink: 0;
      background: #fafbfc; gap: 12px; flex-wrap: wrap;
    }
    .pag-info {}
    .pag-count {
      font-size: 13px; font-weight: 700; color: #0d1b2a;
      font-variant-numeric: tabular-nums;
    }
    .pag-total { font-weight: 400; color: #90a4ae; }
    .pag-size {
      display: flex; align-items: center; gap: 8px;
    }
    .pag-size-label { font-size: 12px; color: #78909c; white-space: nowrap; }
    .pag-size-select {
      height: 32px; padding: 0 10px; border-radius: 8px;
      border: 1.5px solid #e2e8f0; background: white;
      font-size: 13px; font-weight: 600; color: #0d1b2a; cursor: pointer;
      outline: none; transition: border-color .15s;
      &:focus { border-color: #90caf9; }
    }
    .pag-nav {
      display: flex; align-items: center; gap: 4px;
    }
    .pag-btn {
      width: 32px; height: 32px; border-radius: 8px;
      border: 1.5px solid #e2e8f0; background: white; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #546e7a; transition: all .15s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover:not(:disabled) { border-color: #90caf9; background: #e3f2fd; color: #1565c0; }
      &:disabled { opacity: .35; cursor: not-allowed; }
    }
    .pag-page {
      font-size: 12px; font-weight: 700; color: #475569;
      padding: 0 10px; white-space: nowrap;
    }

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
      display: flex; flex-direction: column;
      overflow: hidden;
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
    .dp-actions { display: flex; align-items: center; gap: 6px; }
    .dp-btn {
      width: 30px; height: 30px; border-radius: 8px;
      border: 1.5px solid #e8edf2; background: white; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #90a4ae; transition: all .15s; flex-shrink: 0;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &:hover { border-color: #90caf9; background: #e3f2fd; color: #1565c0; }
    }
    .dp-badge {
      display: inline-flex !important; align-items: center; gap: 5px;
      mat-icon { font-size: 13px; width: 13px; height: 13px; }
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
    .dp-meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .dp-date {
      display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: #78909c;
      mat-icon { font-size: 13px; width: 13px; height: 13px; }
    }
    .dp-amount {
      display: inline-flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 700; color: #1565c0;
      mat-icon { font-size: 13px; width: 13px; height: 13px; }
    }

    .dp-entries {
      flex: 1; overflow-y: auto; padding: 12px 16px;
      display: flex; flex-direction: column; gap: 12px;
    }

    .dp-entry { background: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #e8edf2; }
    .dp-entry-head {
      display: flex; align-items: center; gap: 8px;
      padding: 9px 12px; background: #f1f5f9; border-bottom: 1px solid #e8edf2;
    }
    .dp-entry-num {
      font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase;
      letter-spacing: .5px; background: #dde6f0; border-radius: 5px; padding: 2px 6px; flex-shrink: 0;
    }
    .dp-entry-label {
      flex: 1; font-size: 12px; font-weight: 600; color: #263238;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .dp-entry-date { font-size: 11px; color: #90a4ae; flex-shrink: 0; }

    .dp-lines-wrap { padding: 4px 0; }
    .dp-lines-header {
      display: flex; padding: 5px 12px;
      font-size: 10px; font-weight: 700; color: #90a4ae; text-transform: uppercase; letter-spacing: .5px;
    }
    .dp-line {
      display: flex; padding: 5px 12px; font-size: 12px; color: #263238;
      &:hover { background: #eef4fb; }
    }
    .dp-subtotal {
      display: flex; padding: 6px 12px; font-size: 11px; font-weight: 700; color: #475569;
      border-top: 1px solid #e8edf2; background: #f1f5f9;
    }
    .col-account { flex: 1; min-width: 0; display: flex; align-items: center; gap: 6px; white-space: nowrap; overflow: hidden; }
    .col-num { width: 88px; text-align: right; font-variant-numeric: tabular-nums; flex-shrink: 0; font-size: 11px; }
    .acct-chip {
      display: inline-block; padding: 1px 6px; background: #e8f0fe; color: #1a237e;
      border-radius: 5px; font-size: 11px; font-weight: 700; font-family: monospace;
    }
    .pos-val { color: #1b5e20; font-weight: 700; }
    .neg-val { color: #b71c1c; font-weight: 700; }

    .dp-total {
      background: #f1f5f9; border-radius: 10px; padding: 12px 14px;
      display: flex; flex-direction: column; gap: 6px; flex-shrink: 0;
    }
    .dp-total-row {
      display: flex; justify-content: space-between; font-size: 12px; color: #475569;
      strong { color: #0d1b2a; font-variant-numeric: tabular-nums; }
    }
    .dp-balance {
      display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700;
      padding-top: 6px; border-top: 1px solid #dde6f0; margin-top: 2px;
      mat-icon { font-size: 15px; width: 15px; height: 15px; }
      &.ok  { color: #2e7d32; }
      &.err { color: #c62828; }
    }
    .dp-no-entries {
      text-align: center; padding: 32px 16px; color: #b0bec5;
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      mat-icon { font-size: 32px; width: 32px; height: 32px; opacity: .4; }
      span { font-size: 13px; }
    }

    @media (max-width: 900px) {
      .main-area { flex-direction: column; }
      .detail-panel { width: 100%; min-width: 0; }
    }
  `]
})
export class OperationListComponent implements OnInit {
  private readonly opService = inject(OperationService);
  private readonly fb        = inject(FormBuilder);
  private readonly dialog    = inject(MatDialog);

  allOperations = signal<Operation[]>([]);
  filtered      = signal<Operation[]>([]);
  paginated     = signal<Operation[]>([]);
  selectedOp    = signal<Operation | null>(null);
  pageSize      = 10;
  pageIndex     = 0;

  displayedColumns = ['date', 'type', 'label', 'amount'];
  sortOrder: 'desc' | 'asc' = 'desc';

  categories     = Object.keys(OPERATION_TYPES_BY_CATEGORY) as OperationCategory[];
  categoryLabels = CATEGORY_LABELS;
  typeConfig: Record<string, OperationTypeConfig> = OPERATION_TYPE_CONFIG;
  allTypes       = Object.values(OperationType);

  filterForm = this.fb.group({
    label:    [''],
    category: [null as OperationCategory | null],
    type:     [null as OperationType | null],
    dateFrom: [''],
    dateTo:   [''],
  });

  filterValues = toSignal(this.filterForm.valueChanges, { initialValue: this.filterForm.value });

  hasActiveFilters = computed(() => {
    const f = this.filterValues();
    return !!(f.label || f.category || f.type || f.dateFrom || f.dateTo);
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));

  totalDebit  = computed(() =>
    this.selectedOp()?.entries?.flatMap(e => e.lines).reduce((s, l) => s + l.debit, 0) ?? 0);
  totalCredit = computed(() =>
    this.selectedOp()?.entries?.flatMap(e => e.lines).reduce((s, l) => s + l.credit, 0) ?? 0);

  ngOnInit(): void { this.load(); }

  openForm(operation?: Operation): void {
    const ref = this.dialog.open(OperationFormComponent, {
      data: { operation },
      panelClass: 'dlg-panel',
    });
    ref.afterClosed().subscribe(saved => { if (saved) this.load(); });
  }

  load(): void {
    this.opService.getAll().subscribe(list => {
      this.allOperations.set(list);
      this.applyFilters();
    });
  }

  selectOp(op: Operation): void {
    if (this.selectedOp()?.id === op.id) {
      this.selectedOp.set(null);
    } else {
      this.opService.getById(op.id).subscribe(full => this.selectedOp.set(full));
    }
  }

  openViewDialog(op: Operation): void {
    this.dialog.open(OperationViewDialogComponent, {
      data: { operationId: op.id },
      panelClass: 'dlg-panel',
    });
  }

  applyFilters(): void {
    const f = this.filterForm.value;
    const labelSearch = (f.label ?? '').toLowerCase().trim();
    const result = this.allOperations()
      .filter(op => {
        if (f.type     && op.type !== f.type)                                        return false;
        if (f.category && OPERATION_TYPE_CONFIG[op.type]?.category !== f.category)   return false;
        if (f.dateFrom && op.date < f.dateFrom)                                       return false;
        if (f.dateTo   && op.date > f.dateTo)                                         return false;
        if (labelSearch && !op.label.toLowerCase().includes(labelSearch))             return false;
        return true;
      })
      .sort((a, b) =>
        this.sortOrder === 'desc'
          ? b.date.localeCompare(a.date)
          : a.date.localeCompare(b.date)
      );
    this.filtered.set(result);
    this.pageIndex = 0;
    this.updatePage();
  }

  toggleSort(): void {
    this.sortOrder = this.sortOrder === 'desc' ? 'asc' : 'desc';
    this.applyFilters();
  }

  resetFilters(): void {
    this.filterForm.reset({ label: '', category: null, type: null, dateFrom: '', dateTo: '' });
    this.applyFilters();
  }

  goPage(index: number): void {
    this.pageIndex = index;
    this.updatePage();
  }

  changePageSize(event: Event): void {
    this.pageSize  = +(event.target as HTMLSelectElement).value;
    this.pageIndex = 0;
    this.updatePage();
  }

  updatePage(): void {
    const start = this.pageIndex * this.pageSize;
    this.paginated.set(this.filtered().slice(start, start + this.pageSize));
  }

  min(a: number, b: number): number { return Math.min(a, b); }

  entryDebit(entry: any):  number { return entry.lines.reduce((s: number, l: any) => s + l.debit,  0); }
  entryCredit(entry: any): number { return entry.lines.reduce((s: number, l: any) => s + l.credit, 0); }
}
