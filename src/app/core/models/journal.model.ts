export type JournalType = 'ACHATS' | 'VENTES' | 'BANQUE' | 'CAISSE' | 'OD';

export const JOURNAL_TYPE_LABELS: Record<JournalType, string> = {
  ACHATS: 'Achats',
  VENTES: 'Ventes',
  BANQUE: 'Banque',
  CAISSE: 'Caisse',
  OD: 'Opérations Diverses',
};

export const JOURNAL_PREFIXES: Record<JournalType, string> = {
  ACHATS: 'AC',
  VENTES: 'VT',
  BANQUE: 'BQ',
  CAISSE: 'CA',
  OD: 'OD',
};

export interface Journal {
  id: number;
  type: JournalType;
  userId: number;
}
