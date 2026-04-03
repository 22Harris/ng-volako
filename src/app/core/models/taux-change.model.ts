export interface FrankfurterLatestResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

export interface FrankfurterHistoricalResponse {
  amount: number;
  base: string;
  start_date: string;
  end_date: string;
  rates: Record<string, Record<string, number>>;
}

export interface CurrencyRate {
  code: string;
  name: string;
  flag: string;
  rate: number;
  previousRate: number;
  changePercent: number;
  /** Vrai si la devise est disponible dans l'historique BCE (frankfurter.app) */
  hasHistory: boolean;
}

export interface TauxChangeState {
  rates: CurrencyRate[];
  lastUpdated: Date | null;
  dataDate: string;
}

export interface SparklinePoint {
  date: string;
  rate: number;
}
