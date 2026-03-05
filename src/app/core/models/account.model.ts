import { JournalLine } from './journal-line.model';

export interface Account {
  id: number;
  code: string;
  name: string;
  class: number;
  journalLines?: JournalLine[];
}

export interface CreateAccountDto {
  code: string;
  name: string;
  class: number;
}

export interface UpdateAccountDto extends Partial<CreateAccountDto> {}
