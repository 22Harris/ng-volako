import { JournalLine, CreateJournalLineDto } from './journal-line.model';

export interface JournalEntry {
  id: number;
  date: string;         // ISO 8601
  label: string;
  operationId?: number;
  lines: JournalLine[];
}

export interface CreateJournalEntryDto {
  date: string;
  label: string;
  operationId?: number;
  lines: CreateJournalLineDto[];
}

export interface UpdateJournalEntryDto extends Partial<CreateJournalEntryDto> {}
