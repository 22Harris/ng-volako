import { Pipe, PipeTransform } from '@angular/core';
import { Account } from '../../core/models/account.model';

@Pipe({ name: 'accountCode', standalone: true })
export class AccountCodePipe implements PipeTransform {
  transform(id: number, accounts: Account[]): string {
    const acc = accounts.find(a => a.id === id);
    return acc ? `${acc.code} – ${acc.name}` : `#${id}`;
  }
}
