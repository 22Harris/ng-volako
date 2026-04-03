import { JournalLine, CreateJournalLineDto } from './journal-line.model';

export type EntryStatus = 'BROUILLON' | 'VALIDE' | 'VERROUILLE';

export interface JournalEntry {
  id: number;
  date: string;         // ISO 8601
  label: string;
  operationId?: number;
  journalId?: number;
  pieceNumber?: string;
  statut: EntryStatus;
  lines: JournalLine[];
}

export interface CreateJournalEntryDto {
  date: string;
  label: string;
  operationId?: number;
  journalId?: number;
  lines: CreateJournalLineDto[];
}

export interface UpdateJournalEntryDto extends Partial<CreateJournalEntryDto> {}
