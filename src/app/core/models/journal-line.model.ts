export type CodeTva =
  | 'NORMAL_20'
  | 'INTERMEDIAIRE_10'
  | 'REDUIT_5_5'
  | 'PARTICULIER_2_1'
  | 'EXONERE'
  | 'HORS_CHAMP';

export const CODE_TVA_LABELS: Record<CodeTva, string> = {
  NORMAL_20:        'TVA 20 % (normal)',
  INTERMEDIAIRE_10: 'TVA 10 % (intermédiaire)',
  REDUIT_5_5:       'TVA 5,5 % (réduit)',
  PARTICULIER_2_1:  'TVA 2,1 % (particulier)',
  EXONERE:          'Exonéré',
  HORS_CHAMP:       'Hors champ',
};

export interface JournalLine {
  id?: number;
  debit: number;    // entier en centimes
  credit: number;   // entier en centimes
  accountId: number;
  entryId?: number;
  codeTva?: CodeTva;
}

export interface CreateJournalLineDto {
  debit: number;
  credit: number;
  accountId: number;
  codeTva?: CodeTva;
}
