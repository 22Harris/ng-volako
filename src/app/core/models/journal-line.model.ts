export interface JournalLine {
  id?: number;
  debit: number;    // entier en centimes
  credit: number;   // entier en centimes
  accountId: number;
  entryId?: number;
}

export interface CreateJournalLineDto {
  debit: number;
  credit: number;
  accountId: number;
}
