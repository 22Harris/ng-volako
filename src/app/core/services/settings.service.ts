import { Injectable, signal, computed } from '@angular/core';

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  example: string;
}

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: 'MGA', symbol: 'Ar',   name: 'Ariary malgache',    flag: '🇲🇬', example: '150.000 Ar'   },
  { code: 'EUR', symbol: '€',    name: 'Euro',               flag: '🇪🇺', example: '1.500 €'      },
  { code: 'USD', symbol: '$',    name: 'Dollar américain',   flag: '🇺🇸', example: '1.500 $'      },
  { code: 'GBP', symbol: '£',    name: 'Livre sterling',     flag: '🇬🇧', example: '1.500 £'      },
  { code: 'CHF', symbol: 'CHF',  name: 'Franc suisse',       flag: '🇨🇭', example: '1.500 CHF'    },
  { code: 'JPY', symbol: '¥',    name: 'Yen japonais',       flag: '🇯🇵', example: '150.000 ¥'    },
  { code: 'CAD', symbol: 'CA$',  name: 'Dollar canadien',    flag: '🇨🇦', example: '1.500 CA$'    },
  { code: 'XOF', symbol: 'FCFA', name: 'Franc CFA (UEMOA)', flag: '🌍',  example: '1.500 FCFA'   },
  { code: 'KMF', symbol: 'FC',   name: 'Franc comorien',     flag: '🇰🇲', example: '1.500 FC'     },
  { code: 'MUR', symbol: 'Rs',   name: 'Roupie mauricienne', flag: '🇲🇺', example: '1.500 Rs'     },
  { code: 'ZAR', symbol: 'R',    name: 'Rand sud-africain',  flag: '🇿🇦', example: '1.500 R'      },
];

const STORAGE_KEY = 'app_currency';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  readonly currencyCode = signal<string>(
    localStorage.getItem(STORAGE_KEY) ?? 'MGA',
  );

  readonly currency = computed(
    () => CURRENCY_OPTIONS.find((c) => c.code === this.currencyCode()) ?? CURRENCY_OPTIONS[0],
  );

  readonly currencySymbol = computed(() => this.currency().symbol);

  setCurrency(code: string): void {
    localStorage.setItem(STORAGE_KEY, code);
    this.currencyCode.set(code);
  }
}
