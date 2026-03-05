export type EvenementCategorie =
  | 'LOYER'
  | 'ECOLAGE'
  | 'CARBURANT'
  | 'EPARGNE'
  | 'ALIMENTATION'
  | 'SANTE'
  | 'TRANSPORT'
  | 'ABONNEMENT'
  | 'LOISIRS'
  | 'AUTRE';

export type EvenementRecurrence = 'MENSUEL' | 'HEBDOMADAIRE' | 'ANNUEL' | 'UNIQUE';
export type EvenementStatut = 'EN_ATTENTE' | 'PAYE' | 'EN_RETARD';

export interface Evenement {
  id: number;
  titre: string;
  categorie: EvenementCategorie;
  montant: number; // en centimes
  dateEcheance: string; // ISO date YYYY-MM-DD
  recurrence: EvenementRecurrence;
  statut: EvenementStatut;
  notes?: string;
}

export interface CreateEvenementDto extends Omit<Evenement, 'id'> {}
export interface UpdateEvenementDto extends Partial<CreateEvenementDto> {}
