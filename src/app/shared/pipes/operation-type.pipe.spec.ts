import { OperationTypePipe } from './operation-type.pipe';
import { OperationType } from '../../core/models/operation.model';

describe('OperationTypePipe', () => {
  const pipe = new OperationTypePipe();

  it('retourne le libellé français pour PURCHASE', () => {
    expect(pipe.transform(OperationType.PURCHASE)).toBe('Achat');
  });

  it('retourne le libellé français pour SALE', () => {
    expect(pipe.transform(OperationType.SALE)).toBe('Vente');
  });

  it('retourne le libellé français pour PAYMENT', () => {
    expect(pipe.transform(OperationType.PAYMENT)).toBe('Paiement');
  });

  it('retourne le champ icon quand demandé', () => {
    expect(pipe.transform(OperationType.PURCHASE, 'icon')).toBe('shopping_cart');
  });

  it('retourne le champ colorClass quand demandé', () => {
    expect(pipe.transform(OperationType.SALE, 'colorClass')).toBe('badge-green');
  });

  it('retourne le type brut si le type est inconnu', () => {
    expect(pipe.transform('UNKNOWN_TYPE' as OperationType)).toBe('UNKNOWN_TYPE');
  });
});
