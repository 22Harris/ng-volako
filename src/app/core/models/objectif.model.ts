export type ObjectifCategorie =
  | 'EPARGNE'
  | 'INVESTISSEMENT'
  | 'REMBOURSEMENT'
  | 'PROJET'
  | 'SECURITE'
  | 'RETRAITE'
  | 'AUTRE';

export type ObjectifStatut = 'EN_COURS' | 'ATTEINT' | 'EN_PAUSE' | 'ABANDONNE';

export interface Objectif {
  id: number;
  nom: string;
  description?: string;
  categorie: ObjectifCategorie;
  montantCible: number;   // centimes
  montantActuel: number;  // centimes
  dateDebut: string;      // ISO
  dateEcheance: string;   // ISO
  couleur: string;
  icone: string;
  statut: ObjectifStatut;
}

export interface CreateObjectifDto extends Omit<Objectif, 'id'> {}
export interface UpdateObjectifDto extends Partial<CreateObjectifDto> {}
