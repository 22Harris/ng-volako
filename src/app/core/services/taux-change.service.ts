import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of, EMPTY } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  FrankfurterLatestResponse,
  FrankfurterHistoricalResponse,
  CurrencyRate,
  TauxChangeState,
  SparklinePoint,
} from '../models/taux-change.model';

/** Devises à afficher dans le tableau (open.er-api.com) */
const TRACKED = [
  // Grandes devises mondiales
  'USD', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD', 'CNY',
  // Asie-Pacifique
  'HKD', 'SGD', 'INR', 'KRW', 'NZD', 'IDR', 'MYR', 'PHP', 'THB',
  // Amériques
  'BRL', 'MXN',
  // Afrique & Océan Indien
  'ZAR', 'MGA',
  // Moyen-Orient
  'ILS',
  // Europe hors zone euro
  'TRY', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'ISK',
];

/** Devises disponibles dans l'historique BCE (frankfurter.app) */
const ECB_CURRENCIES = new Set([
  'USD', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD', 'CNY',
  'HKD', 'SGD', 'INR', 'KRW', 'NZD', 'IDR', 'MYR', 'PHP', 'THB',
  'BRL', 'MXN', 'ZAR', 'ILS',
  'TRY', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'ISK',
]);

const NAMES: Record<string, string> = {
  USD: 'Dollar américain',
  GBP: 'Livre sterling',
  CHF: 'Franc suisse',
  JPY: 'Yen japonais',
  CAD: 'Dollar canadien',
  AUD: 'Dollar australien',
  CNY: 'Yuan renminbi',
  HKD: 'Dollar de Hong Kong',
  SGD: 'Dollar de Singapour',
  INR: 'Roupie indienne',
  KRW: 'Won sud-coréen',
  NZD: 'Dollar néo-zélandais',
  IDR: 'Roupie indonésienne',
  MYR: 'Ringgit malaisien',
  PHP: 'Peso philippin',
  THB: 'Baht thaïlandais',
  BRL: 'Real brésilien',
  MXN: 'Peso mexicain',
  ZAR: 'Rand sud-africain',
  MGA: 'Ariary malgache',
  ILS: 'Sheqel israélien',
  TRY: 'Livre turque',
  SEK: 'Couronne suédoise',
  NOK: 'Couronne norvégienne',
  DKK: 'Couronne danoise',
  PLN: 'Zloty polonais',
  CZK: 'Couronne tchèque',
  HUF: 'Forint hongrois',
  RON: 'Leu roumain',
  ISK: 'Couronne islandaise',
};

const FLAGS: Record<string, string> = {
  USD: '🇺🇸',
  GBP: '🇬🇧',
  CHF: '🇨🇭',
  JPY: '🇯🇵',
  CAD: '🇨🇦',
  AUD: '🇦🇺',
  CNY: '🇨🇳',
  HKD: '🇭🇰',
  SGD: '🇸🇬',
  INR: '🇮🇳',
  KRW: '🇰🇷',
  NZD: '🇳🇿',
  IDR: '🇮🇩',
  MYR: '🇲🇾',
  PHP: '🇵🇭',
  THB: '🇹🇭',
  BRL: '🇧🇷',
  MXN: '🇲🇽',
  ZAR: '🇿🇦',
  MGA: '🇲🇬',
  ILS: '🇮🇱',
  TRY: '🇹🇷',
  SEK: '🇸🇪',
  NOK: '🇳🇴',
  DKK: '🇩🇰',
  PLN: '🇵🇱',
  CZK: '🇨🇿',
  HUF: '🇭🇺',
  RON: '🇷🇴',
  ISK: '🇮🇸',
};

const API = `${environment.apiUrl}/taux-change`;

@Injectable({ providedIn: 'root' })
export class TauxChangeService {
  private readonly http = inject(HttpClient);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly state = signal<TauxChangeState>({ rates: [], lastUpdated: null, dataDate: '' });
  readonly sparklineLoading = signal(false);
  readonly sparklinePoints = signal<SparklinePoint[]>([]);

  readonly rates = computed(() => this.state().rates);
  readonly lastUpdated = computed(() => this.state().lastUpdated);
  readonly dataDate = computed(() => this.state().dataDate);
  readonly hasData = computed(() => this.state().rates.length > 0);

  loadRates(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      latest: this.http.get<FrankfurterLatestResponse>(`${API}/latest`),
      prev: this.http
        .get<FrankfurterHistoricalResponse>(
          `${API}/historical?startDate=${this.nDaysAgo(4)}&endDate=${this.nDaysAgo(1)}`,
        )
        .pipe(catchError(() => of(null))),
    })
      .pipe(
        map(({ latest, prev }) => this.buildState(latest, prev)),
        catchError(() => {
          this.error.set('Impossible de charger les taux de change. Vérifiez votre connexion.');
          this.loading.set(false);
          return EMPTY;
        }),
      )
      .subscribe((newState) => {
        this.state.set(newState);
        this.loading.set(false);
      });
  }

  refresh(): void {
    this.state.set({ rates: [], lastUpdated: null, dataDate: '' });
    this.sparklinePoints.set([]);
    this.loadRates();
  }

  loadSparkline(code: string): void {
    this.sparklineLoading.set(true);
    this.sparklinePoints.set([]);
    this.http
      .get<FrankfurterHistoricalResponse>(
        `${API}/historical?startDate=${this.nDaysAgo(7)}&endDate=${this.nDaysAgo(1)}&to=${code}`,
      )
      .pipe(
        map((res) =>
          Object.entries(res.rates)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, dayRates]) => ({ date, rate: dayRates[code] ?? 0 })),
        ),
        catchError(() => of([] as SparklinePoint[])),
      )
      .subscribe((pts) => {
        this.sparklinePoints.set(pts);
        this.sparklineLoading.set(false);
      });
  }

  private buildState(
    latest: FrankfurterLatestResponse,
    prev: FrankfurterHistoricalResponse | null,
  ): TauxChangeState {
    const snap = prev ? this.latestSnapshot(prev) : {};
    const rates: CurrencyRate[] = TRACKED.filter((c) => c in latest.rates).map((code) => {
      const rate = latest.rates[code];
      const previousRate = snap[code] ?? 0;
      return {
        code,
        name: NAMES[code] ?? code,
        flag: FLAGS[code] ?? '',
        rate,
        previousRate,
        hasHistory: ECB_CURRENCIES.has(code),
        changePercent: previousRate > 0 ? ((rate - previousRate) / previousRate) * 100 : 0,
      };
    });
    return { rates, lastUpdated: new Date(), dataDate: latest.date };
  }

  private latestSnapshot(res: FrankfurterHistoricalResponse): Record<string, number> {
    const dates = Object.keys(res.rates).sort((a, b) => a.localeCompare(b));
    const d = dates.length >= 2 ? dates.at(-2) : dates[0];
    return d ? res.rates[d] : {};
  }

  private nDaysAgo(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
  }
}
