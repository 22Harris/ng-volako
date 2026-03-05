import { OperationType } from '../models/operation.model';

export type OperationCategory =
  | 'EXPLOITATION'
  | 'FINANCIERE'
  | 'PRETS_DETTES'
  | 'DONS_SUBVENTIONS'
  | 'INVESTISSEMENT'
  | 'SALAIRES_SOCIAL'
  | 'FISCALITE'
  | 'EXCEPTIONNEL'
  | 'CORRECTIONS';

export interface OperationTypeConfig {
  label:      string;
  category:   OperationCategory;
  icon:       string;
  colorClass: string;
}

export const OPERATION_TYPE_CONFIG: Record<OperationType, OperationTypeConfig> = {
  // EXPLOITATION
  [OperationType.PURCHASE]:            { label: 'Achat',                  category: 'EXPLOITATION',     icon: 'shopping_cart',          colorClass: 'badge-red'    },
  [OperationType.SALE]:                { label: 'Vente',                  category: 'EXPLOITATION',     icon: 'point_of_sale',          colorClass: 'badge-green'  },
  [OperationType.SERVICE_EXPENSE]:     { label: 'Dépense de service',     category: 'EXPLOITATION',     icon: 'build',                  colorClass: 'badge-orange' },
  [OperationType.SERVICE_INCOME]:      { label: 'Revenu de service',      category: 'EXPLOITATION',     icon: 'work',                   colorClass: 'badge-green'  },
  // FINANCIÈRES
  [OperationType.PAYMENT]:             { label: 'Paiement',               category: 'FINANCIERE',       icon: 'payments',               colorClass: 'badge-red'    },
  [OperationType.RECEIPT]:             { label: 'Encaissement',           category: 'FINANCIERE',       icon: 'savings',                colorClass: 'badge-green'  },
  [OperationType.TRANSFER]:            { label: 'Transfert interne',      category: 'FINANCIERE',       icon: 'swap_horiz',             colorClass: 'badge-blue'   },
  [OperationType.BANK_DEPOSIT]:        { label: 'Dépôt bancaire',         category: 'FINANCIERE',       icon: 'account_balance',        colorClass: 'badge-blue'   },
  [OperationType.BANK_WITHDRAWAL]:     { label: 'Retrait bancaire',       category: 'FINANCIERE',       icon: 'money_off',              colorClass: 'badge-orange' },
  // PRÊTS & DETTES
  [OperationType.LOAN_GIVEN]:          { label: 'Prêt accordé',           category: 'PRETS_DETTES',     icon: 'trending_up',            colorClass: 'badge-purple' },
  [OperationType.LOAN_RECEIVED]:       { label: 'Prêt reçu',              category: 'PRETS_DETTES',     icon: 'trending_down',          colorClass: 'badge-purple' },
  [OperationType.LOAN_REPAYMENT]:      { label: 'Remboursement de prêt',  category: 'PRETS_DETTES',     icon: 'replay',                 colorClass: 'badge-purple' },
  [OperationType.DEBT_PAYMENT]:        { label: 'Paiement de dette',      category: 'PRETS_DETTES',     icon: 'receipt_long',           colorClass: 'badge-red'    },
  // DONS & SUBVENTIONS
  [OperationType.DONATION_GIVEN]:      { label: 'Don donné',              category: 'DONS_SUBVENTIONS', icon: 'volunteer_activism',     colorClass: 'badge-pink'   },
  [OperationType.DONATION_RECEIVED]:   { label: 'Don reçu',               category: 'DONS_SUBVENTIONS', icon: 'redeem',                 colorClass: 'badge-pink'   },
  [OperationType.SUBSIDY_RECEIVED]:    { label: 'Subvention reçue',       category: 'DONS_SUBVENTIONS', icon: 'account_balance_wallet', colorClass: 'badge-teal'   },
  // INVESTISSEMENTS
  [OperationType.ASSET_PURCHASE]:      { label: 'Achat immobilisation',   category: 'INVESTISSEMENT',   icon: 'real_estate_agent',      colorClass: 'badge-indigo' },
  [OperationType.ASSET_SALE]:          { label: 'Vente immobilisation',   category: 'INVESTISSEMENT',   icon: 'sell',                   colorClass: 'badge-indigo' },
  [OperationType.DEPRECIATION]:        { label: 'Amortissement',          category: 'INVESTISSEMENT',   icon: 'exposure_neg_1',         colorClass: 'badge-gray'   },
  // SALAIRES & SOCIAL
  [OperationType.SALARY_PAYMENT]:      { label: 'Paiement salaire',       category: 'SALAIRES_SOCIAL',  icon: 'badge',                  colorClass: 'badge-cyan'   },
  [OperationType.SOCIAL_CONTRIBUTION]: { label: 'Cotisations sociales',   category: 'SALAIRES_SOCIAL',  icon: 'groups',                 colorClass: 'badge-cyan'   },
  // FISCALITÉ
  [OperationType.TAX_PAYMENT]:         { label: "Paiement d'impôt",       category: 'FISCALITE',        icon: 'gavel',                  colorClass: 'badge-yellow' },
  [OperationType.VAT_COLLECTED]:       { label: 'TVA collectée',          category: 'FISCALITE',        icon: 'percent',                colorClass: 'badge-yellow' },
  [OperationType.VAT_DEDUCTED]:        { label: 'TVA déductible',         category: 'FISCALITE',        icon: 'percent',                colorClass: 'badge-yellow' },
  // EXCEPTIONNEL
  [OperationType.FINE]:                { label: 'Amende',                 category: 'EXCEPTIONNEL',     icon: 'warning',                colorClass: 'badge-red'    },
  [OperationType.LOSS]:                { label: 'Perte exceptionnelle',   category: 'EXCEPTIONNEL',     icon: 'trending_down',          colorClass: 'badge-red'    },
  [OperationType.GAIN]:                { label: 'Gain exceptionnel',      category: 'EXCEPTIONNEL',     icon: 'trending_up',            colorClass: 'badge-green'  },
  // CORRECTIONS
  [OperationType.ADJUSTMENT]:          { label: 'Ajustement comptable',   category: 'CORRECTIONS',      icon: 'tune',                   colorClass: 'badge-gray'   },
  [OperationType.OPENING_BALANCE]:     { label: "Solde d'ouverture",      category: 'CORRECTIONS',      icon: 'play_circle',            colorClass: 'badge-gray'   },
  [OperationType.CLOSING_BALANCE]:     { label: 'Solde de clôture',       category: 'CORRECTIONS',      icon: 'stop_circle',            colorClass: 'badge-gray'   },
};

export const CATEGORY_LABELS: Record<OperationCategory, string> = {
  EXPLOITATION:     'Exploitation',
  FINANCIERE:       'Financières',
  PRETS_DETTES:     'Prêts & Dettes',
  DONS_SUBVENTIONS: 'Dons & Subventions',
  INVESTISSEMENT:   'Investissements',
  SALAIRES_SOCIAL:  'Salaires & Social',
  FISCALITE:        'Fiscalité',
  EXCEPTIONNEL:     'Exceptionnel',
  CORRECTIONS:      'Corrections',
};

export const OPERATION_TYPES_BY_CATEGORY: Record<OperationCategory, OperationType[]> =
  (Object.entries(OPERATION_TYPE_CONFIG) as [OperationType, OperationTypeConfig][])
    .reduce((acc, [type, cfg]) => {
      acc[cfg.category] ??= [];
      acc[cfg.category].push(type);
      return acc;
    }, {} as Record<OperationCategory, OperationType[]>);
