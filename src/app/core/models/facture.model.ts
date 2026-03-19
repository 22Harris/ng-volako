export type FactureStatut = 'EN_ATTENTE' | 'PARTIELLEMENT_PAYEE' | 'PAYEE' | 'ANNULEE';
export type PaiementMode = 'VIREMENT' | 'CHEQUE' | 'ESPECES' | 'CARTE' | 'PRELEVEMENT';

export interface Paiement {
  id: number;
  date: string;
  montant: number;
  mode: PaiementMode;
  reference?: string;
  factureId: number;
}

export interface Facture {
  id: number;
  numero: string;
  date: string;
  dateEcheance?: string;
  montant: number;
  statut: FactureStatut;
  notes?: string;
  tiersId: number;
  tiersNom?: string;
  tiersType?: string;
  paiements: Paiement[];
  montantPaye: number;
  resteAPayer: number;
}

export interface CreateFactureDto {
  numero: string;
  date: string;
  dateEcheance?: string;
  montant: number;
  statut?: FactureStatut;
  notes?: string;
  tiersId: number;
}

export type UpdateFactureDto = Partial<CreateFactureDto>;

export interface AddPaiementDto {
  date: string;
  montant: number;
  mode: PaiementMode;
  reference?: string;
}
