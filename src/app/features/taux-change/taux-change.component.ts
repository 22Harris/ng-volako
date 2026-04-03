import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TauxChangeService } from '../../core/services/taux-change.service';

// EUR en premier, puis toutes les autres par ordre alphabétique
const EXTRA_CURRENCIES = [
  'USD', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD', 'CNY',
  'HKD', 'SGD', 'INR', 'KRW', 'NZD', 'IDR', 'MYR', 'PHP', 'THB',
  'BRL', 'MXN', 'ZAR', 'MGA', 'ILS',
  'TRY', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'ISK',
].sort((a, b) => a.localeCompare(b));

@Component({
  selector: 'app-taux-change',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatTooltipModule, MatSelectModule, MatFormFieldModule, MatInputModule, DecimalPipe, DatePipe],
  template: `
    <div class="page">

      <!-- ── En-tête ── -->
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <span class="title-icon">💱</span>
            Taux de change
          </h1>
          <p class="page-sub">
            Données BCE · Base EUR
            @if (svc.dataDate()) { · Cours ECB du {{ svc.dataDate() }} }
          </p>
        </div>
        <button class="btn-refresh" (click)="svc.refresh()" [disabled]="svc.loading()"
          matTooltip="Actualiser les taux">
          <mat-icon [class.spin]="svc.loading()">refresh</mat-icon>
          Actualiser
        </button>
      </div>

      <!-- ── Dernière mise à jour ── -->
      @if (svc.lastUpdated()) {
        <div class="updated-banner">
          <mat-icon>schedule</mat-icon>
          Dernière actualisation : {{ svc.lastUpdated() | date:'dd/MM/yyyy HH:mm:ss' }}
          <span class="ecb-note">· Source : Banque Centrale Européenne via frankfurter.app</span>
        </div>
      }

      <!-- ── Erreur ── -->
      @if (svc.error()) {
        <div class="error-card">
          <mat-icon>wifi_off</mat-icon>
          <div>
            <strong>Erreur de chargement</strong>
            <p>{{ svc.error() }}</p>
          </div>
          <button class="btn-refresh" (click)="svc.refresh()">Réessayer</button>
        </div>
      }

      <!-- ── Skeleton ── -->
      @if (svc.loading() && !svc.hasData()) {
        <div class="skeleton-list">
          @for (i of skeletonRows; track $index) {
            <div class="skeleton-row">
              <div class="sk sk-flag"></div>
              <div class="sk sk-name"></div>
              <div class="sk sk-rate"></div>
              <div class="sk sk-change"></div>
            </div>
          }
        </div>
      }

      <!-- ── Contenu principal ── -->
      @if (svc.hasData()) {
        <div class="main-grid">

          <!-- Colonne gauche : tableau des taux -->
          <div class="card rates-card">
            <h3 class="card-title">
              <mat-icon>currency_exchange</mat-icon>
              Taux EUR → Devises
            </h3>

            <div class="rates-table">
              <div class="rates-head">
                <span>Devise</span>
                <span class="r">1 EUR =</span>
                <span class="r">Variation J-1</span>
                <span class="r">Tendance</span>
              </div>
              @for (rate of svc.rates(); track rate.code) {
                <div class="rates-row"
                  [class.selected]="selectedCurrency() === rate.code"
                  (click)="selectCurrency(rate.code)"
                  [matTooltip]="'Voir la tendance 7 jours pour ' + rate.code">
                  <div class="currency-cell">
                    <span class="flag">{{ rate.flag }}</span>
                    <div>
                      <span class="code">{{ rate.code }}</span>
                      <span class="cname">{{ rate.name }}</span>
                    </div>
                  </div>
                  <span class="r rate-val">{{ rate.rate | number:'1.4-4' }}</span>
                  <span class="r change-cell"
                    [class.pos]="rate.changePercent > 0"
                    [class.neg]="rate.changePercent < 0"
                    [class.neu]="rate.changePercent === 0">
                    @if (rate.changePercent !== 0) {
                      <mat-icon class="arrow">{{ rate.changePercent > 0 ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                    }
                    {{ rate.changePercent | number:'1.2-2' }}%
                  </span>
                  <span class="r trend-cell">
                    @if (!rate.hasHistory) {
                      <mat-icon class="chart-na" matTooltip="Historique non disponible (hors BCE)">remove</mat-icon>
                    } @else if (selectedCurrency() === rate.code) {
                      <span class="active-hint">↓ ci-dessous</span>
                    } @else {
                      <mat-icon class="chart-hint">show_chart</mat-icon>
                    }
                  </span>
                </div>
              }
            </div>
          </div>

          <!-- Colonne droite : convertisseur + sparkline -->
          <div class="right-col">

            <!-- Convertisseur -->
            <div class="card conv-card">
              <h3 class="card-title">
                <mat-icon>swap_horiz</mat-icon>
                Convertisseur
              </h3>

              <div class="conv-form">
                <div class="conv-row">
                  <!-- Montant -->
                  <mat-form-field appearance="outline" class="conv-ff amount-ff">
                    <mat-label>Montant</mat-label>
                    <input matInput type="number" [(ngModel)]="convAmount"
                      (ngModelChange)="onConvChange()" min="0" />
                  </mat-form-field>

                  <!-- De -->
                  <mat-form-field appearance="outline" class="conv-ff">
                    <mat-label>De</mat-label>
                    <mat-select [(ngModel)]="convFrom" (ngModelChange)="onConvChange()">
                      <mat-select-trigger>
                        {{ currencyOption(convFrom)?.flag }} {{ convFrom }}
                      </mat-select-trigger>
                      @for (opt of currencyOptions(); track opt.code) {
                        <mat-option [value]="opt.code">
                          <span class="opt-flag">{{ opt.flag }}</span>
                          <span class="opt-code">{{ opt.code }}</span>
                          <span class="opt-name">{{ opt.name }}</span>
                        </mat-option>
                      }
                    </mat-select>
                  </mat-form-field>

                  <button class="swap-btn" (click)="swapCurrencies()" matTooltip="Inverser les devises">
                    <mat-icon>swap_horiz</mat-icon>
                  </button>

                  <!-- Vers -->
                  <mat-form-field appearance="outline" class="conv-ff">
                    <mat-label>Vers</mat-label>
                    <mat-select [(ngModel)]="convTo" (ngModelChange)="onConvChange()">
                      <mat-select-trigger>
                        {{ currencyOption(convTo)?.flag }} {{ convTo }}
                      </mat-select-trigger>
                      @for (opt of currencyOptions(); track opt.code) {
                        <mat-option [value]="opt.code">
                          <span class="opt-flag">{{ opt.flag }}</span>
                          <span class="opt-code">{{ opt.code }}</span>
                          <span class="opt-name">{{ opt.name }}</span>
                        </mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>

                <div class="conv-result">
                  <span class="conv-from">{{ convAmount | number:'1.2-2' }} {{ convFrom }}</span>
                  <mat-icon>east</mat-icon>
                  <span class="conv-to">{{ convResult() | number:'1.4-4' }} {{ convTo }}</span>
                </div>

                @if (convRate() !== null && convFrom !== convTo) {
                  <p class="conv-hint">1 {{ convFrom }} = {{ convRate() | number:'1.6-6' }} {{ convTo }}</p>
                }
              </div>
            </div>

            <!-- Sparkline -->
            @if (selectedCurrency()) {
              <div class="card sparkline-card">
                <h3 class="card-title">
                  <mat-icon>timeline</mat-icon>
                  EUR / {{ selectedCurrency() }} — 7 derniers jours
                </h3>

                @if (!selectedRate()?.hasHistory) {
                  <div class="no-history">
                    <mat-icon>info_outline</mat-icon>
                    <span>Historique non disponible — l'ariary malgache n'est pas suivi par la BCE.</span>
                  </div>
                } @else if (svc.sparklineLoading()) {
                  <div class="sk sk-sparkline"></div>
                } @else if (svc.sparklinePoints().length > 1) {
                  <div class="sparkline-wrap">
                    <svg [attr.viewBox]="'0 0 ' + svgW + ' ' + (svgH + 24)"
                         width="100%" [attr.height]="svgH + 24" style="overflow:visible;display:block">
                      <defs>
                        <linearGradient id="tcGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stop-color="var(--clr-primary)" stop-opacity="0.22"/>
                          <stop offset="100%" stop-color="var(--clr-primary)" stop-opacity="0.02"/>
                        </linearGradient>
                      </defs>
                      <path [attr.d]="areaPath()" fill="url(#tcGrad)"/>
                      <polyline [attr.points]="linePoints()" fill="none"
                        stroke="var(--clr-primary)" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round"/>
                      @for (dot of dots(); track dot.x) {
                        <circle [attr.cx]="dot.x" [attr.cy]="dot.y" r="3.5"
                          fill="var(--clr-primary)" stroke="white" stroke-width="1.5"/>
                      }
                      @for (lbl of xLabels(); track lbl.x) {
                        <text [attr.x]="lbl.x" [attr.y]="svgH + 18"
                          text-anchor="middle" font-size="9" fill="var(--clr-text-secondary)">
                          {{ lbl.label }}
                        </text>
                      }
                    </svg>

                    <div class="spark-stats">
                      <span class="spark-stat">
                        <mat-icon style="color:var(--clr-negative)">south</mat-icon>
                        Min : {{ sparkMin() | number:'1.4-4' }}
                      </span>
                      <span class="spark-stat">
                        <mat-icon style="color:var(--clr-positive)">north</mat-icon>
                        Max : {{ sparkMax() | number:'1.4-4' }}
                      </span>
                    </div>
                  </div>
                } @else {
                  <p class="no-data">Données insuffisantes pour afficher la tendance.</p>
                }
              </div>
            }

          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }

    .page { display: flex; flex-direction: column; gap: 16px; height: 100%; overflow: hidden; }

    /* En-tête */
    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 16px; flex-wrap: wrap; flex-shrink: 0;
    }
    .page-title {
      display: flex; align-items: center; gap: 10px;
      font-size: 24px; font-weight: 800; color: var(--clr-text-primary); margin: 0 0 4px;
    }
    .title-icon { font-size: 22px; }
    .page-sub { font-size: 13px; color: var(--clr-text-secondary); margin: 0; }

    .btn-refresh {
      display: flex; align-items: center; gap: 6px;
      background: var(--clr-card-bg); border: 1.5px solid var(--clr-border); border-radius: 10px;
      padding: 8px 16px; font-size: 13px; font-weight: 600; color: var(--clr-primary);
      cursor: pointer; transition: background .15s, border-color .15s;
      &:hover:not(:disabled) { background: var(--clr-primary-light); border-color: var(--clr-primary); }
      &:disabled { opacity: .55; cursor: not-allowed; }
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spin { animation: spin .8s linear infinite; }

    /* Bandeau dernière màj */
    .updated-banner {
      display: flex; align-items: center; gap: 8px; flex-shrink: 0;
      background: var(--clr-positive-bg); border: 1px solid #c8e6c9; border-radius: 10px;
      padding: 10px 16px; font-size: 13px; color: var(--clr-positive);
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }
    .ecb-note { font-size: 12px; opacity: .7; }

    /* Erreur */
    .error-card {
      display: flex; align-items: center; gap: 12px;
      background: var(--clr-negative-bg); border: 1px solid #ffcdd2; border-radius: 12px;
      padding: 16px 20px; color: var(--clr-negative);
      mat-icon { font-size: 24px; flex-shrink: 0; }
      strong { font-size: 14px; }
      p { margin: 2px 0 0; font-size: 13px; opacity: .8; }
    }

    /* Skeleton */
    @keyframes shimmer {
      0%   { background-position: -600px 0; }
      100% { background-position: 600px 0; }
    }
    .sk {
      background: linear-gradient(90deg, var(--clr-page-bg) 25%, var(--clr-border) 50%, var(--clr-page-bg) 75%);
      background-size: 1200px 100%;
      animation: shimmer 1.4s infinite linear;
      border-radius: 6px;
    }
    .skeleton-list { display: flex; flex-direction: column; gap: 6px; }
    .skeleton-row {
      display: flex; gap: 12px; align-items: center;
      background: var(--clr-card-bg); border-radius: 10px; padding: 14px 20px;
    }
    .sk-flag   { width: 32px; height: 22px; border-radius: 4px; flex-shrink: 0; }
    .sk-name   { flex: 1; height: 14px; }
    .sk-rate   { width: 100px; height: 14px; }
    .sk-change { width: 80px; height: 14px; }
    .sk-sparkline { width: 100%; height: 90px; border-radius: 8px; margin-top: 8px; }

    /* Grille principale — prend tout l'espace restant */
    .main-grid {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 20px;
      align-items: stretch;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }
    @media (max-width: 1080px) { .main-grid { grid-template-columns: 1fr; overflow-y: auto; } }
    .right-col { display: flex; flex-direction: column; gap: 16px; overflow-y: auto; overflow-x: hidden; }

    /* Carte générique */
    .card {
      background: var(--clr-card-bg);
      border-radius: 16px;
      padding: 20px 24px;
      box-shadow: 0 2px 12px rgba(13,27,42,.07);
    }
    /* La carte du tableau occupe toute la hauteur de la colonne */
    .rates-card {
      display: flex; flex-direction: column; overflow: hidden; padding-bottom: 0;
    }
    .card-title {
      display: flex; align-items: center; gap: 8px; flex-shrink: 0;
      font-size: 15px; font-weight: 700; color: var(--clr-text-primary); margin: 0 0 16px;
      mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--clr-primary); }
    }

    /* Tableau des taux — scrollable */
    .rates-table {
      display: flex; flex-direction: column;
      flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden;
      padding-bottom: 16px;
    }
    .rates-head {
      display: grid; grid-template-columns: 1fr 110px 130px 90px;
      padding: 4px 10px 8px;
      font-size: 11px; font-weight: 700; text-transform: uppercase;
      letter-spacing: .5px; color: var(--clr-text-secondary);
      border-bottom: 1px solid var(--clr-border); margin-bottom: 4px;
      position: sticky; top: 0; z-index: 1;
      background: var(--clr-card-bg);
    }
    .rates-row {
      display: grid; grid-template-columns: 1fr 110px 130px 90px;
      align-items: center; padding: 9px 10px; border-radius: 10px;
      cursor: pointer; transition: background .12s;
      &:hover { background: var(--clr-primary-light); }
      &.selected { background: var(--clr-primary-light); }
    }
    .currency-cell { display: flex; align-items: center; gap: 10px; }
    .flag { font-size: 22px; line-height: 1; }
    .code { font-size: 14px; font-weight: 700; color: var(--clr-text-primary); display: block; }
    .cname { font-size: 11px; color: var(--clr-text-secondary); display: block; }

    .r { text-align: right; }
    .rate-val { font-size: 14px; font-weight: 600; color: var(--clr-text-primary); font-variant-numeric: tabular-nums; }

    .change-cell {
      display: flex; align-items: center; justify-content: flex-end; gap: 2px;
      font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums;
      &.pos { color: var(--clr-positive); }
      &.neg { color: var(--clr-negative); }
      &.neu { color: var(--clr-text-secondary); }
      .arrow { font-size: 13px; width: 13px; height: 13px; }
    }
    .trend-cell { display: flex; justify-content: flex-end; align-items: center; }
    .active-hint { font-size: 11px; color: var(--clr-primary); font-style: italic; }
    .chart-hint { font-size: 16px; color: var(--clr-border); }

    /* Convertisseur */
    .conv-form { display: flex; flex-direction: column; gap: 6px; }
    .conv-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

    .conv-ff { flex: 1; min-width: 90px; }
    .amount-ff { flex: 1.1; }

    /* Surcharge Material outline pour coller au design de la carte */
    :host ::ng-deep .conv-ff {
      .mat-mdc-text-field-wrapper { background: var(--clr-page-bg); border-radius: 10px; }
      .mdc-notched-outline__leading,
      .mdc-notched-outline__notch,
      .mdc-notched-outline__trailing { border-color: var(--clr-border) !important; }
      &:focus-within .mdc-notched-outline__leading,
      &:focus-within .mdc-notched-outline__notch,
      &:focus-within .mdc-notched-outline__trailing { border-color: var(--clr-primary) !important; }
      .mat-mdc-select-value, input { font-size: 14px; color: var(--clr-text-primary); }
      .mat-mdc-form-field-subscript-wrapper { display: none; } /* masquer la ligne d'erreur */
    }

    .swap-btn {
      display: flex; align-items: center; justify-content: center;
      width: 36px; height: 36px; border: 1.5px solid var(--clr-border); border-radius: 50%;
      background: var(--clr-card-bg); cursor: pointer; flex-shrink: 0;
      color: var(--clr-primary); transition: background .15s;
      &:hover { background: var(--clr-primary-light); }
    }

    /* Options dans le panneau déroulant */
    .opt-flag { font-size: 18px; margin-right: 8px; vertical-align: middle; }
    .opt-code { font-weight: 700; font-size: 13px; color: var(--clr-text-primary); margin-right: 6px; }
    .opt-name { font-size: 12px; color: var(--clr-text-secondary); }
    .conv-result {
      display: flex; align-items: center; gap: 10px;
      background: var(--clr-primary-light); border-radius: 12px; padding: 12px 16px;
    }
    .conv-from { font-size: 15px; font-weight: 600; color: var(--clr-text-secondary); }
    .conv-to   { font-size: 20px; font-weight: 800; color: var(--clr-primary); }
    .conv-hint { font-size: 12px; color: var(--clr-text-secondary); margin: 0; text-align: right; }

    /* Sparkline */
    .sparkline-wrap { display: flex; flex-direction: column; gap: 10px; }
    .spark-stats { display: flex; justify-content: space-between; }
    .spark-stat {
      display: flex; align-items: center; gap: 4px;
      font-size: 12px; color: var(--clr-text-secondary);
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }
    .no-data { text-align: center; font-size: 13px; color: var(--clr-text-secondary); padding: 16px 0; }
    .no-history {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; color: var(--clr-text-secondary);
      background: var(--clr-page-bg); border-radius: 10px; padding: 12px 14px;
      mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }
    }
    .chart-na { font-size: 16px; color: var(--clr-border); }
  `],
})
export class TauxChangeComponent implements OnInit {
  readonly svc = inject(TauxChangeService);
  readonly skeletonRows = Array.from({ length: 8 });

  // Convertisseur
  convAmount = 1;
  convFrom = 'EUR';
  convTo = 'USD';
  private readonly _convVersion = signal(0); // trigger recompute on form changes

  convResult = computed<number>(() => {
    this._convVersion(); // tracked dependency
    return this.convert(this.convAmount, this.convFrom, this.convTo);
  });

  convRate = computed<number | null>(() => {
    this._convVersion();
    if (this.convFrom === this.convTo) return null;
    return this.convert(1, this.convFrom, this.convTo);
  });

  // Sélection sparkline
  selectedCurrency = signal<string>('');
  selectedRate = computed(() => this.svc.rates().find((r) => r.code === this.selectedCurrency()));

  /** Liste triée pour le convertisseur : EUR en premier, puis ordre alphabétique */
  readonly currencyOptions = computed(() => {
    const ratesMap = new Map(this.svc.rates().map((r) => [r.code, { flag: r.flag, name: r.name }]));
    ratesMap.set('EUR', { flag: '🇪🇺', name: 'Euro' });
    return ['EUR', ...EXTRA_CURRENCIES]
      .filter((code) => ratesMap.has(code))
      .map((code) => ({ code, flag: ratesMap.get(code)?.flag ?? '', name: ratesMap.get(code)?.name ?? code }));
  });

  currencyOption(code: string) {
    return this.currencyOptions().find((o) => o.code === code);
  }

  // SVG dimensions
  readonly svgW = 320;
  readonly svgH = 100;
  private readonly pad = { t: 8, r: 8, b: 8, l: 8 };

  ngOnInit(): void {
    if (!this.svc.hasData()) {
      this.svc.loadRates();
    }
  }

  selectCurrency(code: string): void {
    if (this.selectedCurrency() === code) {
      this.selectedCurrency.set('');
      return;
    }
    this.selectedCurrency.set(code);
    const rate = this.svc.rates().find((r) => r.code === code);
    if (rate?.hasHistory) {
      this.svc.loadSparkline(code);
    }
    this.convTo = code;
    this.onConvChange();
  }

  onConvChange(): void {
    this._convVersion.update((v) => v + 1);
  }

  swapCurrencies(): void {
    [this.convFrom, this.convTo] = [this.convTo, this.convFrom];
    this.onConvChange();
  }

  private convert(amount: number, from: string, to: string): number {
    if (from === to) return amount;
    const rates = this.svc.rates();
    const getRate = (code: string) => {
      if (code === 'EUR') return 1;
      return rates.find((r) => r.code === code)?.rate ?? 0;
    };
    const fromRate = getRate(from);
    if (fromRate === 0) return 0;
    return (amount / fromRate) * getRate(to);
  }

  // ── Sparkline SVG ──

  private readonly coords = computed<{ x: number; y: number }[]>(() => {
    const pts = this.svc.sparklinePoints();
    if (pts.length < 2) return [];
    const W = this.svgW - this.pad.l - this.pad.r;
    const H = this.svgH - this.pad.t - this.pad.b;
    const min = this.sparkMin();
    const max = this.sparkMax();
    const range = max - min || 1;
    return pts.map((pt, i) => ({
      x: this.pad.l + (i / (pts.length - 1)) * W,
      y: this.pad.t + H - ((pt.rate - min) / range) * H,
    }));
  });

  sparkMin = computed<number>(() => {
    const pts = this.svc.sparklinePoints();
    return pts.length ? Math.min(...pts.map((p) => p.rate)) : 0;
  });

  sparkMax = computed<number>(() => {
    const pts = this.svc.sparklinePoints();
    return pts.length ? Math.max(...pts.map((p) => p.rate)) : 0;
  });

  linePoints = computed<string>(() =>
    this.coords()
      .map((p) => `${p.x},${p.y}`)
      .join(' '),
  );

  dots = computed<{ x: number; y: number }[]>(() => this.coords());

  areaPath = computed<string>(() => {
    const c = this.coords();
    if (c.length < 2) return '';
    const bottom = this.svgH - this.pad.b;
    const line = c.map((p) => `${p.x},${p.y}`).join(' L ');
    const last = c.at(-1);
    return `M ${c[0].x},${c[0].y} L ${line} L ${last?.x ?? 0},${bottom} L ${c[0].x},${bottom} Z`;
  });

  xLabels = computed<{ x: number; label: string }[]>(() => {
    const pts = this.svc.sparklinePoints();
    const c = this.coords();
    return c.map((coord, i) => ({
      x: coord.x,
      label: this.shortDate(pts[i]?.date ?? ''),
    }));
  });

  private shortDate(iso: string): string {
    const parts = iso.split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}` : iso;
  }
}
