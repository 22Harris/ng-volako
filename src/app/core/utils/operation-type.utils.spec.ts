import {
  OPERATION_TYPE_CONFIG,
  CATEGORY_LABELS,
  OPERATION_TYPES_BY_CATEGORY,
  OperationCategory,
} from './operation-type.utils';
import { OperationType } from '../models/operation.model';

describe('operation-type.utils', () => {
  const allTypes = Object.keys(OPERATION_TYPE_CONFIG) as OperationType[];

  it('décrit les 30 types d\'opération', () => {
    expect(allTypes.length).toBe(30);
  });

  it('chaque type référence une catégorie connue de CATEGORY_LABELS', () => {
    for (const type of allTypes) {
      const cat = OPERATION_TYPE_CONFIG[type].category;
      expect(CATEGORY_LABELS[cat]).toBeDefined();
    }
  });

  it('chaque config a un label, une icône et une classe de couleur non vides', () => {
    for (const type of allTypes) {
      const cfg = OPERATION_TYPE_CONFIG[type];
      expect(cfg.label.length).toBeGreaterThan(0);
      expect(cfg.icon.length).toBeGreaterThan(0);
      expect(cfg.colorClass.startsWith('badge-')).toBe(true);
    }
  });

  describe('OPERATION_TYPES_BY_CATEGORY', () => {
    it('regroupe tous les types sans perte ni doublon', () => {
      const grouped = Object.values(OPERATION_TYPES_BY_CATEGORY).flat();
      expect(grouped.length).toBe(allTypes.length);
      expect(new Set(grouped).size).toBe(allTypes.length);
    });

    it('place chaque type dans le groupe de sa propre catégorie', () => {
      for (const type of allTypes) {
        const cat = OPERATION_TYPE_CONFIG[type].category;
        expect(OPERATION_TYPES_BY_CATEGORY[cat]).toContain(type);
      }
    });

    it('groupe EXPLOITATION contient achat et vente', () => {
      const exploitation: OperationCategory = 'EXPLOITATION';
      expect(OPERATION_TYPES_BY_CATEGORY[exploitation]).toEqual(
        expect.arrayContaining([OperationType.PURCHASE, OperationType.SALE]),
      );
    });
  });
});
