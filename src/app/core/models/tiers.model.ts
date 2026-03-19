export type TiersType = 'CLIENT' | 'FOURNISSEUR';

export interface Tiers {
  id: number;
  nom: string;
  type: TiersType;
  siret?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  accountId?: number;
  accountCode?: string;
  accountName?: string;
}

export interface TiersSolde {
  tiersId: number;
  nom: string;
  type: TiersType;
  montantFacture: number;
  montantPaye: number;
  solde: number;
}

export interface CreateTiersDto {
  nom: string;
  type: TiersType;
  siret?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  accountId?: number;
}

export type UpdateTiersDto = Partial<CreateTiersDto>;
