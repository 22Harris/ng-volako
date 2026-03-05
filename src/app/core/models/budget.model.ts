export interface BudgetLigne {
  id: number;
  categorie: string;   // ex: 'Loyer', 'Salaires', 'Ventes', ...
  libelle: string;
  montantPrevu: number; // centimes
  montantReel?: number; // calculé depuis operations/journal
  type: 'CHARGE' | 'PRODUIT';
}

export interface Budget {
  id: number;
  exercice: number; // année (ex: 2026)
  mois: number;     // 1-12
  lignes: BudgetLigne[];
}

export interface CreateBudgetDto extends Omit<Budget, 'id'> {}
export interface UpdateBudgetDto extends Partial<CreateBudgetDto> {}
