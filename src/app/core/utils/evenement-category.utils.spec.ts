import {
  CATEGORIE_CONFIG,
  RECURRENCE_CONFIG,
  STATUT_CONFIG,
  ALL_CATEGORIES,
} from './evenement-category.utils';

describe('evenement-category.utils', () => {
  it('ALL_CATEGORIES reflète exactement les clés de CATEGORIE_CONFIG', () => {
    expect(ALL_CATEGORIES).toEqual(Object.keys(CATEGORIE_CONFIG));
  });

  it('chaque catégorie a un label, une icône et des couleurs hexadécimales', () => {
    const hex = /^#[0-9a-fA-F]{3,8}$/;
    for (const meta of Object.values(CATEGORIE_CONFIG)) {
      expect(meta.label.length).toBeGreaterThan(0);
      expect(meta.icon.length).toBeGreaterThan(0);
      expect(meta.bg).toMatch(hex);
      expect(meta.fg).toMatch(hex);
    }
  });

  it('chaque récurrence a un label et une icône', () => {
    for (const meta of Object.values(RECURRENCE_CONFIG)) {
      expect(meta.label.length).toBeGreaterThan(0);
      expect(meta.icon.length).toBeGreaterThan(0);
    }
  });

  it('expose les trois statuts attendus', () => {
    expect(Object.keys(STATUT_CONFIG).sort()).toEqual(['EN_ATTENTE', 'EN_RETARD', 'PAYE']);
  });
});
