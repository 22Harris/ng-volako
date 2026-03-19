import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TvaService, Ca3Report } from '../../../core/services/tva.service';
import { ExportService } from '../../../core/services/export.service';
import { AlertService } from '../../../shared/components/alert/alert.service';

@Component({
  selector: 'app-tva-declaration',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatTooltipModule,
  ],
  template: `
    <!-- ═══ HERO HEADER ═══ -->
    <div class="hero">
      <div class="hero-content">
        <div class="hero-left">
          <div class="hero-badge">
            <mat-icon>receipt_long</mat-icon>
            Déclaration TVA
          </div>
          <h1 class="hero-title">Formulaire CA3</h1>
          <p class="hero-sub">Synthèse TVA collectée / déductible sur la période sélectionnée</p>
        </div>

        <form [formGroup]="filterForm" (ngSubmit)="charger()" class="hero-form">
          <div class="period-inputs">
            <div class="period-field">
              <label>Du</label>
              <input type="date" formControlName="dateFrom" class="date-input" />
            </div>
            <div class="period-sep">→</div>
            <div class="period-field">
              <label>Au</label>
              <input type="date" formControlName="dateTo" class="date-input" />
            </div>
          </div>
          <div class="form-actions">
            <button class="calc-btn" type="submit"
              [disabled]="filterForm.invalid || loading()">
              @if (loading()) {
                <mat-spinner diameter="20" class="btn-spinner"></mat-spinner>
                Calcul…
              } @else {
                <mat-icon>calculate</mat-icon>
                Calculer
              }
            </button>
            @if (rapport()) {
              <button class="pdf-btn" type="button" (click)="exportPdf()">
                <mat-icon>picture_as_pdf</mat-icon>
                PDF
              </button>
            }
          </div>
        </form>
      </div>
    </div>

    @if (rapport()) {
      <!-- ═══ KPI CARDS ═══ -->
      <div class="kpi-row">
        <div class="kpi-card kpi-collectee">
          <div class="kpi-icon-wrap collectee-icon">
            <mat-icon>trending_up</mat-icon>
          </div>
          <div class="kpi-body">
            <span class="kpi-label">TVA collectée</span>
            <span class="kpi-value">{{ rapport()!.tvaCollectee.totalTva | number:'1.2-2' }} €</span>
            <span class="kpi-sub">Base HT : {{ rapport()!.tvaCollectee.totalBaseHt | number:'1.2-2' }} €</span>
          </div>
        </div>

        <div class="kpi-card kpi-deductible">
          <div class="kpi-icon-wrap deductible-icon">
            <mat-icon>trending_down</mat-icon>
          </div>
          <div class="kpi-body">
            <span class="kpi-label">TVA déductible</span>
            <span class="kpi-value">{{ rapport()!.tvaDeductible.total | number:'1.2-2' }} €</span>
            <span class="kpi-sub">Immos + services</span>
          </div>
        </div>

        <div class="kpi-card kpi-solde"
          [class.kpi-solde-payer]="rapport()!.tvaAPayer > 0"
          [class.kpi-solde-credit]="rapport()!.creditTva > 0">
          <div class="kpi-icon-wrap solde-icon">
            <mat-icon>{{ rapport()!.tvaAPayer > 0 ? 'payment' : 'savings' }}</mat-icon>
          </div>
          <div class="kpi-body">
            <span class="kpi-label">
              {{ rapport()!.tvaAPayer > 0 ? 'TVA à payer' : 'Crédit de TVA' }}
            </span>
            <span class="kpi-value kpi-value-big">
              {{ rapport()!.tvaAPayer > 0
                  ? (rapport()!.tvaAPayer | number:'1.2-2')
                  : (rapport()!.creditTva | number:'1.2-2') }} €
            </span>
            <span class="kpi-badge"
              [class.badge-payer]="rapport()!.tvaAPayer > 0"
              [class.badge-credit]="rapport()!.creditTva > 0">
              {{ rapport()!.tvaAPayer > 0 ? 'À reverser' : 'Reportable' }}
            </span>
          </div>
        </div>
      </div>

      <!-- ═══ DETAIL GRID ═══ -->
      <div class="detail-grid">

        <!-- TVA collectée -->
        <div class="detail-card">
          <div class="detail-header">
            <div class="detail-header-icon collectee-bg">
              <mat-icon>arrow_circle_up</mat-icon>
            </div>
            <div>
              <h3 class="detail-title">TVA collectée</h3>
              <p class="detail-subtitle">Opérations imposables sur la période</p>
            </div>
          </div>

          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Régime</th>
                  <th class="r">Base HT</th>
                  <th class="r">TVA brute</th>
                </tr>
              </thead>
              <tbody>
                @for (l of rapport()!.tvaCollectee.lignes; track l.codeTva) {
                  <tr>
                    <td>
                      <span class="rate-pill" [class]="ratePillClass(l.taux)">
                        {{ l.taux > 0 ? l.taux + ' %' : 'Exo' }}
                      </span>
                      {{ l.label }}
                    </td>
                    <td class="r mono">{{ l.baseHt | number:'1.2-2' }} €</td>
                    <td class="r mono bold">{{ l.tvaBrute | number:'1.2-2' }} €</td>
                  </tr>
                }
                @if (rapport()!.tvaCollectee.lignes.length === 0) {
                  <tr><td colspan="3" class="empty-row">
                    <mat-icon>inbox</mat-icon>
                    Aucune ligne TVA sur la période
                  </td></tr>
                }
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td>Total</td>
                  <td class="r mono">{{ rapport()!.tvaCollectee.totalBaseHt | number:'1.2-2' }} €</td>
                  <td class="r mono">{{ rapport()!.tvaCollectee.totalTva | number:'1.2-2' }} €</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- TVA déductible -->
        <div class="detail-card">
          <div class="detail-header">
            <div class="detail-header-icon deductible-bg">
              <mat-icon>arrow_circle_down</mat-icon>
            </div>
            <div>
              <h3 class="detail-title">TVA déductible</h3>
              <p class="detail-subtitle">Taxes récupérables sur achats et charges</p>
            </div>
          </div>

          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Nature</th>
                  <th class="r">Compte</th>
                  <th class="r">Montant</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Sur immobilisations</td>
                  <td class="r"><span class="acct-chip">44562</span></td>
                  <td class="r mono bold">
                    {{ rapport()!.tvaDeductible.surImmobilisations | number:'1.2-2' }} €
                  </td>
                </tr>
                <tr>
                  <td>Autres biens et services</td>
                  <td class="r"><span class="acct-chip">44566</span></td>
                  <td class="r mono bold">
                    {{ rapport()!.tvaDeductible.surAutresBiensServices | number:'1.2-2' }} €
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="2">Total déductible</td>
                  <td class="r mono">{{ rapport()!.tvaDeductible.total | number:'1.2-2' }} €</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <!-- ═══ CALCUL FINAL ═══ -->
      <div class="calcul-card"
        [class.calcul-payer]="rapport()!.tvaAPayer > 0"
        [class.calcul-credit]="rapport()!.creditTva > 0">
        <div class="calcul-rows">
          <div class="calcul-row">
            <span class="calcul-lbl">
              <span class="calcul-dot dot-red"></span>
              TVA collectée (44571)
            </span>
            <span class="calcul-amt">+ {{ rapport()!.tvaCollectee.totalTva | number:'1.2-2' }} €</span>
          </div>
          <div class="calcul-row">
            <span class="calcul-lbl">
              <span class="calcul-dot dot-green"></span>
              TVA déductible (44562 + 44566)
            </span>
            <span class="calcul-amt">− {{ rapport()!.tvaDeductible.total | number:'1.2-2' }} €</span>
          </div>
          <div class="calcul-divider"></div>
          <div class="calcul-row calcul-result">
            <span class="calcul-lbl-result">
              <mat-icon>{{ rapport()!.tvaAPayer > 0 ? 'payment' : 'savings' }}</mat-icon>
              {{ rapport()!.tvaAPayer > 0 ? 'TVA nette à payer' : 'Crédit de TVA à reporter' }}
            </span>
            <span class="calcul-result-amt"
              [class.amt-payer]="rapport()!.tvaAPayer > 0"
              [class.amt-credit]="rapport()!.creditTva > 0">
              {{ rapport()!.tvaAPayer > 0
                  ? (rapport()!.tvaAPayer | number:'1.2-2')
                  : (rapport()!.creditTva | number:'1.2-2') }} €
            </span>
          </div>
        </div>
      </div>
    }

    <!-- ═══ EMPTY STATE ═══ -->
    @if (!rapport() && !loading()) {
      <div class="empty-state">
        <div class="empty-state-icon">
          <mat-icon>find_in_page</mat-icon>
        </div>
        <h3>Sélectionnez une période</h3>
        <p>Renseignez les dates et cliquez sur <strong>Calculer</strong> pour générer votre déclaration TVA.</p>
      </div>
    }
  `,
  styles: [`
    /* ── Hero ── */
    .hero {
      background: linear-gradient(135deg, var(--clr-primary-dark) 0%, var(--clr-primary) 60%, #1976d2 100%);
      border-radius: var(--radius-card);
      padding: 32px 36px;
      margin-bottom: 28px;
      color: #fff;
    }
    .hero-content { display: flex; align-items: flex-start; justify-content: space-between; gap: 32px; flex-wrap: wrap; }
    .hero-badge {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(255,255,255,.15); border-radius: 20px;
      padding: 4px 12px; font-size: 12px; font-weight: 600;
      letter-spacing: .5px; margin-bottom: 10px;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }
    .hero-title { font-size: 28px; font-weight: 800; color: #fff; margin: 0 0 6px; }
    .hero-sub { font-size: 14px; color: rgba(255,255,255,.75); margin: 0; }

    /* ── Period form inside hero ── */
    .hero-form { display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }
    .period-inputs { display: flex; align-items: center; gap: 10px; }
    .period-field { display: flex; flex-direction: column; gap: 4px;
      label { font-size: 11px; font-weight: 600; color: rgba(255,255,255,.7); text-transform: uppercase; letter-spacing: .5px; }
    }
    .date-input {
      background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.25);
      border-radius: 8px; padding: 8px 12px; color: #fff; font-size: 14px;
      outline: none; width: 150px;
      &:focus { border-color: rgba(255,255,255,.6); background: rgba(255,255,255,.18); }
      &::-webkit-calendar-picker-indicator { filter: invert(1); opacity: .7; cursor: pointer; }
    }
    .period-sep { color: rgba(255,255,255,.5); font-size: 18px; font-weight: 300; margin-top: 20px; }
    .form-actions { display: flex; align-items: center; gap: 10px; }
    .calc-btn {
      display: flex; align-items: center; gap: 8px;
      background: rgba(255,255,255,.95); color: var(--clr-primary-dark);
      border: none; border-radius: 10px; padding: 10px 22px;
      font-size: 14px; font-weight: 700; cursor: pointer;
      transition: all .2s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover:not(:disabled) { background: #fff; box-shadow: 0 4px 16px rgba(0,0,0,.2); transform: translateY(-1px); }
      &:disabled { opacity: .55; cursor: not-allowed; }
    }
    .pdf-btn {
      display: flex; align-items: center; gap: 6px;
      background: rgba(255,255,255,.15); color: #fff;
      border: 1px solid rgba(255,255,255,.4); border-radius: 10px; padding: 10px 18px;
      font-size: 14px; font-weight: 600; cursor: pointer; transition: all .2s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover { background: rgba(255,255,255,.25); }
    }
    .btn-spinner { --mdc-circular-progress-active-indicator-color: var(--clr-primary); }

    /* ── KPI Cards ── */
    .kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
    .kpi-card {
      background: var(--clr-card-bg); border-radius: var(--radius-card);
      box-shadow: var(--shadow-card); padding: 20px 24px;
      display: flex; align-items: flex-start; gap: 16px;
      border: 1px solid var(--clr-border);
      transition: box-shadow .2s;
      &:hover { box-shadow: var(--shadow-card-hover); }
    }
    .kpi-icon-wrap {
      width: 48px; height: 48px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      mat-icon { font-size: 24px; width: 24px; height: 24px; }
    }
    .collectee-icon  { background: #fff3e0; color: #e65100; }
    .deductible-icon { background: #e8f5e9; color: #2e7d32; }
    .solde-icon      { background: #e3f2fd; color: var(--clr-primary-dark); }
    .kpi-solde-payer .solde-icon { background: #ffebee; color: #c62828; }
    .kpi-solde-credit .solde-icon { background: #e8f5e9; color: #2e7d32; }

    .kpi-body { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
    .kpi-label { font-size: 12px; font-weight: 600; color: var(--clr-text-secondary); text-transform: uppercase; letter-spacing: .5px; }
    .kpi-value { font-size: 20px; font-weight: 700; color: var(--clr-text-primary); }
    .kpi-value-big { font-size: 24px; }
    .kpi-sub { font-size: 12px; color: var(--clr-text-secondary); }
    .kpi-badge {
      display: inline-block; margin-top: 4px;
      padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;
    }
    .badge-payer  { background: #ffebee; color: #c62828; }
    .badge-credit { background: #e8f5e9; color: #2e7d32; }

    /* ── Detail Grid ── */
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .detail-card {
      background: var(--clr-card-bg); border-radius: var(--radius-card);
      box-shadow: var(--shadow-card); border: 1px solid var(--clr-border);
      overflow: hidden;
    }
    .detail-header {
      display: flex; align-items: center; gap: 14px;
      padding: 20px 24px 16px; border-bottom: 1px solid var(--clr-border);
    }
    .detail-header-icon {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
    }
    .collectee-bg  { background: #fff3e0; color: #e65100; }
    .deductible-bg { background: #e8f5e9; color: #2e7d32; }
    .detail-title { font-size: 15px; font-weight: 700; margin: 0 0 2px; }
    .detail-subtitle { font-size: 12px; color: var(--clr-text-secondary); margin: 0; }

    /* ── Tables ── */
    .table-wrap { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th {
      padding: 10px 16px; font-size: 11px; font-weight: 700;
      color: var(--clr-text-secondary); text-transform: uppercase; letter-spacing: .5px;
      background: #f8fafc; border-bottom: 1px solid var(--clr-border); text-align: left;
    }
    .data-table td {
      padding: 12px 16px; font-size: 13px;
      border-bottom: 1px solid rgba(0,0,0,.04);
      color: var(--clr-text-primary);
    }
    .data-table tbody tr:last-child td { border-bottom: none; }
    .data-table tbody tr:hover td { background: #f8fafc; }
    .data-table tfoot .total-row td {
      padding: 12px 16px; font-size: 13px; font-weight: 700;
      background: #f1f5f9; border-top: 2px solid var(--clr-border);
    }
    .r { text-align: right; }
    .mono { font-variant-numeric: tabular-nums; }
    .bold { font-weight: 600; }

    .rate-pill {
      display: inline-block; padding: 2px 8px; border-radius: 12px;
      font-size: 11px; font-weight: 700; margin-right: 6px;
    }
    .pill-20   { background: #fff3e0; color: #e65100; }
    .pill-10   { background: #fce4ec; color: #c2185b; }
    .pill-5    { background: #f3e5f5; color: #7b1fa2; }
    .pill-2    { background: #e8eaf6; color: #3949ab; }
    .pill-0    { background: #f1f8e9; color: #558b2f; }

    .acct-chip {
      display: inline-block; padding: 2px 8px; border-radius: 6px;
      background: #e3f2fd; color: var(--clr-primary-dark);
      font-size: 11px; font-weight: 700; font-family: monospace;
    }

    .empty-row {
      text-align: center; padding: 32px !important;
      color: var(--clr-text-secondary);
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }

    /* ── Calcul final ── */
    .calcul-card {
      background: var(--clr-card-bg); border-radius: var(--radius-card);
      box-shadow: var(--shadow-card); border: 1px solid var(--clr-border);
      border-left: 5px solid var(--clr-border);
      padding: 24px 28px;
      transition: border-color .3s;
    }
    .calcul-payer  { border-left-color: #c62828; }
    .calcul-credit { border-left-color: #2e7d32; }
    .calcul-rows { display: flex; flex-direction: column; gap: 14px; }
    .calcul-row { display: flex; justify-content: space-between; align-items: center; }
    .calcul-lbl {
      display: flex; align-items: center; gap: 10px;
      font-size: 14px; color: var(--clr-text-secondary);
    }
    .calcul-dot {
      width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
    }
    .dot-red   { background: #e65100; }
    .dot-green { background: #2e7d32; }
    .calcul-amt { font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums; }
    .calcul-divider {
      height: 1px; background: var(--clr-border); margin: 4px 0;
    }
    .calcul-result { margin-top: 4px; }
    .calcul-lbl-result {
      display: flex; align-items: center; gap: 8px;
      font-size: 16px; font-weight: 700; color: var(--clr-text-primary);
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
    }
    .calcul-result-amt { font-size: 28px; font-weight: 800; font-variant-numeric: tabular-nums; }
    .amt-payer  { color: #c62828; }
    .amt-credit { color: #2e7d32; }

    /* ── Empty state ── */
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      padding: 64px 24px; text-align: center;
    }
    .empty-state-icon {
      width: 72px; height: 72px; border-radius: 20px;
      background: var(--clr-primary-light); color: var(--clr-primary);
      display: flex; align-items: center; justify-content: center; margin-bottom: 20px;
      mat-icon { font-size: 36px; width: 36px; height: 36px; }
    }
    .empty-state h3 { font-size: 18px; margin: 0 0 8px; }
    .empty-state p { font-size: 14px; color: var(--clr-text-secondary); max-width: 360px; margin: 0; }
  `],
})
export class TvaDeclarationComponent {
  private readonly tvaService = inject(TvaService);
  private readonly alertSvc   = inject(AlertService);
  private readonly exportSvc  = inject(ExportService);
  private readonly fb         = inject(FormBuilder);

  loading = signal(false);
  rapport = signal<Ca3Report | null>(null);

  filterForm = this.fb.group({
    dateFrom: ['', Validators.required],
    dateTo:   ['', Validators.required],
  });

  ratePillClass(taux: number): string {
    if (taux === 20)  return 'rate-pill pill-20';
    if (taux === 10)  return 'rate-pill pill-10';
    if (taux === 5.5) return 'rate-pill pill-5';
    if (taux === 2.1) return 'rate-pill pill-2';
    return 'rate-pill pill-0';
  }

  exportPdf(): void {
    const r = this.rapport();
    if (!r) return;
    const { dateFrom, dateTo } = this.filterForm.getRawValue();
    this.exportSvc.pdfTva(r, dateFrom!, dateTo!);
  }

  charger(): void {
    if (this.filterForm.invalid) return;
    this.loading.set(true);
    this.rapport.set(null);
    const { dateFrom, dateTo } = this.filterForm.getRawValue();
    this.tvaService.getCa3(dateFrom!, dateTo!).subscribe({
      next: (r) => {
        r.tvaCollectee.lignes = r.tvaCollectee.lignes.map(l => ({
          ...l,
          baseHt: l.baseHt / 100,
          tvaBrute: l.tvaBrute / 100,
        }));
        r.tvaCollectee.totalBaseHt              = r.tvaCollectee.totalBaseHt / 100;
        r.tvaCollectee.totalTva                 = r.tvaCollectee.totalTva / 100;
        r.tvaDeductible.surImmobilisations      = r.tvaDeductible.surImmobilisations / 100;
        r.tvaDeductible.surAutresBiensServices  = r.tvaDeductible.surAutresBiensServices / 100;
        r.tvaDeductible.total                   = r.tvaDeductible.total / 100;
        r.soldeTva   = r.soldeTva / 100;
        r.tvaAPayer  = r.tvaAPayer / 100;
        r.creditTva  = r.creditTva / 100;
        this.rapport.set(r);
        this.loading.set(false);
      },
      error: () => {
        this.alertSvc.error('Erreur lors du calcul TVA');
        this.loading.set(false);
      },
    });
  }
}
