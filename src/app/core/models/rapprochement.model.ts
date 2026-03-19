export interface JournalLineRef {
  id: number;
  debit: number;
  credit: number;
  accountId: number;
  entryId: number;
  account: { id: number; code: string; name: string } | null;
  entry: { id: number; date: string; label: string } | null;
}

export interface LigneReleve {
  id: number;
  releveId: number;
  date: string;
  libelle: string;
  montant: number; // centimes, positif = crédit, négatif = débit
  reference: string | null;
  rapprochee: boolean;
  journalLineId: number | null;
  journalLine: JournalLineRef | null;
}

export interface ReleveImport {
  id: number;
  nom: string;
  dateDebut: string | null;
  dateFin: string | null;
  soldeDebut: number | null;
  soldeFin: number | null;
  createdAt: string;
  lignes: LigneReleve[];
}

export interface ImportReleveResult extends ReleveImport {}

export interface RapprocherDto {
  journalLineId: number;
}
