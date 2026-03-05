import { JournalEntry } from './journal-entry.model';

export enum OperationType {
  /* EXPLOITATION */
  PURCHASE             = 'PURCHASE',
  SALE                 = 'SALE',
  SERVICE_EXPENSE      = 'SERVICE_EXPENSE',
  SERVICE_INCOME       = 'SERVICE_INCOME',
  /* FINANCIÈRES */
  PAYMENT              = 'PAYMENT',
  RECEIPT              = 'RECEIPT',
  TRANSFER             = 'TRANSFER',
  BANK_DEPOSIT         = 'BANK_DEPOSIT',
  BANK_WITHDRAWAL      = 'BANK_WITHDRAWAL',
  /* PRÊTS & DETTES */
  LOAN_GIVEN           = 'LOAN_GIVEN',
  LOAN_RECEIVED        = 'LOAN_RECEIVED',
  LOAN_REPAYMENT       = 'LOAN_REPAYMENT',
  DEBT_PAYMENT         = 'DEBT_PAYMENT',
  /* DONS & SUBVENTIONS */
  DONATION_GIVEN       = 'DONATION_GIVEN',
  DONATION_RECEIVED    = 'DONATION_RECEIVED',
  SUBSIDY_RECEIVED     = 'SUBSIDY_RECEIVED',
  /* INVESTISSEMENTS */
  ASSET_PURCHASE       = 'ASSET_PURCHASE',
  ASSET_SALE           = 'ASSET_SALE',
  DEPRECIATION         = 'DEPRECIATION',
  /* SALAIRES & SOCIAL */
  SALARY_PAYMENT       = 'SALARY_PAYMENT',
  SOCIAL_CONTRIBUTION  = 'SOCIAL_CONTRIBUTION',
  /* FISCALITÉ */
  TAX_PAYMENT          = 'TAX_PAYMENT',
  VAT_COLLECTED        = 'VAT_COLLECTED',
  VAT_DEDUCTED         = 'VAT_DEDUCTED',
  /* EXCEPTIONNEL */
  FINE                 = 'FINE',
  LOSS                 = 'LOSS',
  GAIN                 = 'GAIN',
  /* CORRECTIONS */
  ADJUSTMENT           = 'ADJUSTMENT',
  OPENING_BALANCE      = 'OPENING_BALANCE',
  CLOSING_BALANCE      = 'CLOSING_BALANCE',
}

export interface Operation {
  id: number;
  type: OperationType;
  date: string;
  label: string;
  amount: number;
  entries: JournalEntry[];
}

export interface CreateOperationDto {
  type: OperationType;
  date: string;
  label: string;
  amount: number;
}

export interface UpdateOperationDto extends Partial<CreateOperationDto> {}
