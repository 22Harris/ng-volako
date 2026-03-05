import { Account } from '../models/account.model';
import { Operation, OperationType } from '../models/operation.model';
import { JournalEntry } from '../models/journal-entry.model';
import { Evenement } from '../models/evenement.model';

// ── Comptes (Plan comptable) ──────────────────────────────────────────────────
export const MOCK_ACCOUNTS: Account[] = [
  // Classe 1 — Capitaux permanents
  { id: 1,  code: '101', name: 'Capital social',              class: 1,
    journalLines: [{ id: 1,  accountId: 1,  debit: 0,        credit: 10000000 }] },
  { id: 2,  code: '106', name: 'Réserves légales',            class: 1,
    journalLines: [{ id: 2,  accountId: 2,  debit: 0,        credit: 1500000  }] },
  // Classe 2 — Immobilisations
  { id: 3,  code: '215', name: 'Matériel informatique',       class: 2,
    journalLines: [{ id: 3,  accountId: 3,  debit: 850000,   credit: 0        }] },
  { id: 4,  code: '218', name: 'Mobilier de bureau',          class: 2,
    journalLines: [{ id: 4,  accountId: 4,  debit: 320000,   credit: 0        }] },
  // Classe 3 — Stocks
  { id: 5,  code: '370', name: 'Stocks de marchandises',      class: 3,
    journalLines: [{ id: 5,  accountId: 5,  debit: 520000,   credit: 0        }] },
  // Classe 4 — Tiers
  { id: 6,  code: '401', name: 'Fournisseurs',                class: 4,
    journalLines: [{ id: 6,  accountId: 6,  debit: 0,        credit: 840000   }] },
  { id: 7,  code: '411', name: 'Clients',                     class: 4,
    journalLines: [{ id: 7,  accountId: 7,  debit: 1260000,  credit: 0        }] },
  { id: 8,  code: '421', name: 'Personnel — rémunérations',   class: 4,
    journalLines: [{ id: 8,  accountId: 8,  debit: 0,        credit: 280000   }] },
  { id: 9,  code: '445', name: 'TVA collectée',               class: 4,
    journalLines: [{ id: 9,  accountId: 9,  debit: 0,        credit: 164000   }] },
  // Classe 5 — Financiers
  { id: 10, code: '512', name: 'Banque CIC',                  class: 5,
    journalLines: [
      { id: 10, accountId: 10, debit: 5840000, credit: 0      },
      { id: 11, accountId: 10, debit: 0,       credit: 408500 },
    ] },
  { id: 11, code: '530', name: 'Caisse',                      class: 5,
    journalLines: [{ id: 12, accountId: 11, debit: 85000,   credit: 0        }] },
  // Classe 6 — Charges
  { id: 12, code: '601', name: 'Achats de marchandises',      class: 6,
    journalLines: [{ id: 13, accountId: 12, debit: 185000,  credit: 0        }] },
  { id: 13, code: '615', name: 'Loyer et charges locatives',  class: 6,
    journalLines: [{ id: 14, accountId: 13, debit: 120000,  credit: 0        }] },
  { id: 14, code: '641', name: 'Salaires et traitements',     class: 6,
    journalLines: [{ id: 15, accountId: 14, debit: 280000,  credit: 0        }] },
  { id: 15, code: '616', name: "Primes d'assurance",          class: 6,
    journalLines: [{ id: 16, accountId: 15, debit: 24000,   credit: 0        }] },
  { id: 16, code: '626', name: 'Frais postaux et télécom.',   class: 6,
    journalLines: [{ id: 17, accountId: 16, debit: 8500,    credit: 0        }] },
  // Classe 7 — Produits
  { id: 17, code: '701', name: 'Ventes de produits finis',    class: 7,
    journalLines: [{ id: 18, accountId: 17, debit: 0,       credit: 820000   }] },
  { id: 18, code: '706', name: 'Prestations de services',     class: 7,
    journalLines: [{ id: 19, accountId: 18, debit: 0,       credit: 145000   }] },
  { id: 19, code: '758', name: 'Produits divers de gestion',  class: 7,
    journalLines: [{ id: 20, accountId: 19, debit: 0,       credit: 12000    }] },
  // Classe 8 — Résultats
  { id: 20, code: '890', name: "Bilan d'ouverture",           class: 8, journalLines: [] },
];

// ── Écritures de journal ──────────────────────────────────────────────────────
export const MOCK_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: 1, date: '2026-03-01',
    label: 'Vente Société Alpha — Facture 2026-018',
    operationId: 1,
    lines: [
      { id: 1, accountId: 7,  debit: 984000, credit: 0      }, // 411 Clients TTC
      { id: 2, accountId: 17, debit: 0,      credit: 820000 }, // 701 Ventes HT
      { id: 3, accountId: 9,  debit: 0,      credit: 164000 }, // 445 TVA
    ],
  },
  {
    id: 2, date: '2026-02-28',
    label: 'Salaires mars 2026',
    operationId: 2,
    lines: [
      { id: 4, accountId: 14, debit: 280000, credit: 0      }, // 641 Salaires
      { id: 5, accountId: 8,  debit: 0,      credit: 280000 }, // 421 Personnel
    ],
  },
  {
    id: 3, date: '2026-02-26',
    label: 'Achat stock Fournisseur Beta — FA 20240892',
    operationId: 3,
    lines: [
      { id: 6, accountId: 12, debit: 185000, credit: 0      }, // 601 Achats
      { id: 7, accountId: 6,  debit: 0,      credit: 185000 }, // 401 Fournisseurs
    ],
  },
  {
    id: 4, date: '2026-02-25',
    label: 'Loyer bureau mars 2026',
    operationId: 4,
    lines: [
      { id: 8,  accountId: 13, debit: 120000, credit: 0      }, // 615 Loyer
      { id: 9,  accountId: 10, debit: 0,      credit: 120000 }, // 512 Banque
    ],
  },
  {
    id: 5, date: '2026-02-22',
    label: 'Règlement facture EDF Entreprises',
    operationId: 5,
    lines: [
      { id: 10, accountId: 16, debit: 8500, credit: 0    }, // 626 Télécom/frais
      { id: 11, accountId: 10, debit: 0,    credit: 8500 }, // 512 Banque
    ],
  },
  {
    id: 6, date: '2026-02-20',
    label: 'Prestation conseil Client Gamma — Facture 2026-017',
    operationId: 6,
    lines: [
      { id: 12, accountId: 7,  debit: 174000, credit: 0      }, // 411 Clients TTC
      { id: 13, accountId: 18, debit: 0,      credit: 145000 }, // 706 Prestations HT
      { id: 14, accountId: 9,  debit: 0,      credit: 29000  }, // 445 TVA
    ],
  },
  {
    id: 7, date: '2026-02-15',
    label: 'Mensualité crédit équipement',
    operationId: 7,
    lines: [
      { id: 15, accountId: 10, debit: 0,     credit: 62000 }, // 512 Banque
      { id: 16, accountId: 6,  debit: 62000, credit: 0     }, // 401 (remboursement)
    ],
  },
  {
    id: 8, date: '2026-02-10',
    label: 'Règlement client Delta — Facture 2026-014',
    lines: [
      { id: 17, accountId: 10, debit: 280500, credit: 0      }, // 512 Banque
      { id: 18, accountId: 7,  debit: 0,      credit: 280500 }, // 411 Clients
    ],
  },
];

// ── Opérations ────────────────────────────────────────────────────────────────
export const MOCK_OPERATIONS: Operation[] = [
  {
    id: 1,  type: OperationType.SALE,
    label: 'Vente — Société Alpha',
    date:  '2026-03-01', amount: 1260000,
    entries: [MOCK_JOURNAL_ENTRIES[0]],
  },
  {
    id: 2,  type: OperationType.SALARY_PAYMENT,
    label: 'Salaires mars 2026',
    date:  '2026-02-28', amount: 280000,
    entries: [MOCK_JOURNAL_ENTRIES[1]],
  },
  {
    id: 3,  type: OperationType.PURCHASE,
    label: 'Achat stock — Fournisseur Beta',
    date:  '2026-02-26', amount: 185000,
    entries: [MOCK_JOURNAL_ENTRIES[2]],
  },
  {
    id: 4,  type: OperationType.SERVICE_EXPENSE,
    label: 'Loyer local commercial mars 2026',
    date:  '2026-02-25', amount: 120000,
    entries: [MOCK_JOURNAL_ENTRIES[3]],
  },
  {
    id: 5,  type: OperationType.PAYMENT,
    label: 'Règlement facture EDF Entreprises',
    date:  '2026-02-22', amount: 8500,
    entries: [MOCK_JOURNAL_ENTRIES[4]],
  },
  {
    id: 6,  type: OperationType.SERVICE_INCOME,
    label: 'Prestation conseil — Client Gamma',
    date:  '2026-02-20', amount: 350000,
    entries: [MOCK_JOURNAL_ENTRIES[5]],
  },
  {
    id: 7,  type: OperationType.LOAN_REPAYMENT,
    label: 'Mensualité crédit équipement',
    date:  '2026-02-15', amount: 45000,
    entries: [MOCK_JOURNAL_ENTRIES[6]],
  },
  {
    id: 8,  type: OperationType.RECEIPT,
    label: 'Encaissement client Delta',
    date:  '2026-02-10', amount: 840000,
    entries: [MOCK_JOURNAL_ENTRIES[7]],
  },
  {
    id: 9,  type: OperationType.SOCIAL_CONTRIBUTION,
    label: 'Cotisations URSSAF — février',
    date:  '2026-02-08', amount: 62000,
    entries: [],
  },
  {
    id: 10, type: OperationType.VAT_COLLECTED,
    label: 'TVA à reverser — janvier',
    date:  '2026-02-05', amount: 164000,
    entries: [],
  },
];

// ── Événements (dépenses récurrentes) ─────────────────────────────────────────
export const MOCK_EVENEMENTS: Evenement[] = [
  {
    id: 1, titre: 'Loyer appartement', categorie: 'LOYER',
    montant: 35000000, dateEcheance: '2026-03-05',
    recurrence: 'MENSUEL', statut: 'PAYE',
    notes: 'Virement automatique le 5 du mois',
  },
  {
    id: 2, titre: 'Écolage — École Primaire', categorie: 'ECOLAGE',
    montant: 12000000, dateEcheance: '2026-03-10',
    recurrence: 'MENSUEL', statut: 'EN_ATTENTE',
  },
  {
    id: 3, titre: 'Carburant véhicule', categorie: 'CARBURANT',
    montant: 8000000, dateEcheance: '2026-03-15',
    recurrence: 'MENSUEL', statut: 'EN_ATTENTE',
    notes: 'Estimation mensuelle',
  },
  {
    id: 4, titre: 'Épargne mensuelle', categorie: 'EPARGNE',
    montant: 20000000, dateEcheance: '2026-03-01',
    recurrence: 'MENSUEL', statut: 'PAYE',
    notes: 'Virement vers compte épargne',
  },
  {
    id: 5, titre: 'Internet + Mobile', categorie: 'ABONNEMENT',
    montant: 4500000, dateEcheance: '2026-03-20',
    recurrence: 'MENSUEL', statut: 'EN_RETARD',
  },
  {
    id: 6, titre: 'Courses alimentaires', categorie: 'ALIMENTATION',
    montant: 15000000, dateEcheance: '2026-03-07',
    recurrence: 'MENSUEL', statut: 'PAYE',
  },
  {
    id: 7, titre: 'Consultation médecin', categorie: 'SANTE',
    montant: 3000000, dateEcheance: '2026-03-25',
    recurrence: 'UNIQUE', statut: 'EN_ATTENTE',
    notes: 'Bilan annuel',
  },
  {
    id: 8, titre: 'Assurance véhicule', categorie: 'TRANSPORT',
    montant: 9000000, dateEcheance: '2026-03-30',
    recurrence: 'ANNUEL', statut: 'EN_ATTENTE',
    notes: 'Renouvellement annuel',
  },
];
