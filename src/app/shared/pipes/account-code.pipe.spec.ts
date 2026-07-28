import { AccountCodePipe } from './account-code.pipe';
import { Account } from '../../core/models/account.model';

describe('AccountCodePipe', () => {
  const pipe = new AccountCodePipe();
  const accounts: Account[] = [
    { id: 1, code: '512', name: 'Banque', class: 5 },
    { id: 2, code: '401', name: 'Fournisseurs', class: 4 },
  ];

  it('résout un id en "code – nom"', () => {
    expect(pipe.transform(1, accounts)).toBe('512 – Banque');
    expect(pipe.transform(2, accounts)).toBe('401 – Fournisseurs');
  });

  it('retourne "#id" si le compte est introuvable', () => {
    expect(pipe.transform(999, accounts)).toBe('#999');
  });

  it('retourne "#id" si la liste est vide', () => {
    expect(pipe.transform(1, [])).toBe('#1');
  });
});
