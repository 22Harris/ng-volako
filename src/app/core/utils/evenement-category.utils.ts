import { EvenementCategorie, EvenementRecurrence, EvenementStatut } from '../models/evenement.model';

export interface CategorieMeta {
  label: string;
  icon: string;
  bg: string;
  fg: string;
}

export const CATEGORIE_CONFIG: Record<EvenementCategorie, CategorieMeta> = {
  LOYER:        { label: 'Loyer',         icon: 'home',               bg: '#ede7f6', fg: '#6a1b9a' },
  ECOLAGE:      { label: 'Écolage',       icon: 'school',             bg: '#e3f2fd', fg: '#1565c0' },
  CARBURANT:    { label: 'Carburant',     icon: 'local_gas_station',  bg: '#fff3e0', fg: '#e65100' },
  EPARGNE:      { label: 'Épargne',       icon: 'savings',            bg: '#e8f5e9', fg: '#2e7d32' },
  ALIMENTATION: { label: 'Alimentation',  icon: 'restaurant',         bg: '#fff8e1', fg: '#f57f17' },
  SANTE:        { label: 'Santé',         icon: 'local_hospital',     bg: '#fce4ec', fg: '#880e4f' },
  TRANSPORT:    { label: 'Transport',     icon: 'directions_bus',     bg: '#e0f7fa', fg: '#006064' },
  ABONNEMENT:   { label: 'Abonnement',    icon: 'subscriptions',      bg: '#fde8e8', fg: '#b71c1c' },
  LOISIRS:      { label: 'Loisirs',       icon: 'sports_esports',     bg: '#f3e5f5', fg: '#4a148c' },
  AUTRE:        { label: 'Autre',         icon: 'category',           bg: '#eceff1', fg: '#455a64' },
};

export const RECURRENCE_CONFIG: Record<EvenementRecurrence, { label: string; icon: string }> = {
  MENSUEL:      { label: 'Mensuel',       icon: 'repeat' },
  HEBDOMADAIRE: { label: 'Hebdomadaire',  icon: 'repeat' },
  ANNUEL:       { label: 'Annuel',        icon: 'event_repeat' },
  UNIQUE:       { label: 'Unique',        icon: 'looks_one' },
};

export const STATUT_CONFIG: Record<EvenementStatut, { label: string; bg: string; fg: string; icon: string }> = {
  EN_ATTENTE: { label: 'En attente', bg: '#fff8e1', fg: '#f57f17', icon: 'schedule' },
  PAYE:       { label: 'Payé',       bg: '#e8f5e9', fg: '#2e7d32', icon: 'check_circle' },
  EN_RETARD:  { label: 'En retard',  bg: '#fde8e8', fg: '#b71c1c', icon: 'warning' },
};

export const ALL_CATEGORIES = Object.keys(CATEGORIE_CONFIG) as EvenementCategorie[];
